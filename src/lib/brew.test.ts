import { describe, expect, it } from 'vitest';
import {
  activeStepIndex,
  brewRatio,
  cumulativeWater,
  formatRatio,
  formatSec,
  isAutoPlayable,
  servedVolumeG,
  targetWaterAt,
} from './brew';
import { seedRecipes } from '../data/recipes';
import type { BrewStep, Recipe } from '../types';

const byId = (id: string): Recipe => {
  const r = seedRecipes.find((x) => x.id === id);
  if (!r) throw new Error(`no recipe ${id}`);
  return r;
};

describe('formatSec', () => {
  it('m:ss 로 적는다', () => {
    expect(formatSec(0)).toBe('0:00');
    expect(formatSec(9)).toBe('0:09');
    expect(formatSec(160)).toBe('2:40');
    expect(formatSec(300)).toBe('5:00');
  });
  it('음수는 0 으로', () => {
    expect(formatSec(-5)).toBe('0:00');
  });
});

describe('cumulativeWater', () => {
  it('증분을 누적으로 바꾼다', () => {
    expect(cumulativeWater(byId('4666-v2-hot').steps)).toEqual([40, 100, 160, 220]);
  });
  it('물을 붓지 않는 단계는 누적값을 유지한다', () => {
    expect(cumulativeWater(byId('liike-cafeole-hot').steps)).toEqual([30, 100, 100]);
  });
  it('양이 정해지지 않은 단계 이후는 알 수 없다', () => {
    expect(cumulativeWater(byId('ansta-party-hot').steps)).toEqual([160, null, null, null]);
  });
});

describe('brewRatio', () => {
  it('물/원두 비율을 낸다', () => {
    expect(brewRatio({ beanG: 20, waterG: 200 })).toBe(10);
    expect(formatRatio({ beanG: 20, waterG: 200 })).toBe('1:10');
    expect(formatRatio({ beanG: 18, waterG: 280 })).toBe('1:15.6');
  });
  it('원본 레시피가 주장하는 비율과 맞는다', () => {
    // 용챔 아이스는 메모에 1:11, 정인성/V60 깔끔 아이스는 1:10 이라고 적혀 있다
    expect(formatRatio(byId('yongcham-light-ice'))).toBe('1:11');
    expect(formatRatio(byId('jungins-ice'))).toBe('1:10');
    expect(formatRatio(byId('v60-clean-ice'))).toBe('1:10');
  });
  it('원두가 0이면 0', () => {
    expect(brewRatio({ beanG: 0, waterG: 100 })).toBe(0);
    expect(formatRatio({ beanG: 0, waterG: 100 })).toBe('—');
  });
});

describe('isAutoPlayable', () => {
  it('모든 단계에 시각이 있으면 자동 진행 가능', () => {
    expect(isAutoPlayable(byId('4666-v2-hot'))).toBe(true);
  });
  it('수위를 보며 붓는 레시피는 자동 진행 불가', () => {
    expect(isAutoPlayable(byId('ansta-party-hot'))).toBe(false);
  });
});

describe('servedVolumeG', () => {
  it('가수를 포함한 최종 음료량', () => {
    expect(servedVolumeG(byId('484-original-hot'))).toBe(280); // 160 추출 + 120 가수
    expect(servedVolumeG(byId('liike-cafeole-hot'))).toBe(220); // 100 진액 + 120 우유
    expect(servedVolumeG(byId('v60-clean-hot'))).toBe(280); // 가수 없음
  });
});

describe('타이머 조회', () => {
  const steps: BrewStep[] = [
    { atSec: 0, waterG: 40, label: '뜸' },
    { atSec: 40, waterG: 60, label: '1차' },
    { atSec: 70, waterG: 60, label: '2차' },
  ];

  it('경과 시간에 맞는 단계를 찾는다', () => {
    expect(activeStepIndex(steps, 0)).toBe(0);
    expect(activeStepIndex(steps, 39)).toBe(0);
    expect(activeStepIndex(steps, 40)).toBe(1);
    expect(activeStepIndex(steps, 999)).toBe(2);
  });

  it('목표 누적 투입량을 알려준다', () => {
    expect(targetWaterAt(steps, 0)).toBe(40);
    expect(targetWaterAt(steps, 45)).toBe(100);
    expect(targetWaterAt(steps, 80)).toBe(160);
  });
});
