import type { ReactNode } from 'react';
import type { BrewLog, Recipe } from '../types';
import { cumulativeWater, formatRatio, formatSec, servedVolumeG } from '../lib/brew';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { BrewTimer } from './BrewTimer';
import { roastLabel } from '../lib/labels';
import { StarRating } from './StarRating';
import { GrindSetting } from './GrindSetting';
import { PourGlyph } from './PourGlyph';
import { describePour } from '../lib/pour';
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
  onLogBrew: (actualSec: number) => void;
  onOpenLog: (log: BrewLog) => void;
  myGrinder: GrinderProfile | undefined;
  calibration: Calibration;
  /** 지금 쓰는 원두 선택 — 바꾸면 분쇄도 환산이 바로 바뀐다 */
  beanPicker: ReactNode;
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
  beanPicker,
}: Props) {
  const cumulative = cumulativeWater(recipe.steps);

  return (
    <Modal open onClose={onClose} label={`${recipe.title} 상세`}>
      {/* 헤더 */}
      <header
        className={`flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 pt-5 pb-4 ${
          recipe.serve === 'hot' ? 'bg-hot-soft' : 'bg-ice-soft'
        }`}
      >
        <div className="min-w-0">
          {/* 메뉴판의 섹션 머리처럼 — 온도와 배전도 */}
          <p className={`eyebrow ${recipe.serve === 'hot' ? 'text-hot' : 'text-ice'}`}>
            {recipe.serve === 'hot' ? 'Hot' : 'Iced'} · {roastLabel(recipe.roast)}
          </p>
          <h2 className="mt-1 truncate text-xl leading-tight font-bold text-ink">{recipe.title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
            <span className="num text-[13px]">
              {recipe.beanG}g · {recipe.waterG}g · {formatRatio(recipe)}
            </span>
            {recipe.author && !recipe.title.includes(recipe.author) && <span>· {recipe.author}</span>}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={favorite}
            aria-label={`즐겨찾기 ${favorite ? '해제' : '추가'}`}
            className={`rounded-full bg-card/70 p-2 transition hover:bg-card ${favorite ? 'text-crema' : 'text-ink-soft'}`}
          >
            <Icon name="star" size={18} filled={favorite} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full bg-card/70 p-2 text-ink-soft transition hover:bg-card"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <BrewTimer recipe={recipe} soundOn={soundOn} onLogBrew={onLogBrew} />


        {beanPicker}

        {/* 설정값 */}
        <dl className="grid grid-cols-2 gap-2">
          {[
            { icon: 'thermometer' as const, label: '물 온도', value: `${recipe.tempC}℃`, numeric: true, wide: false },
            { icon: 'clock' as const, label: '목표 시간', value: formatSec(recipe.totalSec), numeric: true, wide: false },
            { icon: 'filter' as const, label: '추천 기구', value: recipe.gear, numeric: false, wide: true },
          ].map((cell) => (
            <div
              key={cell.label}
              className={`flex flex-col items-center gap-1 rounded-xl border border-line bg-well p-3 text-center ${cell.wide ? 'col-span-2' : ''}`}
            >
              <Icon name={cell.icon} size={16} className="text-ink-faint" />
              <dt className="text-[11px] text-ink-faint">{cell.label}</dt>
              <dd
                className={
                  cell.numeric
                    ? 'num text-lg leading-tight font-semibold text-ink'
                    : 'text-[13px] leading-tight font-bold whitespace-pre-line text-ink'
                }
              >
                {cell.value}
              </dd>
            </div>
          ))}
          <div className="col-span-2 flex flex-col items-center gap-1 rounded-xl border border-line bg-well p-3 text-center">
            <Icon name="grinder" size={16} className="text-ink-faint" />
            <dt className="text-[11px] text-ink-faint">분쇄도</dt>
            <dd className="text-[13px] leading-tight font-bold text-ink">
              <GrindSetting
                settings={recipe.grinderSettings ?? []}
                myGrinder={myGrinder}
                calibration={calibration}
                fallback={recipe.grind}
              />
            </dd>
            {myGrinder && myGrinder.id !== 'comandante' && (
              <p className="mt-0.5 text-[10px] leading-snug text-ink-faint">
                환산값은 출발점입니다. 맛을 보고 보정하세요 — 설정에서 기준을 바꿀 수 있습니다.
              </p>
            )}
          </div>
        </dl>

        {recipe.note && (
          <p className="flex items-start gap-2 rounded-xl border border-crema/25 bg-crema-soft px-4 py-3 text-sm leading-relaxed text-ink">
            <span className="shrink-0 font-bold text-crema">Check!</span>
            {recipe.note}
          </p>
        )}

        {recipe.waterNote && (
          <p className="flex items-start gap-1.5 text-xs text-ink-faint">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            {recipe.waterNote}
          </p>
        )}

        {/* 단계표 — 타이머와 같은 데이터를 훑어볼 수 있게 */}
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-ink-soft uppercase">
            <Icon name="clock" size={14} className="text-crema" />
            추출 단계
          </h4>
          <ol className="overflow-hidden rounded-xl border border-line">
            {recipe.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-line bg-well px-3 py-2.5 last:border-0"
              >
                <span className="w-12 shrink-0 num text-xs font-semibold text-ink-faint">
                  {step.atSec === null ? '—' : formatSec(step.atSec)}
                </span>
                {step.pour && describePour(step.pour) ? (
                  <PourGlyph pour={step.pour} size={44} />
                ) : (
                  <span className="w-11 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-ink">{step.label}</span>
                  {step.hint && <span className="ml-1.5 text-xs text-ink-faint">{step.hint}</span>}
                  {describePour(step.pour) && (
                    <span className="block text-xs font-semibold text-crema-deep">{describePour(step.pour)}</span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  {step.waterG !== null && step.waterG > 0 ? (
                    <>
                      <span className="num text-sm font-bold text-crema">+{step.waterG}g</span>
                      <span className="ml-1.5 num text-[11px] text-ink-faint">
                        {cumulative[i] === null ? '' : `→ ${cumulative[i]}g`}
                      </span>
                    </>
                  ) : (
                    <span className="num text-xs text-ink-faint">{step.waterG === null ? '눈대중' : '—'}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
          {recipe.pourSource && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-ink-faint">
              <Icon name="info" size={12} className="mt-0.5 shrink-0" />
              붓는 방식 출처: {recipe.pourSource}
            </p>
          )}
        </section>

        {/* 마무리 */}
        <section className="space-y-2 rounded-xl border border-dashed border-line p-4">
          <h4 className="text-xs font-bold tracking-wider text-ink-soft uppercase">마무리</h4>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">추출 총 투입량</dt>
              <dd className="num font-bold text-ink">{recipe.waterG}g</dd>
            </div>
            {recipe.finishing?.waterG !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">가수</dt>
                <dd className="num font-bold text-ink">+{recipe.finishing.waterG}g</dd>
              </div>
            )}
            {recipe.finishing?.milkG !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">우유</dt>
                <dd className="num font-bold text-ink">+{recipe.finishing.milkG}g</dd>
              </div>
            )}
            {recipe.finishing?.iceG !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">얼음 (미리 준비)</dt>
                <dd className="num font-bold text-ink">{recipe.finishing.iceG}g</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-line pt-1.5">
              <dt className="font-semibold text-ink-soft">잔에 담기는 양</dt>
              <dd className="num text-base font-bold text-crema">약 {servedVolumeG(recipe)}g</dd>
            </div>
          </dl>
          {recipe.finishing?.note && <p className="pt-1 text-sm text-ink-soft">{recipe.finishing.note}</p>}
        </section>

        {/* 내 기록 — 레시피를 다시 열었을 때 지난번에 어땠는지 바로 보이게 */}
        {logs.length > 0 && <PastBrews logs={logs} onOpenLog={onOpenLog} />}

        {/* 액션 */}
        <div className="space-y-2">
          {sibling && (
            <button
              type="button"
              onClick={() => onSwitchTo(sibling.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-well py-3 font-bold text-ink transition hover:bg-line"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-card py-3 font-bold text-ink transition hover:bg-well"
            >
              <Icon name="youtube" size={18} className="text-hot" />
              유튜브 원본 영상 보기
            </a>
          ) : (
            <p className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-well py-3 text-sm font-bold text-ink-faint">
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-well py-3 font-bold text-ink transition hover:bg-line"
                >
                  <Icon name="edit" size={16} />
                  수정
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 font-bold text-danger transition hover:bg-danger-soft"
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
        <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-ink-soft uppercase">
          <Icon name="clock" size={14} className="text-crema" />
          내 기록 {logs.length}회
        </h4>
        {avg !== null && (
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            평균
            <StarRating value={Math.round(avg)} size={12} />
            {avg.toFixed(1)}
          </span>
        )}
      </div>

      {best && (
        <p className="mb-2 rounded-xl border border-sage/25 bg-sage-soft px-3 py-2 text-xs text-ink">
          <span className="font-bold text-sage">가장 잘 나온 설정</span>{' '}
          <span className="num">
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
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-well px-3 py-2 text-left transition hover:border-line-strong"
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-ink-soft">
                  {new Date(log.brewedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
                <span className="block truncate num text-[11px] text-ink-faint">
                  {log.beanG}g · {log.waterG}g
                  {log.actualSec !== undefined ? ` · ${formatSec(log.actualSec)}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {log.taste && (
                  <span className="text-[10px] font-bold text-ink-faint">
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
