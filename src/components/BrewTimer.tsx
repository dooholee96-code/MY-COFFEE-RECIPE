import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '../types';
import { activeStepIndex, cumulativeWater, formatSec, isAutoPlayable } from '../lib/brew';
import { useBrewTimer, useWakeLock } from '../hooks/useBrewTimer';
import { beep, unlockAudio, vibrate } from '../lib/sound';
import { Icon } from './Icon';

interface Props {
  recipe: Recipe;
  soundOn: boolean;
  /** 추출이 끝났을 때 기록 화면으로 넘어간다. 경과 시간을 같이 넘긴다. */
  onLogBrew: (actualSec: number) => void;
}

/**
 * 타임라인을 실제로 재생하는 타이머.
 *
 * v1 은 모든 레시피에 timeline 을 들고 있었지만 화면에는 표로만 뿌렸다. 추출하면서
 * 폰 시계와 표를 번갈아 보고 누적 투입량을 머리로 더해야 했다. 이 컴포넌트가 그 일을 한다.
 *
 * 수위를 보며 붓는 레시피(안스타 초대용량)는 시계로 진행할 수 없으므로
 * "다음 단계" 버튼으로 직접 넘기는 수동 모드가 된다.
 */
export function BrewTimer({ recipe, soundOn, onLogBrew }: Props) {
  const auto = isAutoPlayable(recipe);
  const { status, elapsed, start, pause, reset } = useBrewTimer(recipe.totalSec);
  const [manualStep, setManualStep] = useState(0);
  const cumulative = cumulativeWater(recipe.steps);

  const current = auto ? activeStepIndex(recipe.steps, elapsed) : manualStep;
  const running = status === 'running';
  useWakeLock(running);

  // 단계가 바뀌는 순간에만 알린다
  const lastAnnounced = useRef(-1);
  useEffect(() => {
    if (!auto || !running || current < 0 || current === lastAnnounced.current) return;
    lastAnnounced.current = current;
    if (soundOn) beep('step');
    vibrate(120);
  }, [auto, running, current, soundOn]);

  useEffect(() => {
    if (status !== 'done') return;
    if (soundOn) beep('finish');
    vibrate([120, 80, 120]);
  }, [status, soundOn]);

  useEffect(() => {
    if (status === 'idle') lastAnnounced.current = -1;
  }, [status]);

  const step = recipe.steps[current];
  const next = recipe.steps[current + 1];
  const target = current >= 0 ? cumulative[current] : 0;
  const progress = Math.min(100, (elapsed / recipe.totalSec) * 100);
  const secondsToNext = next?.atSec !== null && next?.atSec !== undefined ? Math.max(0, Math.ceil(next.atSec - elapsed)) : null;

  const onStart = () => {
    unlockAudio();
    start();
  };

  const onManualNext = () => {
    unlockAudio();
    setManualStep((i) => Math.min(recipe.steps.length - 1, i + 1));
  };

  return (
    <section className="rounded-2xl border border-stone-700 bg-stone-900/60 p-4" aria-label="브루잉 타이머">
      {/* 시계 + 목표 투입량 */}
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            {auto ? '경과' : '단계'}
          </div>
          <div className="font-mono text-4xl font-bold tabular-nums text-stone-100">
            {auto ? formatSec(elapsed) : `${current + 1} / ${recipe.steps.length}`}
          </div>
          {auto && <div className="mt-0.5 text-xs text-stone-500">목표 {formatSec(recipe.totalSec)}</div>}
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold tracking-wider text-stone-500 uppercase">저울 목표</div>
          <div className="font-mono text-4xl font-bold tabular-nums text-amber-400">
            {target === null ? '—' : `${target}`}
            <span className="ml-0.5 text-lg font-semibold text-amber-600">g</span>
          </div>
          <div className="mt-0.5 text-xs text-stone-500">총 {recipe.waterG}g</div>
        </div>
      </div>

      {/* 진행 바 */}
      {auto && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-700" role="presentation">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 지금 할 일 — 화면을 흘끗 봤을 때 가장 먼저 읽혀야 하는 줄 */}
      <div aria-live="polite" className="mt-4 min-h-[4.5rem] rounded-xl border border-stone-700 bg-stone-800 px-4 py-3">
        {status === 'idle' && current < 0 ? (
          <p className="text-sm text-stone-400">시작을 누르면 단계별로 안내합니다.</p>
        ) : status === 'done' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 font-bold text-emerald-400">추출 완료 · {recipe.finishing?.note ?? '마무리하세요'}</p>
            <button
              type="button"
              onClick={() => onLogBrew(elapsed)}
              className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              기록하기
            </button>
          </div>
        ) : step ? (
          <>
            <p className="text-lg font-bold text-stone-100">
              {step.label}
              {step.waterG !== null && step.waterG > 0 && (
                <span className="ml-2 font-mono text-amber-400">+{step.waterG}g</span>
              )}
            </p>
            {step.hint && <p className="mt-0.5 text-sm text-stone-400">{step.hint}</p>}
            {auto && next && (
              <p className="mt-1 text-xs text-stone-500">
                다음: {next.label}
                {secondsToNext !== null && ` · ${secondsToNext}초 후`}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* 조작부 */}
      <div className="mt-3 flex gap-2">
        {auto ? (
          <>
            <button
              type="button"
              onClick={running ? pause : onStart}
              disabled={status === 'done'}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-500"
            >
              <Icon name={running ? 'pause' : 'play'} size={18} />
              {running ? '일시정지' : status === 'paused' ? '계속' : '시작'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-700 px-4 py-3 font-bold text-stone-200 transition hover:bg-stone-600"
            >
              <Icon name="reset" size={18} />
              <span className="sr-only sm:not-sr-only">초기화</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onManualNext}
              disabled={current >= recipe.steps.length - 1}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-500"
            >
              <Icon name="play" size={18} />
              {current >= recipe.steps.length - 1 ? '마지막 단계' : '다음 단계'}
            </button>
            <button
              type="button"
              onClick={() => setManualStep(0)}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-700 px-4 py-3 font-bold text-stone-200 transition hover:bg-stone-600"
            >
              <Icon name="reset" size={18} />
              <span className="sr-only sm:not-sr-only">처음으로</span>
            </button>
          </>
        )}
      </div>

      {status !== 'done' && (
        <button
          type="button"
          onClick={() => onLogBrew(elapsed)}
          className="mt-2 w-full rounded-lg border border-stone-700 py-2 text-xs font-bold text-stone-400 transition hover:border-stone-600 hover:text-stone-200"
        >
          타이머 없이 기록하기
        </button>
      )}

      {!auto && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-stone-500">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          수위를 보며 붓는 레시피라 시계로 자동 진행하지 않습니다. 직접 단계를 넘기세요.
        </p>
      )}
    </section>
  );
}
