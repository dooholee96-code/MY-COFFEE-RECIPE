import { describe, expect, it } from 'vitest';
import {
  GRINDERS,
  beanAnchorFor,
  calibrationForBean,
  convertClicks,
  convertSetting,
  findGrinder,
  matchGrinderProfile,
  parseClicks,
} from './grinders';
import type { Bean } from '../types';

const comandante = findGrinder('comandante')!;
const femobook = findGrinder('femobook-a2')!;

describe('parseClicks', () => {
  it('단일 값을 읽는다', () => {
    expect(parseClicks('22클릭')).toEqual([22]);
    expect(parseClicks('30 (아주 굵게)')).toEqual([30]);
    expect(parseClicks('9.0')).toEqual([9]);
  });
  it('범위를 읽는다', () => {
    expect(parseClicks('26~27')).toEqual([26, 27]);
    expect(parseClicks('12.5~13')).toEqual([12.5, 13]);
    expect(parseClicks('22~24클릭')).toEqual([22, 24]);
  });
  it('숫자가 없으면 null', () => {
    expect(parseClicks('아주 굵게')).toBeNull();
    expect(parseClicks('')).toBeNull();
  });
});

describe('convertClicks', () => {
  it('같은 그라인더면 그대로', () => {
    expect(convertClicks(22, comandante, comandante)).toBe(22);
  });

  it('기준점은 서로에게 정확히 대응한다', () => {
    // 코만단테 22 = Femobook 45 (각자의 V60 기준)
    expect(convertClicks(22, comandante, femobook)).toBe(45);
    expect(convertClicks(45, femobook, comandante)).toBe(22);
  });

  it('Femobook 기본 기준은 사용자가 실제로 쓰는 40~50 범위의 중간이다', () => {
    expect(femobook.v60Anchor).toBe(45);
    expect(femobook.pourOverRange).toEqual([40, 80]);
  });

  it('클릭당 이동거리 비를 따른다', () => {
    // 코만단테 1클릭(30µm) = Femobook 1.67클릭(18µm)
    expect(convertClicks(23, comandante, femobook)).toBe(46.5); // 45 + 1.67
    expect(convertClicks(28, comandante, femobook)).toBe(55); // 45 + 6 × 1.67
  });

  it('왕복 변환이 원래 값으로 돌아온다', () => {
    for (const v of [15, 20, 22, 26, 30, 35]) {
      const there = convertClicks(v, comandante, femobook);
      expect(convertClicks(there, femobook, comandante)).toBeCloseTo(v, 0);
    }
  });

  it('음수로 내려가지 않는다', () => {
    expect(convertClicks(0, femobook, comandante)).toBeGreaterThanOrEqual(0);
  });

  it('사용자 보정이 기준점을 대체한다', () => {
    // 내 Femobook 에서는 V60 이 55클릭이 맞더라 → 전체가 5클릭 밀린다
    const cal = { 'femobook-a2': 55 };
    expect(convertClicks(22, comandante, femobook, cal)).toBe(55);
    expect(convertClicks(23, comandante, femobook, cal)).toBe(56.5); // 56.67 → 0.5 단위로 반올림
  });
});

describe('convertSetting', () => {
  it('레시피 표기를 통째로 환산한다', () => {
    expect(convertSetting('22클릭', comandante, femobook)?.text).toBe('45');
    expect(convertSetting('22~24', comandante, femobook)?.text).toBe('45~48.5');
  });

  it('숫자가 없으면 환산하지 않는다', () => {
    expect(convertSetting('아주 굵게', comandante, femobook)).toBeNull();
  });

  it('권장 범위를 벗어나면 표시한다', () => {
    // 리이케 카페오레는 코만단테 15클릭 — 에스프레소급이라 푸어오버 범위 밖
    expect(convertSetting('15클릭', comandante, femobook)?.outOfRange).toBe(true);
    expect(convertSetting('22클릭', comandante, femobook)?.outOfRange).toBe(false);
  });

  it('이 저장소의 실제 레시피 값들이 권장 범위에 들어온다', () => {
    // 드립 레시피의 코만단테 값은 Femobook 푸어오버 범위(40~80) 안에 떨어져야 한다
    for (const setting of ['22~24', '26~27', '26~28', '30', '22클릭', '30클릭', '24~25']) {
      const got = convertSetting(setting, comandante, femobook);
      expect(got, setting).not.toBeNull();
      expect(got!.outOfRange, `${setting} → ${got!.text}`).toBe(false);
    }
  });
});

describe('matchGrinderProfile', () => {
  it('레시피에 적힌 이름을 프로필에 맞춘다', () => {
    expect(matchGrinderProfile('코만단테')?.id).toBe('comandante');
    expect(matchGrinderProfile('타임모어')?.id).toBe('timemore');
    expect(matchGrinderProfile('Femobook A2')?.id).toBe('femobook-a2');
  });
  it('모르는 그라인더는 undefined', () => {
    expect(matchGrinderProfile('EK43')).toBeUndefined();
  });
});

describe('GRINDERS', () => {
  it('프로필 값이 온전하다', () => {
    for (const g of GRINDERS) {
      expect(g.micronsPerClick, g.id).toBeGreaterThan(0);
      expect(g.v60Anchor, g.id).toBeGreaterThan(0);
      if (g.pourOverRange) {
        expect(g.pourOverRange[0], g.id).toBeLessThan(g.pourOverRange[1]);
        // 기준점은 스스로의 권장 범위 안에 있어야 한다
        expect(g.v60Anchor, g.id).toBeGreaterThanOrEqual(g.pourOverRange[0]);
        expect(g.v60Anchor, g.id).toBeLessThanOrEqual(g.pourOverRange[1]);
      }
    }
  });
});

describe('원두별 기준점', () => {
  const bean = (over: Partial<Bean> = {}): Bean => ({ id: 'b1', name: '예가체프', ...over });

  it('원두에 기준이 없으면 보정값을 그대로 쓴다', () => {
    const base = { 'femobook-a2': 47 };
    expect(calibrationForBean(base, bean())).toBe(base);
    expect(calibrationForBean(base, undefined)).toBe(base);
  });

  it('원두 기준이 설정 보정값보다 우선한다', () => {
    const cal = calibrationForBean({ 'femobook-a2': 47 }, bean({ grindAnchor: { grinderId: 'femobook-a2', clicks: 41 } }));
    expect(cal['femobook-a2']).toBe(41);
    // 4666 V2 (코만단테 22~24) 가 이 원두에서는 41~44.5
    expect(convertSetting('22~24', comandante, femobook, cal)?.text).toBe('41~44.5');
  });

  it('같은 레시피라도 원두에 따라 환산값이 달라진다', () => {
    const fine = calibrationForBean({}, bean({ grindAnchor: { grinderId: 'femobook-a2', clicks: 40 } }));
    const coarse = calibrationForBean({}, bean({ grindAnchor: { grinderId: 'femobook-a2', clicks: 50 } }));
    expect(convertClicks(22, comandante, femobook, fine)).toBe(40);
    expect(convertClicks(22, comandante, femobook, coarse)).toBe(50);
  });

  it('다 마신 원두의 기준은 쓰지 않는다', () => {
    const base = { 'femobook-a2': 47 };
    expect(calibrationForBean(base, bean({ finished: true, grindAnchor: { grinderId: 'femobook-a2', clicks: 41 } }))).toBe(base);
  });

  it('다른 그라인더 기준으로 적힌 값은 내 그라인더에 적용하지 않는다', () => {
    const b = bean({ grindAnchor: { grinderId: 'timemore', clicks: 18 } });
    expect(beanAnchorFor(b, femobook)).toBeNull();
    // calibrationForBean 은 id 로 격리되므로 femobook 환산은 영향을 받지 않는다
    expect(convertClicks(22, comandante, femobook, calibrationForBean({}, b))).toBe(45);
  });

  it('내 그라인더 기준이면 그 값을 돌려준다', () => {
    expect(beanAnchorFor(bean({ grindAnchor: { grinderId: 'femobook-a2', clicks: 43 } }), femobook)).toBe(43);
    expect(beanAnchorFor(bean(), femobook)).toBeNull();
    expect(beanAnchorFor(bean({ grindAnchor: { grinderId: 'femobook-a2', clicks: 43 } }), undefined)).toBeNull();
  });
});
