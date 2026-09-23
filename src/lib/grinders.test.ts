import { describe, expect, it } from 'vitest';
import {
  GRINDERS,
  beanAnchorFor,
  conversionSpread,
  convertAll,
  oneStepLabel,
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
  it('EK43 은 다이얼 종류를 구분한다 — 적혀 있지 않으면 0~16', () => {
    expect(matchGrinderProfile('EK43')?.id).toBe('ek43');
    expect(matchGrinderProfile('EK43 (1~11)')?.id).toBe('ek43-1-11');
  });
  it('모르는 그라인더는 undefined', () => {
    expect(matchGrinderProfile('Baratza Encore')).toBeUndefined();
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

describe('EK43', () => {
  const ek43 = findGrinder('ek43')!;
  const ek43old = findGrinder('ek43-1-11')!;

  it('두 다이얼은 같은 입자 범위(180~803µm)를 다른 칸 수로 나눈다', () => {
    // 0~16 다이얼: 16칸, 1~11 다이얼: 10칸
    expect(ek43.micronsPerClick * 16).toBeCloseTo(623, -1);
    expect(ek43old.micronsPerClick * 10).toBeCloseTo(623, -1);
  });

  it('기준점이 코만단테 22클릭에 대응한다', () => {
    expect(convertClicks(22, comandante, ek43)).toBe(13.5);
    expect(convertClicks(13.5, ek43, femobook)).toBe(45);
  });

  it('레시피의 EK43 값을 Femobook 으로 환산한다', () => {
    expect(convertSetting('13~14', ek43, femobook)?.text).toBe('44~46');
    expect(convertSetting('12.5~13', ek43, femobook)?.text).toBe('43~44');
    expect(convertSetting('9.0', ek43old, femobook)?.text).toBe('43.5');
  });

  it('용챔의 EK43 9.0 은 1~11 다이얼로 읽어야 옆의 코만단테 값과 가깝다', () => {
    // 0~16 으로 읽으면 약 35클릭 — 코만단테 26~28(→ 51.5~55)과 20클릭 가까이 벌어진다
    const as0to16 = convertClicks(9, ek43, femobook);
    const as1to11 = convertClicks(9, ek43old, femobook);
    const fromComandante = convertClicks(27, comandante, femobook);
    expect(Math.abs(fromComandante - as1to11)).toBeLessThan(Math.abs(fromComandante - as0to16));
  });
});

describe('convertAll / conversionSpread', () => {
  it('레시피에 적힌 값을 모두 환산하고 벌어진 정도를 잰다', () => {
    const settings = [
      { grinder: '코만단테', setting: '26~27' },
      { grinder: 'EK43', setting: '13~14' },
    ];
    const all = convertAll(settings, femobook);
    expect(all.map((c) => c.converted.text)).toEqual(['51.5~53.5', '44~46']);
    expect(conversionSpread(all)).toBe(7.5);
  });

  it('잘 맞는 두 값은 차이가 작다 (4666: 코만단테 22~24, 타임모어 18)', () => {
    const all = convertAll(
      [
        { grinder: '코만단테', setting: '22~24' },
        { grinder: '타임모어', setting: '18' },
      ],
      femobook,
    );
    expect(conversionSpread(all)).toBe(2);
  });

  it('모르는 그라인더, 숫자 없는 표기, 내 그라인더로 직접 적힌 값은 건너뛴다', () => {
    const all = convertAll(
      [
        { grinder: 'Baratza', setting: '14' },
        { grinder: '코만단테', setting: '아주 굵게' },
        { grinder: 'Femobook A2', setting: '44' },
        { grinder: '코만단테', setting: '22' },
      ],
      femobook,
    );
    expect(all).toHaveLength(1);
    expect(conversionSpread(all)).toBe(0);
  });
});

describe('oneStepLabel', () => {
  it('코만단테 한 클릭을 내 그라인더 단위로', () => {
    expect(oneStepLabel(undefined)).toBe('한 클릭');
    expect(oneStepLabel(comandante)).toBe('한 클릭');
    expect(oneStepLabel(femobook)).toBe('2클릭'); // 30 / 18 ≈ 1.7
    expect(oneStepLabel(findGrinder('timemore'))).toBe('1클릭');
    expect(oneStepLabel(findGrinder('ek43'))).toBe('0.75눈금'); // 30 / 38.9
    expect(oneStepLabel(findGrinder('ek43-1-11'))).toBe('0.5눈금'); // 30 / 62.3
  });
});
