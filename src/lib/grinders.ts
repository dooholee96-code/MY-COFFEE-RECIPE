/**
 * 그라인더 사이의 분쇄도 환산.
 *
 * 이 저장소의 레시피는 대부분 코만단테 클릭 수로 적혀 있다. 다른 그라인더를 쓰면
 * 매번 머리로 환산해야 하므로 앱이 대신 계산한다.
 *
 * ── 환산이 정확할 수 없는 이유 ──────────────────────────────────────────────
 * 그라인더마다 (1) 한 클릭이 버를 움직이는 거리와 (2) 0점을 어디로 잡는지가 다르다.
 * 버 모양(코니컬/플랫, 날 수)이 다르면 같은 간격이라도 입자 분포가 달라진다.
 * 그래서 아래 계산은 "정답"이 아니라 **출발점**이다. 한 번 내려 보고 맛으로 보정하는 것을
 * 전제로 하며, 보정한 값은 calibration 으로 저장해 이후 계산에 반영된다.
 *
 * ── 계산 방식 ──────────────────────────────────────────────────────────────
 * 두 가지를 쓴다.
 *  1. 클릭당 이동 거리의 비 — 코만단테 30µm, Femobook A2 18µm 이므로 코만단테 1클릭은
 *     Femobook 약 1.67클릭에 해당한다.
 *  2. 기준점(anchor) — 각 그라인더에서 V60 이 잘 나온다고 알려진 클릭 수.
 *     0점 위치가 다르므로 비례만으로는 맞지 않고, 이 점을 지나도록 평행이동한다.
 *
 * 즉 대상클릭 = 대상기준 + (원본클릭 − 원본기준) × (원본µm / 대상µm)
 */

export interface GrinderProfile {
  id: string;
  name: string;
  /** 한 클릭당 버가 움직이는 거리 (µm) */
  micronsPerClick: number;
  /** 이 그라인더에서 V60 푸어오버가 잘 나오는 기준 클릭 수 */
  v60Anchor: number;
  /** 제조사·리뷰가 제시하는 푸어오버 권장 범위 */
  pourOverRange?: [number, number];
  /** 조절 가능한 전체 범위 */
  maxClicks?: number;
  note?: string;
}

export const GRINDERS: GrinderProfile[] = [
  {
    id: 'comandante',
    name: '코만단테 C40',
    micronsPerClick: 30,
    v60Anchor: 22,
    pourOverRange: [20, 30],
    note: '이 앱 레시피의 기준 그라인더',
  },
  {
    id: 'femobook-a2',
    name: 'Femobook A2',
    micronsPerClick: 18,
    v60Anchor: 50,
    pourOverRange: [50, 80],
    maxClicks: 120,
    note: '40클릭 = 1바퀴 · 38mm 헵타고널 코니컬 버',
  },
  {
    id: 'timemore',
    name: '타임모어 C2/C3',
    micronsPerClick: 30,
    v60Anchor: 18,
    pourOverRange: [16, 24],
  },
  {
    id: 'kingrinder-k6',
    name: '킹그라인더 K6',
    micronsPerClick: 16,
    v60Anchor: 50,
    pourOverRange: [45, 70],
    maxClicks: 240,
  },
];

export const findGrinder = (id: string | null | undefined): GrinderProfile | undefined =>
  GRINDERS.find((g) => g.id === id);

/** 레시피에 적힌 그라인더 이름을 프로필에 맞춘다 ('코만단테 22클릭' → comandante) */
export function matchGrinderProfile(name: string): GrinderProfile | undefined {
  const n = name.toLowerCase();
  if (n.includes('코만단테') || n.includes('comandante')) return findGrinder('comandante');
  if (n.includes('타임모어') || n.includes('timemore')) return findGrinder('timemore');
  if (n.includes('femobook') || n.includes('페모북')) return findGrinder('femobook-a2');
  if (n.includes('킹그라인더') || n.includes('kingrinder')) return findGrinder('kingrinder-k6');
  return undefined;
}

/** 사용자가 직접 보정한 기준점. 그라인더 id → 그 그라인더에서의 V60 클릭 수 */
export type Calibration = Record<string, number>;

const anchorOf = (g: GrinderProfile, calibration?: Calibration): number =>
  calibration?.[g.id] ?? g.v60Anchor;

/**
 * '26~27', '22클릭', '30 (아주 굵게)', '9.0' 같은 표기에서 숫자를 뽑는다.
 * 범위면 양 끝을 모두 돌려준다.
 */
export function parseClicks(setting: string): number[] | null {
  const matches = setting.match(/\d+(?:\.\d+)?/g);
  if (!matches) return null;
  const nums = matches.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  // '15클릭 (에스프레소급)' 처럼 뒤쪽 괄호에 숫자가 없으면 1개, '26~27' 이면 2개
  return nums.slice(0, 2);
}

/** 클릭 수 하나를 다른 그라인더의 클릭 수로. 0 아래로는 내려가지 않는다. */
export function convertClicks(
  value: number,
  from: GrinderProfile,
  to: GrinderProfile,
  calibration?: Calibration,
): number {
  if (from.id === to.id) return value;
  const scaled = anchorOf(to, calibration) + (value - anchorOf(from, calibration)) * (from.micronsPerClick / to.micronsPerClick);
  const clamped = Math.max(0, scaled);
  return Math.round(clamped * 2) / 2; // 0.5클릭 단위
}

export interface ConvertedSetting {
  /** 표시할 문자열 (예: '57.5~59') */
  text: string;
  /** 권장 범위를 벗어났는지 — 벗어났다면 환산을 믿기 어렵다는 신호 */
  outOfRange: boolean;
}

/**
 * 레시피의 분쇄도 표기를 통째로 환산한다.
 * 숫자를 못 찾으면 null — 억지로 값을 만들어 내지 않는다.
 */
export function convertSetting(
  setting: string,
  from: GrinderProfile,
  to: GrinderProfile,
  calibration?: Calibration,
): ConvertedSetting | null {
  const clicks = parseClicks(setting);
  if (!clicks) return null;

  const converted = clicks.map((c) => convertClicks(c, from, to, calibration));
  const text = converted.map((n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))).join('~');

  const range = to.pourOverRange;
  const outOfRange = range ? converted.some((n) => n < range[0] || n > range[1]) : false;

  return { text, outOfRange };
}
