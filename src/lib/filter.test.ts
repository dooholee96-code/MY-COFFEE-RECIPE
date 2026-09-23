import { describe, expect, it } from 'vitest';
import { defaultFilters, filterRecipes, hasActiveFilters } from './filter';
import { seedRecipes } from '../data/recipes';
import type { Filters } from '../types';

const none = new Set<string>();
const f = (over: Partial<Filters> = {}): Filters => ({ ...defaultFilters, ...over });

describe('filterRecipes', () => {
  it('기본 상태에서 드립 레시피를 모두 보여준다', () => {
    expect(filterRecipes(seedRecipes, f(), none)).toHaveLength(17);
  });

  it('아직 레시피가 없는 카테고리는 빈 목록', () => {
    expect(filterRecipes(seedRecipes, f({ category: 'espresso' }), none)).toHaveLength(0);
    expect(filterRecipes(seedRecipes, f({ category: 'mokapot' }), none)).toHaveLength(0);
  });

  it('HOT/ICE 로 가른다', () => {
    expect(filterRecipes(seedRecipes, f({ serve: 'hot' }), none)).toHaveLength(8);
    expect(filterRecipes(seedRecipes, f({ serve: 'ice' }), none)).toHaveLength(9);
  });

  it('배전도 any 레시피는 어떤 배전도 필터에도 함께 나온다', () => {
    const light = filterRecipes(seedRecipes, f({ roast: 'light' }), none);
    expect(light.map((r) => r.id)).toContain('v60-clean-hot'); // roast: 'any'
    expect(light.map((r) => r.id)).toContain('4666-v2-hot'); // roast: 'light'
    expect(light.map((r) => r.id)).not.toContain('484-original-hot'); // roast: 'dark'
  });

  it('드리퍼로 가른다', () => {
    const kalita = filterRecipes(seedRecipes, f({ dripper: 'kalita' }), none);
    expect(kalita.every((r) => r.dripperType === 'kalita')).toBe(true);
    expect(kalita).toHaveLength(2); // 리이케 핫/아이스 — 484 는 원문대로 V60
  });

  it('필터를 겹쳐 쓸 수 있다', () => {
    const got = filterRecipes(seedRecipes, f({ serve: 'ice', roast: 'dark', dripper: 'v60' }), none);
    // 범용(any) 배전도 레시피는 다크 필터에도 함께 나온다
    expect(got.map((r) => r.id)).toEqual(['v60-clean-ice', 'jungins-ice', '484-ice']);
  });

  it('제목·작성자·메모·그라인더 세팅을 검색한다', () => {
    expect(filterRecipes(seedRecipes, f({ query: '카스야' }), none)).toHaveLength(2);
    expect(filterRecipes(seedRecipes, f({ query: '용챔' }), none)).toHaveLength(2);
    expect(filterRecipes(seedRecipes, f({ query: 'EK43' }), none)).toHaveLength(3);
    expect(filterRecipes(seedRecipes, f({ query: '교반' }), none)).toHaveLength(2);
  });

  it('검색어는 대소문자를 가리지 않고, 공백으로 나눠 모두 포함해야 한다', () => {
    expect(filterRecipes(seedRecipes, f({ query: 'ek43' }), none)).toHaveLength(3);
    expect(filterRecipes(seedRecipes, f({ query: '안스타 8인분' }), none)).toHaveLength(2);
    expect(filterRecipes(seedRecipes, f({ query: '안스타 존재하지않음' }), none)).toHaveLength(0);
  });

  it('즐겨찾기만 보기', () => {
    const favs = new Set(['4666-v2-hot', '484-ice']);
    const got = filterRecipes(seedRecipes, f({ favoritesOnly: true }), favs);
    expect(got.map((r) => r.id).sort()).toEqual(['4666-v2-hot', '484-ice']);
  });
});

describe('hasActiveFilters', () => {
  it('카테고리 변경은 필터로 세지 않는다', () => {
    expect(hasActiveFilters(f())).toBe(false);
    expect(hasActiveFilters(f({ category: 'capsule' }))).toBe(false);
  });
  it('나머지는 필터로 센다', () => {
    expect(hasActiveFilters(f({ roast: 'dark' }))).toBe(true);
    expect(hasActiveFilters(f({ query: '  ' }))).toBe(false);
    expect(hasActiveFilters(f({ query: '카스야' }))).toBe(true);
    expect(hasActiveFilters(f({ favoritesOnly: true }))).toBe(true);
  });
});
