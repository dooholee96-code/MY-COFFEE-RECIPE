import { describe, expect, it } from 'vitest';
import { isBean, isBrewLog, isRecipe, sanitizeList } from './validate';
import { seedRecipes } from '../data/recipes';

describe('isRecipe', () => {
  it('기본 레시피는 전부 통과한다', () => {
    for (const r of seedRecipes) expect(isRecipe(r), r.id).toBe(true);
  });
  it('단계가 배열이 아니거나 숫자가 빠지면 걸러진다', () => {
    const base = seedRecipes[0]!;
    expect(isRecipe({ ...base, steps: 'not-an-array' })).toBe(false);
    expect(isRecipe({ ...base, beanG: '18' })).toBe(false);
    expect(isRecipe({ ...base, steps: [{ atSec: 0, label: '뜸' }] })).toBe(false); // waterG 없음
    expect(isRecipe({ ...base, steps: [{ atSec: 0, waterG: NaN, label: '뜸' }] })).toBe(false);
    expect(isRecipe(null)).toBe(false);
    expect(isRecipe([])).toBe(false);
  });
});

describe('isBrewLog / isBean', () => {
  it('필수 필드를 본다', () => {
    expect(isBrewLog({ id: 'l', recipeId: 'r', recipeTitle: 't', brewedAt: '2026-01-01', beanG: 18, waterG: 220, tempC: 93 })).toBe(true);
    expect(isBrewLog({ id: 'l', recipeId: 'r' })).toBe(false);
    expect(isBean({ id: 'b', name: '예가체프' })).toBe(true);
    expect(isBean({ id: 'b' })).toBe(false);
  });
});

describe('sanitizeList', () => {
  it('깨진 항목만 빼고 나머지는 살린다', () => {
    const good = seedRecipes[0]!;
    const got = sanitizeList([good, { id: 'bad', steps: 'x' }, good], isRecipe);
    expect(got.items).toHaveLength(2);
    expect(got.dropped).toBe(1);
  });
  it('배열이 아니면 빈 목록', () => {
    expect(sanitizeList('garbage', isRecipe)).toEqual({ items: [], dropped: 1 });
    expect(sanitizeList(undefined, isRecipe)).toEqual({ items: [], dropped: 0 });
  });
});
