import { describe, expect, it } from 'vitest';
import {
  averageRating,
  bestLog,
  daysOffRoast,
  logsForRecipe,
  restingAdvice,
  suggestAdjustment,
} from './dialIn';
import type { BrewLog } from '../types';

const log = (over: Partial<BrewLog> = {}): BrewLog => ({
  id: 'l1',
  recipeId: 'r1',
  recipeTitle: '4666 V2',
  brewedAt: '2026-09-01T08:00:00.000Z',
  beanG: 18,
  waterG: 220,
  tempC: 93,
  ...over,
});

describe('suggestAdjustment', () => {
  it('신맛이면 가늘게 갈라고 한다', () => {
    expect(suggestAdjustment('sour').headline).toBe('분쇄도를 한 클릭 가늘게');
  });

  it('쓴맛이면 굵게 갈라고 한다', () => {
    expect(suggestAdjustment('bitter').headline).toBe('분쇄도를 한 클릭 굵게');
  });

  it('연하면 분쇄도가 아니라 원두량을 먼저 본다', () => {
    expect(suggestAdjustment('weak').headline).toContain('원두량');
  });

  it('진하면 희석부터 제안한다', () => {
    expect(suggestAdjustment('strong').headline).toContain('가수');
  });

  it('좋았으면 바꾸지 말라고 한다', () => {
    expect(suggestAdjustment('balanced').headline).toBe('이대로 반복');
  });

  it('제안은 항상 한 가지이고 대안은 따로 둔다', () => {
    for (const taste of ['sour', 'bitter', 'weak', 'strong', 'balanced'] as const) {
      const a = suggestAdjustment(taste);
      expect(a.headline).not.toContain(',');
      expect(a.reason.length).toBeGreaterThan(10);
      expect(a.alternatives.length).toBeGreaterThan(0);
    }
  });

  it('추출이 많이 느렸으면 맛보다 흐름을 먼저 잡는다', () => {
    // 신맛이지만 시간이 크게 초과 → 평소 같으면 "가늘게"지만 여기서는 "굵게"
    const a = suggestAdjustment('sour', { targetSec: 150, actualSec: 240 });
    expect(a.headline).toBe('분쇄도를 굵게');
    expect(a.reason).toContain('오래 걸렸습니다');
  });

  it('추출이 많이 빨랐으면 가늘게', () => {
    const a = suggestAdjustment('bitter', { targetSec: 150, actualSec: 90 });
    expect(a.headline).toBe('분쇄도를 가늘게');
  });

  it('시간이 목표 근처면 맛 판정을 따른다', () => {
    const a = suggestAdjustment('bitter', { targetSec: 150, actualSec: 160 });
    expect(a.headline).toBe('분쇄도를 한 클릭 굵게');
  });
});

describe('daysOffRoast', () => {
  const now = new Date(2026, 8, 22); // 2026-09-22

  it('지난 일수를 센다', () => {
    expect(daysOffRoast('2026-09-15', now)).toBe(7);
    expect(daysOffRoast('2026-09-22', now)).toBe(0);
  });

  it('날짜가 없거나 이상하면 null', () => {
    expect(daysOffRoast(undefined, now)).toBeNull();
    expect(daysOffRoast('어제', now)).toBeNull();
  });
});

describe('restingAdvice', () => {
  it('구간별로 다르게 말한다', () => {
    expect(restingAdvice(1)?.tone).toBe('early');
    expect(restingAdvice(10)?.tone).toBe('good');
    expect(restingAdvice(30)?.tone).toBe('late');
    expect(restingAdvice(60)?.tone).toBe('late');
  });
  it('날짜가 없으면 아무 말도 하지 않는다', () => {
    expect(restingAdvice(null)).toBeNull();
  });
});

describe('기록 집계', () => {
  const logs = [
    log({ id: 'a', recipeId: 'r1', rating: 3, brewedAt: '2026-09-01T00:00:00.000Z' }),
    log({ id: 'b', recipeId: 'r1', rating: 5, brewedAt: '2026-09-05T00:00:00.000Z' }),
    log({ id: 'c', recipeId: 'r2', rating: 1, brewedAt: '2026-09-07T00:00:00.000Z' }),
    log({ id: 'd', recipeId: 'r1', brewedAt: '2026-09-09T00:00:00.000Z' }),
  ];

  it('레시피별로 최신순으로 모은다', () => {
    expect(logsForRecipe(logs, 'r1').map((l) => l.id)).toEqual(['d', 'b', 'a']);
  });

  it('별점 없는 기록은 평균에서 뺀다', () => {
    expect(averageRating(logsForRecipe(logs, 'r1'))).toBe(4);
    expect(averageRating([log()])).toBeNull(); // 별점이 달리지 않은 기록
  });

  it('가장 잘 나온 기록을 찾는다', () => {
    expect(bestLog(logsForRecipe(logs, 'r1'))?.id).toBe('b');
    expect(bestLog([])).toBeNull();
  });
});
