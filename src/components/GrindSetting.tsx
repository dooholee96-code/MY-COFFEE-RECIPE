import type { GrinderSetting } from '../types';
import {
  type Calibration,
  type GrinderProfile,
  type SourceConversion,
  conversionSpread,
  convertAll,
  matchGrinderProfile,
} from '../lib/grinders';

interface Props {
  settings: GrinderSetting[];
  /** 내가 쓰는 그라인더. 없으면 레시피에 적힌 그대로 보여준다. */
  myGrinder: GrinderProfile | undefined;
  calibration: Calibration;
  /** 카드용 한 줄 / 상세용 여러 줄 */
  compact?: boolean;
  fallback: string;
}

/** 이 차이(내 그라인더 단위) 이상 벌어지면 두 환산이 어긋난다고 알린다 */
const SPREAD_WARN = 3;

/** 원본 표기 이름. EK43 은 다이얼 종류까지 밝힌다 — 같은 숫자가 다이얼마다 전혀 다른 굵기다. */
const sourceName = (c: SourceConversion) => (c.from.id.startsWith('ek43') ? c.from.name : c.source.grinder);

/**
 * 분쇄도 표기. 내 그라인더가 있으면 그 단위로 환산해 앞세우고 원본은 곁에 남긴다 —
 * 환산은 추정이므로 근거를 감추지 않는다.
 *
 * 상세 화면에서는 레시피에 적힌 그라인더 값마다 따로 환산해 보여준다. 코만단테와 EK43 이
 * 함께 적힌 레시피에서 두 환산이 크게 다르면, 한쪽 보정이 우리 가정과 다르다는 뜻이므로
 * 그 차이를 그대로 드러낸다.
 */
export function GrindSetting({ settings, myGrinder, calibration, compact = false, fallback }: Props) {
  if (!settings.length) return <span>{fallback}</span>;

  // 내 그라인더 값이 레시피에 직접 적혀 있으면 환산할 필요가 없다
  const direct = myGrinder && settings.find((s) => matchGrinderProfile(s.grinder)?.id === myGrinder.id);
  if (direct) return <span>{`${direct.grinder} ${direct.setting}`}</span>;

  const conversions = myGrinder ? convertAll(settings, myGrinder, calibration) : [];
  const primary = conversions[0];

  if (!myGrinder || !primary) {
    const text = settings.map((s) => `${s.grinder} ${s.setting}`);
    return compact ? <span>{text.join(' / ')}</span> : <span className="whitespace-pre-line">{text.join('\n')}</span>;
  }

  if (compact) {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-semibold text-ink">
          {myGrinder.name} {primary.converted.text}
        </span>
        <span className="text-[11px] text-ink-faint">
          ≈ {sourceName(primary)} {primary.source.setting}
        </span>
      </span>
    );
  }

  const spread = conversionSpread(conversions);
  const unit = myGrinder.unit ?? '클릭';

  return (
    <span className="flex flex-col items-center gap-1">
      {conversions.map((c) => (
        <span key={`${c.source.grinder}-${c.source.setting}`} className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
          <span className="font-semibold text-ink">
            {myGrinder.name} <span className="num text-base">{c.converted.text}</span>
          </span>
          <span className="text-[11px] font-normal text-ink-faint">
            ← {sourceName(c)} {c.source.setting}
          </span>
          {c.converted.outOfRange && (
            <span className="rounded border border-crema/25 bg-crema-soft px-1 text-[10px] font-bold text-crema-deep">범위 밖</span>
          )}
        </span>
      ))}
      {spread >= SPREAD_WARN && (
        <span className="mt-1 max-w-[16rem] rounded-lg bg-crema-soft px-2.5 py-1.5 text-[11px] leading-snug font-normal text-ink-soft">
          원본의 두 그라인더 값이 환산하면 <b className="text-crema-deep">{spread}{unit}</b> 차이 납니다. 두 값 사이에서
          시작해 맛으로 맞추세요.
        </span>
      )}
    </span>
  );
}
