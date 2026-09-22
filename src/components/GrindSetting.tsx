import type { GrinderSetting } from '../types';
import { type Calibration, type GrinderProfile, convertSetting, matchGrinderProfile } from '../lib/grinders';

interface Props {
  settings: GrinderSetting[];
  /** 내가 쓰는 그라인더. 없으면 레시피에 적힌 그대로 보여준다. */
  myGrinder: GrinderProfile | undefined;
  calibration: Calibration;
  /** 카드용 한 줄 / 상세용 여러 줄 */
  compact?: boolean;
  fallback: string;
}

/**
 * 분쇄도 표기. 내 그라인더가 설정돼 있으면 그 그라인더의 클릭 수로 환산해 앞에 세우고,
 * 원본 값은 작게 뒤에 남긴다 — 환산은 추정이므로 근거를 감추지 않는다.
 */
export function GrindSetting({ settings, myGrinder, calibration, compact = false, fallback }: Props) {
  if (!settings.length) return <span>{fallback}</span>;

  // 내 그라인더 값이 레시피에 직접 적혀 있으면 환산할 필요가 없다
  const direct = myGrinder && settings.find((s) => matchGrinderProfile(s.grinder)?.id === myGrinder.id);
  if (direct) return <span>{`${direct.grinder} ${direct.setting}`}</span>;

  if (myGrinder) {
    for (const s of settings) {
      const from = matchGrinderProfile(s.grinder);
      if (!from) continue;
      const converted = convertSetting(s.setting, from, myGrinder, calibration);
      if (!converted) continue;

      return (
        <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-semibold text-stone-200">
            {myGrinder.name} {converted.text}
          </span>
          <span className="text-[11px] text-stone-500">
            ≈ {s.grinder} {s.setting}
          </span>
          {converted.outOfRange && !compact && (
            <span className="rounded border border-amber-900/60 bg-amber-950/40 px-1 text-[10px] font-bold text-amber-500">
              범위 밖
            </span>
          )}
        </span>
      );
    }
  }

  const text = settings.map((s) => `${s.grinder} ${s.setting}`);
  return compact ? <span>{text.join(' / ')}</span> : <span className="whitespace-pre-line">{text.join('\n')}</span>;
}
