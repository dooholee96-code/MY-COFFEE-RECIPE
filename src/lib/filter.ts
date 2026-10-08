import type { BrewLog, Category, Filters, Recipe } from '../types';
import { CATEGORIES } from './labels';

/** 검색 대상 문자열을 하나로 합친다 */
function haystack(r: Recipe): string {
  return [r.title, r.tag, r.author, r.note, r.gear, r.grind, ...(r.grinderSettings ?? []).map((s) => `${s.grinder} ${s.setting}`)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesFilters(r: Recipe, f: Filters, favorites: ReadonlySet<string>): boolean {
  // roast 'any' 인 레시피는 어떤 배전도 필터에도 걸리도록 둔다 (v1 과 같은 의도)
  if (f.roast !== 'all' && r.roast !== 'any' && r.roast !== f.roast) return false;

  if (f.serve !== 'all' && r.serve !== f.serve) return false;

  // 드리퍼를 고르면 그 드리퍼 레시피만 — 드리퍼가 없는 카테고리(모카포트 등)는 빠진다
  if (f.dripper !== 'all' && r.dripperType !== f.dripper) return false;

  if (f.favoritesOnly && !favorites.has(r.id)) return false;

  const q = f.query.trim().toLowerCase();
  if (q && !q.split(/\s+/).every((term) => haystack(r).includes(term))) return false;

  return true;
}

export function filterRecipes(recipes: Recipe[], f: Filters, favorites: ReadonlySet<string>): Recipe[] {
  return recipes.filter((r) => matchesFilters(r, f, favorites));
}

/** 필터 중 하나라도 기본값이 아닌 게 있는지 */
export function hasActiveFilters(f: Filters): boolean {
  return f.roast !== 'all' || f.serve !== 'all' || f.dripper !== 'all' || f.query.trim() !== '' || f.favoritesOnly;
}

export const defaultFilters: Filters = {
  roast: 'all',
  serve: 'all',
  dripper: 'all',
  query: '',
  favoritesOnly: false,
};

export interface RecipeGroup {
  category: Category;
  label: string;
  recipes: Recipe[];
}

/**
 * 홈 목록의 묶음. 카테고리 탭 대신 카테고리별 구역으로 보여준다 — 레시피가 없는 카테고리는
 * 구역을 만들지 않는다(빈 탭이 화면 한 줄을 차지하던 것을 없앤다). 구역 안에서는 즐겨찾기가
 * 먼저 오고, 나머지는 원래 순서를 지킨다.
 */
export function groupRecipes(recipes: Recipe[], favorites: ReadonlySet<string>): RecipeGroup[] {
  return CATEGORIES.map((cat) => {
    const inCat = recipes.filter((r) => r.category === cat.id);
    const starred = inCat.filter((r) => favorites.has(r.id));
    const rest = inCat.filter((r) => !favorites.has(r.id));
    return { category: cat.id, label: cat.label, recipes: [...starred, ...rest] };
  }).filter((g) => g.recipes.length > 0);
}

/**
 * 최근에 내린 레시피 — 기록에서 최신순으로, 레시피마다 한 번씩, 아직 있는 레시피만.
 * 홈 맨 위의 "최근" 줄이 된다: 늘 내리는 레시피로 가는 가장 짧은 길.
 */
export function recentRecipes(logs: BrewLog[], recipes: Recipe[], limit = 4): Recipe[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const seen = new Set<string>();
  const out: Recipe[] = [];
  for (const log of [...logs].sort((a, b) => b.brewedAt.localeCompare(a.brewedAt))) {
    if (seen.has(log.recipeId)) continue;
    seen.add(log.recipeId);
    const r = byId.get(log.recipeId);
    if (r) out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
