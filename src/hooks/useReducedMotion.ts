import { useEffect, useState } from 'react';

/**
 * 기기의 "동작 줄이기" 설정. 켜져 있으면 애니메이션 대신 정지된 그림을 그린다.
 * SVG 의 <animate> 는 CSS 미디어쿼리로 멈출 수 없어서 JS 로 판단한다.
 */
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}
