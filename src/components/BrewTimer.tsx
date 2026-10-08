import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '../types';
import { activeStepIndex, cumulativeWater, formatSec, isAutoPlayable, isPouringStep } from '../lib/brew';
import { useBrewTimer, useWakeLock } from '../hooks/useBrewTimer';
import { beep, unlockAudio, vibrate } from '../lib/sound';
import { Icon } from './Icon';
import { PourGlyph } from './PourGlyph';
import { describePour } from '../lib/pour';
import { Mascot } from './Mascot';
import { mascotPoseFor } from '../lib/mascot';

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

  /**
   * 붓는 방법 애니메이션에 무엇을 보여줄지.
   * 지금 단계에 붓는 방법이 있으면 그것을, 없으면(뜸 등) 다음 단계의 것을 "몇 차부터 이렇게"라고 밝혀서 보여준다.
   */
  const stage = (() => {
    if (step?.pour && describePour(step.pour)) {
      return { key: `now-${current}`, pour: step.pour, heading: '지금 이렇게 부어요', body: describePour(step.pour), sub: '', upcoming: false };
    }
    if (next?.pour && describePour(next.pour)) {
      const at = next.atSec !== null ? ` (${formatSec(next.atSec)})` : '';
      return {
        key: `next-${current}`,
        pour: next.pour,
        heading: `${next.label}${at}부터 이렇게 부어요`,
        body: describePour(next.pour),
        sub: secondsToNext !== null ? `${secondsToNext}초 후 시작` : '',
        upcoming: true,
      };
    }
    // 붓는 단계인데 레시피가 방식을 말하지 않는다 — 기본 모습을 보여주되 그 사실을 적는다.
    // 데이터에는 아무것도 넣지 않는다: 원본이 말하지 않은 방식을 레시피에 적지 않는다는 규칙.
    if (step && isPouringStep(step)) {
      return { key: `generic-${current}`, pour: undefined, heading: '붓는 방식은 레시피에 없어요', body: '편한 대로 부으세요', sub: '', upcoming: false };
    }
    return null;
  })();

  const pose = mascotPoseFor(status, step);

  const onStart = () => {
    unlockAudio();
    start();
  };

  const onManualNext = () => {
    unlockAudio();
    setManualStep((i) => Math.min(recipe.steps.length - 1, i + 1));
  };

  return (
    <section className="rounded-2xl border border-line bg-well p-4" aria-label="브루잉 타이머">
      {/* 시계 + 마스코트 + 목표 투입량 */}
      <div className="flex items-end justify-between gap-2">
        <div className="shrink-0">
          <div className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">{auto ? '경과' : '단계'}</div>
          <div role="timer" aria-live="off" className="num text-[40px] leading-none font-bold tabular-nums text-ink">
            {auto ? formatSec(elapsed) : `${current + 1} / ${recipe.steps.length}`}
          </div>
          {auto && <div className="mt-1.5 text-xs text-ink-soft">목표 {formatSec(recipe.totalSec)}</div>}
        </div>
        {/* 바리스타 — 붓는 단계면 붓고, 뜸이면 지켜보고, 끝나면 잔을 든다. 일시정지면 멈춘다 */}
        <Mascot
          pose={pose}
          moving={running || status === 'done'}
          size={104}
          paper="var(--color-well)"
          className="mb-1 hidden min-[360px]:block text-ink-soft"
        />
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">저울 목표</div>
          <div className="num text-[40px] leading-none font-bold tabular-nums text-crema">
            {target === null ? '—' : `${target}`}
            <span className="ml-0.5 text-lg font-semibold text-crema">g</span>
          </div>
          <div className="mt-1.5 text-xs text-ink-soft">총 {recipe.waterG}g</div>
        </div>
      </div>

      {/* 진행 바 */}
      {auto && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" role="presentation">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${status === 'done' ? 'bg-sage' : 'bg-crema'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 지금 할 일 — 화면을 흘끗 봤을 때 가장 먼저 읽혀야 하는 줄 */}
      <div className="mt-4 min-h-[4.5rem] rounded-xl bg-card px-4 py-3.5">
        {status === 'idle' && current < 0 ? (
          <p className="text-sm text-ink-soft">시작을 누르면 단계별로 안내합니다.</p>
        ) : status === 'done' ? (
          <div className="flex items-center justify-between gap-3">
            <p aria-live="polite" className="min-w-0 font-bold text-sage">
              추출 완료 · {recipe.finishing?.note ?? '마무리하세요'}
            </p>
            <button
              type="button"
              onClick={() => onLogBrew(elapsed)}
              className="shrink-0 rounded-lg bg-sage px-3 py-2 text-sm font-bold text-card transition hover:opacity-90"
            >
              기록하기
            </button>
          </div>
        ) : step ? (
          <>
            <p aria-live="polite" className="text-xl leading-tight font-bold text-ink">
              {step.label}
              {step.waterG !== null && step.waterG > 0 && <span className="ml-2 num text-crema">+{step.waterG}g</span>}
              {describePour(step.pour) && <span className="sr-only"> · {describePour(step.pour)}</span>}
            </p>
            {step.hint && <p className="mt-1 text-sm leading-snug text-ink-soft">{step.hint}</p>}
            {auto && next && (
              // 다음 단계까지 남은 시간 — 흘끗 볼 때 두 번째로 중요한 줄이라 흐리게 두지 않는다
              <p className="mt-1.5 text-sm font-semibold text-ink-soft">
                다음 {next.label}
                {secondsToNext !== null && (
                  <>
                    {' · '}
                    <span className="num text-ink">{secondsToNext}</span>초 후
                  </>
                )}
              </p>
            )}
            {stage && (
              // 붓는 방법 — 카드 폭을 다 써서 크게. 지금 단계의 것인지, 다가올 단계의 것인지 글로 분명히 적는다
              <div className="mt-3 flex items-center gap-4 border-t border-line pt-3">
                {/* 1인칭 — 내 손이 주전자를 들고 궤적을 따라간다 */}
                <PourGlyph key={stage.key} pour={stage.pour} size={132} pov paper="var(--color-card)" />
                {/* 한글이 음절 중간에서 끊기지 않게 어절 단위로 줄바꿈 */}
                <div className="min-w-0 break-keep">
                  <p className={`text-xs font-bold ${stage.upcoming ? 'text-ink-faint' : 'text-crema'}`}>{stage.heading}</p>
                  <p className={`mt-1 text-lg leading-snug font-bold ${stage.pour ? 'text-crema-deep' : 'text-ink-soft'}`}>{stage.body}</p>
                  {stage.sub && <p className="mt-1 text-xs text-ink-faint">{stage.sub}</p>}
                </div>
              </div>
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-crema py-3 font-bold text-on-crema transition hover:bg-crema-deep disabled:cursor-not-allowed disabled:bg-well disabled:text-ink-faint"
            >
              <Icon name={running ? 'pause' : 'play'} size={18} />
              {running ? '일시정지' : status === 'paused' ? '계속' : '시작'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-well px-4 py-3 font-bold text-ink transition hover:bg-line"
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-crema py-3 font-bold text-on-crema transition hover:bg-crema-deep disabled:cursor-not-allowed disabled:bg-well disabled:text-ink-faint"
            >
              <Icon name="play" size={18} />
              {current >= recipe.steps.length - 1 ? '마지막 단계' : '다음 단계'}
            </button>
            <button
              type="button"
              onClick={() => setManualStep(0)}
              className="flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-well px-4 py-3 font-bold text-ink transition hover:bg-line"
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
          className="mt-2 w-full rounded-lg border border-line py-2 text-xs font-bold text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          타이머 없이 기록하기
        </button>
      )}

      {!auto && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-faint">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          수위를 보며 붓는 레시피라 시계로 자동 진행하지 않습니다. 직접 단계를 넘기세요.
        </p>
      )}
    </section>
  );
}
