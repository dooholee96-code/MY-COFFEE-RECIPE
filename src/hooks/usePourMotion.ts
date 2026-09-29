import { createContext, useContext } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * 푸어 애니메이션을 언제 재생할지.
 * - 'auto'  : 기기의 "동작 줄이기"가 켜져 있으면 멈춘 그림 (기본)
 * - 'always': 동작 줄이기와 상관없이 재생 — 이 그림은 장식이 아니라 붓는 방법을 알려주는 정보라서,
 *             사용자가 원하면 켤 수 있게 둔다.
 */
export type PourMotionPref = 'auto' | 'always';

export const PourMotionContext = createContext<PourMotionPref>('auto');

export function useAnimatePours(): boolean {
  const pref = useContext(PourMotionContext);
  const reduced = useReducedMotion();
  return pref === 'always' || !reduced;
}
