import type { Bean, BrewLog } from '../types';
import { formatSec } from '../lib/brew';
import { TASTE_OPTIONS, daysOffRoast } from '../lib/dialIn';
import { Icon } from './Icon';
import { StarRating } from './StarRating';
import { PourOverArt } from './PourOverArt';

interface Props {
  logs: BrewLog[];
  beans: Bean[];
  onOpenRecipe: (recipeId: string) => void;
  onEdit: (log: BrewLog) => void;
  onDelete: (id: string) => void;
}

const dateLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

/** 추출 기록 목록. 날짜별로 묶어 보여준다. */
export function LogsView({ logs, beans, onOpenRecipe, onEdit, onDelete }: Props) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <PourOverArt className="mx-auto h-24 w-24 text-line-strong" />
        <p className="mt-3 font-semibold text-ink-soft">아직 기록이 없습니다.</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-faint">
          레시피를 열고 타이머로 내린 뒤 &quot;기록하기&quot;를 누르면 여기에 쌓입니다. 맛을 고르면 다음에
          바꿀 것 한 가지를 알려줍니다.
        </p>
      </div>
    );
  }

  const sorted = [...logs].sort((a, b) => b.brewedAt.localeCompare(a.brewedAt));
  const groups = new Map<string, BrewLog[]>();
  for (const log of sorted) {
    const key = dateLabel(log.brewedAt);
    groups.set(key, [...(groups.get(key) ?? []), log]);
  }

  return (
    <div className="space-y-6">
      {[...groups].map(([date, dayLogs]) => (
        <section key={date}>
          <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-faint uppercase">{date}</h3>
          <div className="space-y-3">
            {dayLogs.map((log) => {
              const bean = beans.find((b) => b.id === log.beanId);
              const days = bean ? daysOffRoast(bean.roastedOn, new Date(log.brewedAt)) : null;
              const taste = TASTE_OPTIONS.find((t) => t.id === log.taste);

              return (
                <article key={log.id} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenRecipe(log.recipeId)}
                        className="truncate text-left font-bold text-ink hover:text-crema"
                      >
                        {log.recipeTitle}
                      </button>
                      <p className="truncate text-xs text-ink-faint">
                        {timeLabel(log.brewedAt)}
                        {bean && ` · ${[bean.roaster, bean.name].filter(Boolean).join(' ')}`}
                        {days !== null && ` (로스팅 ${days}일차)`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => onEdit(log)} aria-label="기록 수정" className="rounded-lg p-1.5 text-ink-faint hover:text-ink">
                        <Icon name="edit" size={15} />
                      </button>
                      <button type="button" onClick={() => onDelete(log.id)} aria-label="기록 삭제" className="rounded-lg p-1.5 text-ink-faint hover:text-danger">
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {log.rating !== undefined && <StarRating value={log.rating} size={15} />}
                    {taste && (
                      <span className="rounded-full border border-line-strong bg-well px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                        {taste.label}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 num text-xs text-ink-soft">
                    {log.beanG}g · {log.waterG}g · {log.tempC}℃
                    {log.actualSec !== undefined && ` · ${formatSec(log.actualSec)}`}
                    {log.grindNote && ` · ${log.grindNote}`}
                  </p>

                  {log.note && <p className="mt-2 text-xs leading-relaxed text-ink-soft">{log.note}</p>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
