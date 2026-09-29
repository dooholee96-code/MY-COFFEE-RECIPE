import { describe, expect, it } from 'vitest';
import { describePour, hasPourInfo, pourCycleSec } from './pour';
import { seedRecipes } from '../data/recipes';

const byId = (id: string) => {
  const r = seedRecipes.find((x) => x.id === id);
  if (!r) throw new Error(id);
  return r;
};

describe('describePour', () => {
  it('정보가 없으면 빈 문자열', () => {
    expect(describePour(undefined)).toBe('');
    expect(describePour({})).toBe('');
  });
  it('궤적 → 굵기 → 속도 → 교반 순으로 적는다', () => {
    expect(describePour({ agitation: 'stir', pace: 'slow', flow: 'thin', pattern: 'spiral' })).toBe(
      '나선 · 가는 물줄기 · 천천히 · 교반',
    );
    expect(describePour({ flow: 'thick', pace: 'fast' })).toBe('굵은 물줄기 · 빠르게');
  });
});

describe('pourCycleSec', () => {
  it('빠르게는 짧고 천천히는 길다', () => {
    expect(pourCycleSec({ pace: 'fast' })).toBeLessThan(pourCycleSec({}));
    expect(pourCycleSec({ pace: 'slow' })).toBeGreaterThan(pourCycleSec({}));
  });
  it('천천히와 빠르게는 눈으로 구분될 만큼 차이 난다 (3배 이상)', () => {
    expect(pourCycleSec({ pace: 'slow' }) / pourCycleSec({ pace: 'fast' })).toBeGreaterThanOrEqual(3);
  });
});

describe('레시피의 붓는 방식', () => {
  it('카스야 4:6 은 모든 푸어가 나선이고 출처가 있다', () => {
    for (const id of ['kasuya-46-hot', 'kasuya-46-ice']) {
      const r = byId(id);
      expect(r.steps.every((s) => s.pour?.pattern === 'spiral'), id).toBe(true);
      expect(r.pourSource, id).toBeTruthy();
    }
  });

  it('484 는 원문대로 80g 을 가운데에 천천히 → 40g 큰 원', () => {
    for (const id of ['484-original-hot', '484-ice']) {
      const r = byId(id);
      expect(r.steps.map((s) => s.pour?.pattern), id).toEqual([undefined, 'center', 'large-circle']);
      expect(r.steps[1]?.pour?.pace, id).toBe('slow');
      expect(r.pourSource, id).toContain('정인성 40 80 40');
    }
  });

  it('V60 깔끔 레시피는 회차마다 물줄기가 굵어진다', () => {
    expect(byId('v60-clean-hot').steps.map((s) => s.pour?.flow)).toEqual([undefined, 'thin', 'medium', 'thick']);
  });

  it('원본에 없는 정보는 만들어 넣지 않았다 (4666, 6888)', () => {
    for (const id of ['4666-v2-hot', '4666-v2-ice', 'ansta-6888-hot', 'ansta-6888-ice']) {
      expect(hasPourInfo(byId(id).steps), id).toBe(false);
    }
  });

  it('붓는 방식은 hint 에 중복해서 적지 않는다', () => {
    for (const r of seedRecipes) {
      for (const s of r.steps) {
        if (!s.pour) continue;
        expect(s.hint ?? '', `${r.id} ${s.label}`).not.toMatch(/물줄기|작은 원|큰 원|교반|굵고 빠르게|가늘게|천천히/);
      }
    }
  });
});
