import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'running' | 'paused' | 'done';

/**
 * 추출 타이머.
 *
 * setInterval 로 카운터를 올리면 탭이 백그라운드로 가거나 화면이 꺼질 때 어긋난다.
 * 실제 시작 시각(Date.now)을 기준으로 매 틱마다 경과 시간을 다시 계산해서,
 * 폰을 주머니에 넣었다 꺼내도 시계가 맞게 둔다.
 */
export function useBrewTimer(totalSec: number) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);

  useEffect(() => {
    if (status !== 'running') return;
    let frame = 0;
    const tick = () => {
      const base = startedAt.current ?? Date.now();
      const next = accumulated.current + (Date.now() - base) / 1000;
      setElapsed(next);
      frame = window.setTimeout(tick, 100);
    };
    tick();
    return () => window.clearTimeout(frame);
  }, [status]);

  // 목표 시간을 넘기면 계속 세지 않고 종료 상태로 넘긴다
  useEffect(() => {
    if (status === 'running' && elapsed >= totalSec) {
      accumulated.current = elapsed;
      startedAt.current = null;
      setStatus('done');
    }
  }, [status, elapsed, totalSec]);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    if (startedAt.current !== null) {
      accumulated.current += (Date.now() - startedAt.current) / 1000;
      startedAt.current = null;
    }
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsed(0);
    setStatus('idle');
  }, []);

  return { status, elapsed, start, pause, reset };
}

/**
 * 화면이 꺼지지 않게 잡아둔다. 추출 중에 폰이 잠기면 타이머를 못 본다.
 * Screen Wake Lock API 는 지원 범위가 넓지 않으므로 실패는 무시한다.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    type WakeLock = { release: () => Promise<void> };
    let lock: WakeLock | null = null;
    let cancelled = false;

    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLock> } };
    nav.wakeLock
      ?.request('screen')
      .then((l) => {
        if (cancelled) void l.release();
        else lock = l;
      })
      .catch(() => {
        /* 지원하지 않거나 거부됨 */
      });

    return () => {
      cancelled = true;
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
