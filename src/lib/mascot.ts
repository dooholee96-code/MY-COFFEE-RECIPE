import type { BrewStep } from '../types';
import type { MascotPose } from '../mascot/types';

export type { MascotPose };

export type TimerPhase = 'idle' | 'running' | 'paused' | 'done';

/**
 * 타이머 상태와 지금 단계에서 마스코트 자세를 고른다.
 * 물을 붓는 단계(waterG > 0 또는 눈대중 null)면 붓고, 뜸·드로다운처럼 0g 인 단계면 지켜본다.
 */
export function mascotPoseFor(phase: TimerPhase, step: BrewStep | undefined): MascotPose {
  if (phase === 'done') return 'done';
  if (phase === 'idle' || !step) return 'idle';
  const pouring = step.waterG === null || step.waterG > 0;
  return pouring ? 'pour' : 'wait';
}
