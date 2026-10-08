import { describe, expect, it } from 'vitest';
import {
  activeStepIndex,
  stepJumpTargets,
  brewRatio,
  cumulativeWater,
  formatRatio,
  formatSec,
  isAutoPlayable,
  servedVolumeG,
  sortSteps,
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

describe('sortSteps', () => {
  it('시각순으로 정렬하고 시각 없는 단계는 뒤로', () => {
    const got = sortSteps([
      { atSec: 70, waterG: 60, label: '2차' },
      { atSec: null, waterG: null, label: '반복' },
      { atSec: 0, waterG: 40, label: '뜸' },
      { atSec: 40, waterG: 60, label: '1차' },
    ]);
    expect(got.map((s) => s.label)).toEqual(['뜸', '1차', '2차', '반복']);
  });
  it('같은 시각이면 적은 순서를 지킨다', () => {
    const got = sortSteps([
      { atSec: 0, waterG: 30, label: '붓기' },
      { atSec: 0, waterG: 0, label: '교반' },
    ]);
    expect(got.map((s) => s.label)).toEqual(['붓기', '교반']);
  });
});

describe('stepJumpTargets', () => {
  const steps: BrewStep[] = [
    { atSec: 0, waterG: 40, label: '뜸' },
    { atSec: 45, waterG: 60, label: '1차' },
    { atSec: 90, waterG: 60, label: '2차' },
    { atSec: 150, waterG: 0, label: '종료' },
  ];

  it('다음은 지금 시각보다 뒤에 시작하는 첫 단계', () => {
    expect(stepJumpTargets(steps, 0).next).toBe(45);
    expect(stepJumpTargets(steps, 44.9).next).toBe(45);
    expect(stepJumpTargets(steps, 45).next).toBe(90);
    expect(stepJumpTargets(steps, 150).next).toBeNull();
  });

  it('이전은 지금 단계의 시작으로, 막 넘어왔으면 그 앞 단계로', () => {
    expect(stepJumpTargets(steps, 60).prev).toBe(45); // 1차 한가운데 → 1차 시작
    expect(stepJumpTargets(steps, 46).prev).toBe(0); // 1차 시작 1초 뒤 → 뜸으로
    expect(stepJumpTargets(steps, 91).prev).toBe(45);
    expect(stepJumpTargets(steps, 0).prev).toBeNull(); // 처음에서는 갈 곳이 없다
    expect(stepJumpTargets(steps, 1).prev).toBeNull();
    expect(stepJumpTargets(steps, 20).prev).toBe(0);
  });

  it('시계에 매이지 않은 단계는 건너뛴다', () => {
    const loose: BrewStep[] = [
      { atSec: 0, waterG: 40, label: '뜸' },
      { atSec: null, waterG: null, label: '수위까지' },
      { atSec: 120, waterG: 0, label: '종료' },
    ];
    expect(stepJumpTargets(loose, 10)).toEqual({ prev: 0, next: 120 });
  });
});
