import { useState } from 'react';
import type { BrewLog, Recipe } from '../types';
import { cumulativeWater, formatRatio, formatSec, scaleRecipe, servedVolumeG } from '../lib/brew';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { BrewTimer } from './BrewTimer';
import { DoseScaler } from './DoseScaler';
import { roastLabel } from '../lib/labels';
import { StarRating } from './StarRating';
import { GrindSetting } from './GrindSetting';
import type { Calibration, GrinderProfile } from '../lib/grinders';
import { TASTE_OPTIONS, averageRating, bestLog } from '../lib/dialIn';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  /** 같은 레시피의 HOT/ICE 변형 (있으면 전환 버튼을 띄운다) */
  sibling: Recipe | undefined;
  onSwitchTo: (id: string) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  soundOn: boolean;
  onEdit: (() => void) | undefined;
  onDelete: (() => void) | undefined;
  /** 이 레시피로 내린 지난 기록 (최신순) */
  logs: BrewLog[];
  onLogBrew: (actualSec: number, beanG: number) => void;
  onOpenLog: (log: BrewLog) => void;
  myGrinder: GrinderProfile | undefined;
  calibration: Calibration;
}

export function RecipeDetail({
  recipe,
  onClose,
  sibling,
  onSwitchTo,
  favorite,
  onToggleFavorite,
  soundOn,
  onEdit,
  onDelete,
  logs,
  onLogBrew,
  onOpenLog,
  myGrinder,
  calibration,
}: Props) {
  const [dose, setDose] = useState(recipe.beanG);
  const shown = scaleRecipe(recipe, dose);
  const cumulative = cumulativeWater(shown.steps);
  const scaled = dose !== recipe.beanG;

  return (
    <Modal open onClose={onClose} label={`${recipe.title} 상세`}>
      {/* 헤더 */}
      <header
        className={`flex shrink-0 items-start justify-between gap-3 bg-gradient-to-r px-5 py-4 text-white ${
          recipe.serve === 'hot' ? 'from-amber-700 to-orange-800' : 'from-sky-800 to-slate-800'
        }`}
      >
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{recipe.title}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80">
            <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-bold">{roastLabel(recipe.roast)}</span>
            <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-bold">
              {recipe.serve === 'hot' ? 'HOT' : 'ICE'}
            </span>
            <span className="font-mono">
              {shown.beanG}g · {shown.waterG}g · {formatRatio(shown)}
            </span>
            {recipe.author && !recipe.title.includes(recipe.author) && <span>{recipe.author}</span>}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={favorite}
            aria-label={`즐겨찾기 ${favorite ? '해제' : '추가'}`}
            className="rounded-full bg-black/25 p-2 transition hover:bg-black/40"
          >
            <Icon name="star" size={18} filled={favorite} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full bg-black/25 p-2 transition hover:bg-black/40"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <BrewTimer recipe={shown} soundOn={soundOn} onLogBrew={(sec) => onLogBrew(sec, shown.beanG)} />

        <DoseScaler baseBeanG={recipe.beanG} value={dose} onChange={setDose} />

        {/* 설정값 */}
        <dl className="grid grid-cols-2 gap-2">
          {[
            { icon: 'thermometer' as const, label: '물 온도', value: `${recipe.tempC}℃` },
            { icon: 'clock' as const, label: '목표 시간', value: formatSec(recipe.totalSec) },
            { icon: 'filter' as const, label: '추천 기구', value: recipe.gear },
          ].map((cell) => (
            <div
              key={cell.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-stone-700 bg-stone-900/60 p-3 text-center"
            >
              <Icon name={cell.icon} size={16} className="text-stone-500" />
              <dt className="text-[11px] text-stone-500">{cell.label}</dt>
              <dd className="text-[13px] leading-tight font-bold whitespace-pre-line text-stone-200">{cell.value}</dd>
            </div>
          ))}
          <div className="col-span-2 flex flex-col items-center gap-1 rounded-xl border border-stone-700 bg-stone-900/60 p-3 text-center">
            <Icon name="grinder" size={16} className="text-stone-500" />
            <dt className="text-[11px] text-stone-500">분쇄도</dt>
            <dd className="text-[13px] leading-tight font-bold text-stone-200">
              <GrindSetting
                settings={recipe.grinderSettings ?? []}
                myGrinder={myGrinder}
                calibration={calibration}
                fallback={recipe.grind}
              />
            </dd>
            {myGrinder && myGrinder.id !== 'comandante' && (
              <p className="mt-0.5 text-[10px] leading-snug text-stone-600">
                환산값은 출발점입니다. 맛을 보고 보정하세요 — 설정에서 기준을 바꿀 수 있습니다.
              </p>
            )}
          </div>
        </dl>

        {recipe.note && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm leading-relaxed text-amber-200">
            <span className="shrink-0 font-bold text-amber-500">Check!</span>
            {recipe.note}
          </p>
        )}

        {recipe.waterNote && (
          <p className="flex items-start gap-1.5 text-xs text-stone-500">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            {recipe.waterNote}
          </p>
        )}

        {/* 단계표 — 타이머와 같은 데이터를 훑어볼 수 있게 */}
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-stone-400 uppercase">
            <Icon name="clock" size={14} className="text-amber-500" />
            추출 단계
            {scaled && <span className="font-normal text-amber-500 normal-case">· {dose}g 기준으로 조정됨</span>}
          </h4>
          <ol className="overflow-hidden rounded-xl border border-stone-700">
            {shown.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-stone-700 bg-stone-900/40 px-3 py-2.5 last:border-0"
              >
                <span className="w-12 shrink-0 font-mono text-xs font-semibold text-stone-500">
                  {step.atSec === null ? '—' : formatSec(step.atSec)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-stone-100">{step.label}</span>
                  {step.hint && <span className="ml-1.5 text-xs text-stone-500">{step.hint}</span>}
                </span>
                <span className="shrink-0 text-right">
                  {step.waterG !== null && step.waterG > 0 ? (
                    <>
                      <span className="font-mono text-sm font-bold text-amber-400">+{step.waterG}g</span>
                      <span className="ml-1.5 font-mono text-[11px] text-stone-500">
                        {cumulative[i] === null ? '' : `→ ${cumulative[i]}g`}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-xs text-stone-600">{step.waterG === null ? '눈대중' : '—'}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* 마무리 */}
        <section className="space-y-2 rounded-xl border border-dashed border-stone-700 p-4">
          <h4 className="text-xs font-bold tracking-wider text-stone-400 uppercase">마무리</h4>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-stone-400">추출 총 투입량</dt>
              <dd className="font-mono font-bold text-stone-100">{shown.waterG}g</dd>
            </div>
            {shown.finishing?.waterG !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-stone-400">가수</dt>
                <dd className="font-mono font-bold text-stone-100">+{shown.finishing.waterG}g</dd>
              </div>
            )}
            {shown.finishing?.milkG !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-stone-400">우유</dt>
                <dd className="font-mono font-bold text-stone-100">+{shown.finishing.milkG}g</dd>
              </div>
            )}
            {shown.finishing?.iceG !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-stone-400">얼음 (미리 준비)</dt>
                <dd className="font-mono font-bold text-stone-100">{shown.finishing.iceG}g</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-stone-700 pt-1.5">
              <dt className="font-semibold text-stone-300">잔에 담기는 양</dt>
              <dd className="font-mono text-base font-bold text-amber-400">약 {servedVolumeG(shown)}g</dd>
            </div>
          </dl>
          {shown.finishing?.note && <p className="pt-1 text-sm text-stone-400">{shown.finishing.note}</p>}
        </section>

        {/* 내 기록 — 레시피를 다시 열었을 때 지난번에 어땠는지 바로 보이게 */}
        {logs.length > 0 && <PastBrews logs={logs} onOpenLog={onOpenLog} />}

        {/* 액션 */}
        <div className="space-y-2">
          {sibling && (
            <button
              type="button"
              onClick={() => onSwitchTo(sibling.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-700 py-3 font-bold text-stone-200 transition hover:bg-stone-600"
            >
              <Icon name="swap" size={18} />
              {sibling.serve === 'hot' ? 'HOT' : 'ICE'} 버전 보기
            </button>
          )}

          {recipe.youtubeUrl ? (
            <a
              href={recipe.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/90 py-3 font-bold text-white transition hover:bg-red-600"
            >
              <Icon name="youtube" size={18} />
              유튜브 원본 영상 보기
            </a>
          ) : (
            <p className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-700/40 py-3 text-sm font-bold text-stone-500">
              <Icon name="youtube" size={18} />
              유튜브 정보 없음
            </p>
          )}

          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-700 py-3 font-bold text-stone-200 transition hover:bg-stone-600"
                >
                  <Icon name="edit" size={16} />
                  수정
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 font-bold text-red-300 transition hover:bg-red-900/40"
                >
                  <Icon name="trash" size={16} />
                  삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** 이 레시피로 내린 지난 기록 요약 */
function PastBrews({ logs, onOpenLog }: { logs: BrewLog[]; onOpenLog: (log: BrewLog) => void }) {
  const avg = averageRating(logs);
  const best = bestLog(logs);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-stone-400 uppercase">
          <Icon name="clock" size={14} className="text-amber-500" />
          내 기록 {logs.length}회
        </h4>
        {avg !== null && (
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            평균
            <StarRating value={Math.round(avg)} size={12} />
            {avg.toFixed(1)}
          </span>
        )}
      </div>

      {best && (
        <p className="mb-2 rounded-xl border border-emerald-900/50 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-200/90">
          <span className="font-bold text-emerald-400">가장 잘 나온 설정</span>{' '}
          <span className="font-mono">
            {best.beanG}g · {best.waterG}g · {best.tempC}℃
            {best.grindNote ? ` · ${best.grindNote}` : ''}
            {best.actualSec !== undefined ? ` · ${formatSec(best.actualSec)}` : ''}
          </span>
        </p>
      )}

      <ul className="space-y-1.5">
        {logs.slice(0, 5).map((log) => (
          <li key={log.id}>
            <button
              type="button"
              onClick={() => onOpenLog(log)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-700 bg-stone-900/40 px-3 py-2 text-left transition hover:border-stone-600"
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-stone-300">
                  {new Date(log.brewedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
                <span className="block truncate font-mono text-[11px] text-stone-500">
                  {log.beanG}g · {log.waterG}g
                  {log.actualSec !== undefined ? ` · ${formatSec(log.actualSec)}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {log.taste && (
                  <span className="text-[10px] font-bold text-stone-500">
                    {TASTE_OPTIONS.find((t) => t.id === log.taste)?.label}
                  </span>
                )}
                {log.rating !== undefined && <StarRating value={log.rating} size={12} />}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
