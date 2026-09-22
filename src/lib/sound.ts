/**
 * 단계가 바뀔 때 알리는 짧은 비프.
 *
 * 오디오 파일을 싣지 않고 WebAudio 로 만든다 — 단일 HTML 파일로 빌드해도
 * 외부 리소스가 필요 없어야 하기 때문.
 */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** 사용자 조작 직후에 불러 오디오 컨텍스트 잠금을 푼다 (모바일 사파리) */
export function unlockAudio(): void {
  const c = context();
  if (c?.state === 'suspended') void c.resume().catch(() => {});
}

export function beep(kind: 'step' | 'finish' = 'step'): void {
  const c = context();
  if (!c) return;
  try {
    const now = c.currentTime;
    const tones = kind === 'finish' ? [880, 1174] : [660];
    tones.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const at = now + i * 0.18;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.25, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      osc.connect(gain).connect(c.destination);
      osc.start(at);
      osc.stop(at + 0.18);
    });
  } catch {
    /* 소리는 없어도 된다 */
  }
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* 지원 안 함 */
  }
}
