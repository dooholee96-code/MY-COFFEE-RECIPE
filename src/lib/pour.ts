import type { BrewStep, PourFlow, PourPattern, PourTechnique } from '../types';

export const PATTERN_LABEL: Record<PourPattern, string> = {
  center: '센터 푸어',
  spiral: '나선',
  'small-circle': '작은 원',
  'large-circle': '큰 원',
  fill: '가득 채우기',
};

export const FLOW_LABEL: Record<PourFlow, string> = {
  thin: '가는 물줄기',
  medium: '중간 물줄기',
  thick: '굵은 물줄기',
};

const PACE_LABEL = { slow: '천천히', fast: '빠르게' } as const;
const AGITATION_LABEL = { stir: '교반', swirl: '스월링' } as const;

/** 사람이 읽는 한 줄. 궤적 → 굵기 → 속도 → 교반 순. 정보가 없으면 빈 문자열. */
export function describePour(pour: PourTechnique | undefined): string {
  if (!pour) return '';
  return [
    pour.pattern && PATTERN_LABEL[pour.pattern],
    pour.flow && FLOW_LABEL[pour.flow],
    pour.pace && PACE_LABEL[pour.pace],
    pour.agitation && AGITATION_LABEL[pour.agitation],
  ]
    .filter(Boolean)
    .join(' · ');
}

/** 붓는 방식 정보가 하나라도 있는 단계가 있는지 */
export function hasPourInfo(steps: BrewStep[]): boolean {
  return steps.some((s) => describePour(s.pour) !== '');
}

/**
 * 애니메이션 한 바퀴 시간(초). 빠르게 붓는 단계는 빨리, 천천히는 느리게 돈다.
 * 굵은 물줄기는 같은 양을 더 빨리 붓는다는 뜻이라 조금 빠르게 둔다.
 */
export function pourCycleSec(pour: PourTechnique | undefined): number {
  let sec = 3;
  if (pour?.pace === 'fast') sec = 1.8;
  else if (pour?.pace === 'slow') sec = 4.5;
  if (pour?.flow === 'thick' && pour.pace !== 'slow') sec *= 0.85;
  return Math.round(sec * 100) / 100;
}
