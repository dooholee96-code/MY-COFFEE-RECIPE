import { useState } from 'react';
import type { Bean, BrewLog, Recipe, TasteVerdict } from '../types';
import { formatSec } from '../lib/brew';
import { TASTE_OPTIONS, daysOffRoast, suggestAdjustment } from '../lib/dialIn';
import { type Calibration, type GrinderProfile, convertSetting, matchGrinderProfile } from '../lib/grinders';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { StarRating } from './StarRating';

interface Props {
  recipe: Recipe;
  beans: Bean[];
  /** 타이머로 내렸다면 실제 걸린 시간이 들어온다 */
  actualSec: number | undefined;
  existing: BrewLog | undefined;
  myGrinder: GrinderProfile | undefined;
  calibration: Calibration;
  /** 지금 쓰는 원두 — 새 기록의 원두 기본값 */
  defaultBeanId: string | undefined;
  onSave: (log: BrewLog) => void;
  onClose: () => void;
}

/**
 * 분쇄도 입력의 기본값.
 * 내 그라인더가 설정돼 있으면 레시피의 코만단테 값이 아니라 환산된 내 값으로 채운다 —
 * 실제로 내가 돌린 클릭 수가 기록에 남아야 나중에 다시 쓸 수 있다.
 */
function defaultGrindNote(recipe: Recipe, myGrinder: GrinderProfile | undefined, calibration: Calibration): string {
  const settings = recipe.grinderSettings ?? [];
  if (!settings.length) return '';

  if (myGrinder) {
    const direct = settings.find((s) => matchGrinderProfile(s.grinder)?.id === myGrinder.id);
    if (direct) return `${direct.grinder} ${direct.setting}`;

    for (const s of settings) {
      const from = matchGrinderProfile(s.grinder);
      if (!from) continue;
      const converted = convertSetting(s.setting, from, myGrinder, calibration);
      if (converted) return `${myGrinder.name} ${converted.text}`;
    }
  }
  return settings.map((s) => `${s.grinder} ${s.setting}`).join(' / ');
}

/**
 * 한 번 내린 것을 기록한다.
 *
 * 조사한 앱들이 공통으로 하는 일이 이것이고, 이 앱에 가장 크게 빠져 있던 부분이다.
 * 레시피만 보여주는 앱은 "이 레시피로 내가 뭘 했고 어땠는지"를 기억하지 못한다.
 *
 * 맛을 고르면 다음에 바꿀 것 한 가지를 바로 보여준다 — 기록을 남기는 순간에
 * 다음 행동이 정해지지 않으면 기록은 쌓이기만 하고 쓰이지 않는다.
 */
export function BrewLogForm({
  recipe,
  beans,
  actualSec,
  existing,
  myGrinder,
  calibration,
  defaultBeanId,
  onSave,
  onClose,
}: Props) {
  const [beanId, setBeanId] = useState(existing ? (existing.beanId ?? '') : (defaultBeanId ?? ''));
  const [beanG, setBeanG] = useState(String(existing?.beanG ?? recipe.beanG));
  const [waterG, setWaterG] = useState(String(existing?.waterG ?? recipe.waterG));
  const [tempC, setTempC] = useState(String(existing?.tempC ?? recipe.tempC));
  const [grindNote, setGrindNote] = useState(
    existing?.grindNote ?? defaultGrindNote(recipe, myGrinder, calibration),
  );
  const [elapsed, setElapsed] = useState(() => {
    if (existing?.actualSec !== undefined) return String(existing.actualSec);
    // 타이머를 돌리지 않고 기록하면 0초가 들어온다 — 0 을 실제 기록으로 남기지 않는다
    if (actualSec !== undefined && actualSec >= 1) return String(Math.round(actualSec));
    return '';
  });
  const [rating, setRating] = useState<number | undefined>(existing?.rating);
  const [taste, setTaste] = useState<TasteVerdict | undefined>(existing?.taste);
  const [note, setNote] = useState(existing?.note ?? '');

  const parsedElapsed = elapsed.trim() === '' ? undefined : Number(elapsed);
  const advice = taste
    ? suggestAdjustment(
        taste,
        Number.isFinite(parsedElapsed) && parsedElapsed
          ? { targetSec: recipe.totalSec, actualSec: parsedElapsed }
          : { targetSec: recipe.totalSec },
      )
    : null;

  const submit = () => {
    const log: BrewLog = {
      id: existing?.id ?? `log-${Date.now().toString(36)}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      brewedAt: existing?.brewedAt ?? new Date().toISOString(),
      beanG: Number(beanG) || recipe.beanG,
      waterG: Number(waterG) || recipe.waterG,
      tempC: Number(tempC) || recipe.tempC,
    };
    if (beanId) log.beanId = beanId;
    if (grindNote.trim()) log.grindNote = grindNote.trim();
    if (Number.isFinite(parsedElapsed) && parsedElapsed) log.actualSec = parsedElapsed;
    if (rating !== undefined) log.rating = rating;
    if (taste) log.taste = taste;
    if (note.trim()) log.note = note.trim();
    onSave(log);
  };

  const field =
    'w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-600 focus:outline-none';
  const labelCls = 'block text-xs font-semibold text-stone-400';
  const activeBeans = beans.filter((b) => !b.finished || b.id === beanId);

  return (
    <Modal open onClose={onClose} label="추출 기록">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-700 bg-stone-800 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-stone-100">{existing ? '기록 수정' : '추출 기록'}</h2>
          <p className="truncate text-xs text-stone-500">{recipe.title}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" className="shrink-0 rounded-full bg-stone-700 p-2 text-stone-300 hover:bg-stone-600">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {/* 맛 — 가장 먼저 묻는다. 나머지는 대부분 자동으로 채워져 있다. */}
        <section>
          <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">어땠나요?</h3>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {TASTE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={taste === opt.id}
                onClick={() => setTaste(taste === opt.id ? undefined : opt.id)}
                className={`rounded-lg border px-1 py-2.5 text-xs font-bold transition ${
                  taste === opt.id
                    ? 'border-transparent bg-amber-600 text-white'
                    : 'border-stone-700 bg-stone-900/50 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {taste && <p className="mt-1.5 text-[11px] text-stone-500">{TASTE_OPTIONS.find((o) => o.id === taste)?.hint}</p>}
        </section>

        {/* 조정 제안 — 기록하는 그 자리에서 다음 행동을 준다 */}
        {advice && (
          <section className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-4">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-600 uppercase">
              <Icon name="info" size={13} />
              다음엔 이것 하나만
            </h3>
            <p className="mt-1.5 text-base font-bold text-amber-300">{advice.headline}</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-200/80">{advice.reason}</p>
            {advice.alternatives.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-amber-500/80 hover:text-amber-400">
                  그래도 안 되면
                </summary>
                <ul className="mt-1.5 space-y-1 pl-4 text-xs text-amber-200/70">
                  {advice.alternatives.map((alt) => (
                    <li key={alt} className="list-disc">{alt}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">별점</h3>
          <div className="mt-2">
            <StarRating value={rating} onChange={setRating} size={26} />
          </div>
        </section>

        {/* 실제로 쓴 값 — 레시피 값으로 미리 채워 두고 다른 점만 고치게 한다 */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">실제로 쓴 값</h3>

          <div>
            <label className={labelCls} htmlFor="bl-bean">원두</label>
            <select id="bl-bean" className={`${field} mt-1`} value={beanId} onChange={(e) => setBeanId(e.target.value)}>
              <option value="">선택 안 함</option>
              {activeBeans.map((b) => {
                const days = daysOffRoast(b.roastedOn);
                return (
                  <option key={b.id} value={b.id}>
                    {[b.roaster, b.name].filter(Boolean).join(' ')}
                    {days !== null ? ` (로스팅 ${days}일차)` : ''}
                  </option>
                );
              })}
            </select>
            {beans.length === 0 && <p className="mt-1 text-[11px] text-stone-500">원두 탭에서 원두를 등록하면 여기서 고를 수 있습니다.</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls} htmlFor="bl-bean-g">원두 (g)</label>
              <input id="bl-bean-g" className={`${field} mt-1`} inputMode="decimal" value={beanG} onChange={(e) => setBeanG(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="bl-water">물 (g)</label>
              <input id="bl-water" className={`${field} mt-1`} inputMode="decimal" value={waterG} onChange={(e) => setWaterG(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="bl-temp">온도 (℃)</label>
              <input id="bl-temp" className={`${field} mt-1`} inputMode="decimal" value={tempC} onChange={(e) => setTempC(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="bl-grind">분쇄도</label>
            <input id="bl-grind" className={`${field} mt-1`} value={grindNote} onChange={(e) => setGrindNote(e.target.value)} placeholder="코만단테 24클릭" />
          </div>

          <div>
            <label className={labelCls} htmlFor="bl-sec">
              실제 걸린 시간 (초)
              {parsedElapsed ? <span className="ml-1.5 font-mono text-stone-500">{formatSec(parsedElapsed)} · 목표 {formatSec(recipe.totalSec)}</span> : null}
            </label>
            <input id="bl-sec" className={`${field} mt-1`} inputMode="numeric" value={elapsed} onChange={(e) => setElapsed(e.target.value)} placeholder={String(recipe.totalSec)} />
          </div>

          <div>
            <label className={labelCls} htmlFor="bl-note">메모</label>
            <textarea id="bl-note" rows={2} className={`${field} mt-1 resize-none`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="물줄기가 굵었음 / 뜸이 짧았음" />
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 gap-2 border-t border-stone-700 bg-stone-800 p-4">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-stone-600 bg-stone-700 py-3 font-bold text-stone-300 hover:bg-stone-600">
          취소
        </button>
        <button type="button" onClick={submit} className="flex-[2] rounded-xl bg-amber-600 py-3 font-bold text-white hover:bg-amber-500">
          저장
        </button>
      </footer>
    </Modal>
  );
}
