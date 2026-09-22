import { describe, expect, it } from 'vitest';
import { seedRecipes } from './recipes';
import { brewRatio } from '../lib/brew';

describe('seedRecipes 정합성', () => {
  it('id 가 중복되지 않는다', () => {
    const ids = seedRecipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('v1 의 17개 레시피를 모두 옮겼다', () => {
    expect(seedRecipes).toHaveLength(17);
    expect(seedRecipes.filter((r) => r.serve === 'hot')).toHaveLength(8);
    expect(seedRecipes.filter((r) => r.serve === 'ice')).toHaveLength(9);
  });

  it('단계별 투입량의 합이 총 투입량과 같다', () => {
    for (const r of seedRecipes) {
      if (r.steps.some((s) => s.waterG === null)) continue; // 눈대중 레시피는 제외
      const sum = r.steps.reduce((acc, s) => acc + (s.waterG ?? 0), 0);
      expect(sum, `${r.id}: 단계 합 ${sum} vs waterG ${r.waterG}`).toBe(r.waterG);
    }
  });

  it('시각이 정해진 단계는 시간순으로 늘어난다', () => {
    for (const r of seedRecipes) {
      const times = r.steps.map((s) => s.atSec).filter((t): t is number => t !== null);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]!, `${r.id} 단계 ${i}`).toBeGreaterThan(times[i - 1]!);
      }
    }
  });

  it('목표 종료 시각이 마지막 단계보다 이르지 않다', () => {
    for (const r of seedRecipes) {
      const last = r.steps.map((s) => s.atSec).filter((t): t is number => t !== null).pop() ?? 0;
      expect(r.totalSec, r.id).toBeGreaterThanOrEqual(last);
    }
  });

  it('물/원두 비율이 현실적인 범위에 있다', () => {
    for (const r of seedRecipes) {
      // 카페오레 진액(1:4.5)부터 대용량 드립(1:15)까지
      expect(brewRatio(r), r.id).toBeGreaterThan(3);
      expect(brewRatio(r), r.id).toBeLessThan(20);
    }
  });

  it('HOT/ICE 변형은 family 로 짝지어져 있다', () => {
    const families = new Map<string, string[]>();
    for (const r of seedRecipes) {
      if (!r.family) continue;
      families.set(r.family, [...(families.get(r.family) ?? []), r.serve]);
    }
    expect(families.size).toBe(8);
    for (const [family, serves] of families) {
      expect(serves.sort(), family).toEqual(['hot', 'ice']);
    }
  });

  it('드립 레시피에는 드리퍼 종류가 있다', () => {
    for (const r of seedRecipes.filter((x) => x.category === 'drip')) {
      expect(r.dripperType, r.id).toBeDefined();
    }
  });

  it('유튜브 링크는 http(s) URL 이다', () => {
    for (const r of seedRecipes) {
      if (!r.youtubeUrl) continue;
      expect(() => new URL(r.youtubeUrl!), r.id).not.toThrow();
      expect(r.youtubeUrl, r.id).toMatch(/^https:\/\//);
    }
  });
});
