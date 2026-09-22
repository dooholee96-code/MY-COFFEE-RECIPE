import type { Filters, Recipe } from '../types';

/** 검색 대상 문자열을 하나로 합친다 */
function haystack(r: Recipe): string {
  return [r.title, r.tag, r.author, r.note, r.gear, r.grind, ...(r.grinderSettings ?? []).map((s) => `${s.grinder} ${s.setting}`)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesFilters(r: Recipe, f: Filters, favorites: ReadonlySet<string>): boolean {
  if (r.category !== f.category) return false;

  // roast 'any' 인 레시피는 어떤 배전도 필터에도 걸리도록 둔다 (v1 과 같은 의도)
  if (f.roast !== 'all' && r.roast !== 'any' && r.roast !== f.roast) return false;

  if (f.serve !== 'all' && r.serve !== f.serve) return false;

  // 드리퍼 필터는 드립 카테고리에서만 의미가 있다
  if (f.category === 'drip' && f.dripper !== 'all' && r.dripperType !== f.dripper) return false;

  if (f.favoritesOnly && !favorites.has(r.id)) return false;

  const q = f.query.trim().toLowerCase();
  if (q && !q.split(/\s+/).every((term) => haystack(r).includes(term))) return false;

  return true;
}

export function filterRecipes(recipes: Recipe[], f: Filters, favorites: ReadonlySet<string>): Recipe[] {
  return recipes.filter((r) => matchesFilters(r, f, favorites));
}

/** 필터 중 카테고리를 제외하고 하나라도 기본값이 아닌 게 있는지 */
export function hasActiveFilters(f: Filters): boolean {
  return f.roast !== 'all' || f.serve !== 'all' || f.dripper !== 'all' || f.query.trim() !== '' || f.favoritesOnly;
}

export const defaultFilters: Filters = {
  category: 'drip',
  roast: 'all',
  serve: 'all',
  dripper: 'all',
  query: '',
  favoritesOnly: false,
};
