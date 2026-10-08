import { ACTIVE_CHARACTER, type MascotPose } from '../mascot';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
  pose: MascotPose;
  /** 가로 px. 세로는 캐릭터의 비율을 따른다 */
  size?: number;
  /** 그림이 놓이는 면의 색 — 겹치는 선을 가린다 */
  paper?: string;
  /** false 면 멈춘 그림. 동작 줄이기가 켜져 있으면 어차피 멈춘다 */
  moving?: boolean;
  className?: string;
}

/**
 * 마스코트. 장식이라 스크린리더에는 숨기고, 기기의 '동작 줄이기'를 따른다
 * (푸어 애니메이션과 달리 정보가 아니므로 '항상 움직이기' 설정의 영향을 받지 않는다).
 */
export function Mascot({ pose, size = 160, paper = 'var(--color-card)', moving = true, className = '' }: Props) {
  const reduced = useReducedMotion();
  const { Figure } = ACTIVE_CHARACTER;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: size }} data-mascot={pose}>
      <Figure pose={pose} moving={moving && !reduced} paper={paper} />
    </span>
  );
}

export function MascotFace({ size = 24, paper, className = '' }: { size?: number; paper?: string; className?: string }) {
  const { Face } = ACTIVE_CHARACTER;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: size }}>
      <Face {...(paper !== undefined ? { paper } : {})} />
    </span>
  );
}
