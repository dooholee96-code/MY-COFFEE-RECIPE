import { useState } from 'react';
import type { Bean, BrewLog, RoastLevel } from '../types';
import { daysOffRoast, restingAdvice } from '../lib/dialIn';
import { roastLabel } from '../lib/labels';
import { type GrinderProfile, beanAnchorFor } from '../lib/grinders';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props {
  beans: Bean[];
  logs: BrewLog[];
  myGrinder: GrinderProfile | undefined;
  activeBeanId: string | null;
  onActivate: (id: string | null) => void;
  onSave: (bean: Bean) => void;
  onDelete: (id: string) => void;
}

const toneClass = {
  early: 'border-sky-800/50 bg-sky-950/30 text-sky-300',
  good: 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300',
  late: 'border-stone-600 bg-stone-800 text-stone-400',
} as const;

/**
 * 원두 보관함.
 *
 * Beanconqueror 를 비롯한 기록형 앱들이 공통으로 갖는 축. 로스팅 날짜를 들고 있는 이유는
 * 같은 레시피라도 로스팅 3일차와 25일차가 다르게 나오기 때문이다 — 기록에 원두를 묶어 두면
 * 나중에 "그때 왜 이랬지" 를 설명할 수 있다.
 */
export function BeansView({ beans, logs, myGrinder, activeBeanId, onActivate, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Bean | null | undefined>(undefined); // null = 새로 추가

  const active = beans.filter((b) => !b.finished);
  const finished = beans.filter((b) => b.finished);

  const card = (bean: Bean) => {
    const days = daysOffRoast(bean.roastedOn);
    const advice = restingAdvice(days);
    const beanLogs = logs.filter((l) => l.beanId === bean.id).sort((a, b) => b.brewedAt.localeCompare(a.brewedAt));
    const used = beanLogs.length;
    const anchor = beanAnchorFor(bean, myGrinder);
    const active = bean.id === activeBeanId;
    // 기준을 정할 때 참고하도록 이 원두로 마지막에 쓴 분쇄도를 보여준다
    const lastGrind = beanLogs.find((l) => l.grindNote)?.grindNote;

    return (
      <article
        key={bean.id}
        className={`rounded-2xl border p-4 ${
          bean.finished
            ? 'border-stone-800 bg-stone-900/40 opacity-60'
            : active
              ? 'border-amber-700 bg-stone-800'
              : 'border-stone-700 bg-stone-800'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-stone-100">{bean.name}</h3>
            <p className="truncate text-xs text-stone-500">
              {[bean.roaster, bean.origin, bean.process].filter(Boolean).join(' · ') || ' '}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(bean)}
            aria-label={`${bean.name} 수정`}
            className="shrink-0 rounded-lg p-1.5 text-stone-500 hover:text-stone-300"
          >
            <Icon name="edit" size={16} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {bean.roastLevel && (
            <span className="rounded-full border border-stone-600 bg-stone-700/50 px-2 py-0.5 text-[10px] font-bold text-stone-300">
              {roastLabel(bean.roastLevel)}
            </span>
          )}
          {advice && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${toneClass[advice.tone]}`}>
              {advice.label}
            </span>
          )}
          {used > 0 && (
            <span className="rounded-full border border-stone-700 px-2 py-0.5 text-[10px] font-bold text-stone-500">
              {used}회 사용
            </span>
          )}
        </div>

        {myGrinder && (
          <p className="mt-3 flex items-baseline justify-between gap-2 rounded-lg bg-stone-900/60 px-3 py-2 text-xs">
            <span className="text-stone-500">{myGrinder.name} V60 기준</span>
            {anchor !== null ? (
              <span className="font-mono text-sm font-bold text-stone-100">{anchor}클릭</span>
            ) : (
              <span className="text-stone-600">미지정 · 기본값 사용</span>
            )}
          </p>
        )}
        {lastGrind && <p className="mt-1.5 text-[11px] text-stone-500">최근 기록: {lastGrind}</p>}

        {bean.notes && <p className="mt-2 text-xs leading-relaxed text-stone-400">{bean.notes}</p>}

        {!bean.finished && (
          <button
            type="button"
            onClick={() => onActivate(active ? null : bean.id)}
            aria-pressed={active}
            className={`mt-3 w-full rounded-lg border py-2 text-xs font-bold transition ${
              active
                ? 'border-transparent bg-amber-700 text-white'
                : 'border-stone-600 bg-stone-700 text-stone-300 hover:bg-stone-600'
            }`}
          >
            {active ? '지금 쓰는 원두' : '이 원두로 내리기'}
          </button>
        )}
      </article>
    );
  };

  return (
    <>
      {beans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-700 px-6 py-14 text-center">
          <Icon name="scale" size={32} className="mx-auto text-stone-700" />
          <p className="mt-3 font-semibold text-stone-300">등록된 원두가 없습니다.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-500">
            원두를 등록하면 로스팅 후 며칠째인지 계산해 주고, 추출 기록에 원두를 묶어 둘 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-500"
          >
            <Icon name="plus" size={16} />
            원두 등록
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{active.map(card)}</div>
          {finished.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold tracking-wider text-stone-500 uppercase">다 마신 원두</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{finished.map(card)}</div>
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing(null)}
        className="fixed right-5 bottom-5 z-20 flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-black/40 transition hover:bg-amber-500"
      >
        <Icon name="plus" size={18} />
        원두 등록
      </button>

      {editing !== undefined && (
        <BeanForm
          initial={editing}
          myGrinder={myGrinder}
          onSave={(b) => {
            onSave(b);
            // 새로 등록한 원두는 보통 바로 뜯어 쓰는 원두다
            if (editing === null && activeBeanId === null && !b.finished) onActivate(b.id);
            setEditing(undefined);
          }}
          onDelete={
            editing
              ? () => {
                  onDelete(editing.id);
                  setEditing(undefined);
                }
              : undefined
          }
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}

function BeanForm({
  initial,
  myGrinder,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Bean | null;
  myGrinder: GrinderProfile | undefined;
  onSave: (bean: Bean) => void;
  onDelete: (() => void) | undefined;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [roaster, setRoaster] = useState(initial?.roaster ?? '');
  const [origin, setOrigin] = useState(initial?.origin ?? '');
  const [process, setProcess] = useState(initial?.process ?? '');
  const [roastLevel, setRoastLevel] = useState<RoastLevel | ''>(initial?.roastLevel ?? '');
  const [roastedOn, setRoastedOn] = useState(initial?.roastedOn ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [finished, setFinished] = useState(initial?.finished ?? false);
  const [anchor, setAnchor] = useState(String(beanAnchorFor(initial ?? undefined, myGrinder) ?? ''));
  // 다른 그라인더 기준으로 적힌 값은 지우지 않고 보존한다
  const foreignAnchor =
    initial?.grindAnchor && initial.grindAnchor.grinderId !== myGrinder?.id ? initial.grindAnchor : undefined;
  const [error, setError] = useState<string | null>(null);

  const field = 'w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-600 focus:outline-none';
  const labelCls = 'block text-xs font-semibold text-stone-400';

  const submit = () => {
    if (!name.trim()) return setError('원두 이름을 입력하세요.');
    const bean: Bean = { id: initial?.id ?? `bean-${Date.now().toString(36)}`, name: name.trim() };
    if (roaster.trim()) bean.roaster = roaster.trim();
    if (origin.trim()) bean.origin = origin.trim();
    if (process.trim()) bean.process = process.trim();
    if (roastLevel) bean.roastLevel = roastLevel;
    if (roastedOn) bean.roastedOn = roastedOn;
    if (notes.trim()) bean.notes = notes.trim();
    if (finished) bean.finished = true;
    const clicks = Number(anchor);
    if (myGrinder && anchor.trim() !== '') {
      if (!Number.isFinite(clicks) || clicks <= 0) return setError('기준 클릭 수를 숫자로 입력하세요.');
      bean.grindAnchor = { grinderId: myGrinder.id, clicks };
    } else if (foreignAnchor) {
      bean.grindAnchor = foreignAnchor;
    }
    onSave(bean);
  };

  return (
    <Modal open onClose={onClose} label={initial ? '원두 수정' : '원두 등록'}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-700 bg-stone-800 px-5 py-4">
        <h2 className="text-lg font-bold text-stone-100">{initial ? '원두 수정' : '원두 등록'}</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full bg-stone-700 p-2 text-stone-300 hover:bg-stone-600">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        <div>
          <label className={labelCls} htmlFor="bf-name">이름 *</label>
          <input id="bf-name" className={`${field} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="에티오피아 예가체프" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="bf-roaster">로스터리</label>
            <input id="bf-roaster" className={`${field} mt-1`} value={roaster} onChange={(e) => setRoaster(e.target.value)} placeholder="프릳츠" />
          </div>
          <div>
            <label className={labelCls} htmlFor="bf-origin">산지</label>
            <input id="bf-origin" className={`${field} mt-1`} value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="에티오피아" />
          </div>
          <div>
            <label className={labelCls} htmlFor="bf-process">가공</label>
            <input id="bf-process" className={`${field} mt-1`} value={process} onChange={(e) => setProcess(e.target.value)} placeholder="워시드" />
          </div>
          <div>
            <label className={labelCls} htmlFor="bf-roast">배전도</label>
            <select id="bf-roast" className={`${field} mt-1`} value={roastLevel} onChange={(e) => setRoastLevel(e.target.value as RoastLevel | '')}>
              <option value="">선택 안 함</option>
              <option value="light">약배전</option>
              <option value="medium">중배전</option>
              <option value="dark">강배전</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="bf-date">로스팅 날짜</label>
          <input id="bf-date" type="date" className={`${field} mt-1`} value={roastedOn} onChange={(e) => setRoastedOn(e.target.value)} />
          <p className="mt-1 text-[11px] text-stone-500">며칠째인지 계산해 목록과 기록에 표시합니다.</p>
        </div>
        {myGrinder ? (
          <div>
            <label className={labelCls} htmlFor="bf-anchor">
              {myGrinder.name} V60 기준 클릭
            </label>
            <input
              id="bf-anchor"
              inputMode="decimal"
              className={`${field} mt-1`}
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              placeholder={`비우면 기본값 (${myGrinder.v60Anchor})`}
            />
            <p className="mt-1 text-[11px] leading-snug text-stone-500">
              이 원두로 V60 이 잘 나오는 클릭 수. 이 원두를 고르면 모든 레시피의 분쇄도가 이 값을 기준으로
              다시 환산됩니다.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-stone-500">설정에서 내 그라인더를 고르면 원두별 분쇄 기준을 저장할 수 있습니다.</p>
        )}

        <div>
          <label className={labelCls} htmlFor="bf-notes">메모</label>
          <textarea id="bf-notes" rows={2} className={`${field} mt-1 resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="자몽, 홍차 / 92점" />
        </div>
        <label className="flex items-center gap-2 pt-1 text-sm font-semibold text-stone-300">
          <input type="checkbox" checked={finished} onChange={(e) => setFinished(e.target.checked)} className="h-4 w-4 accent-amber-600" />
          다 마셨음
        </label>

        {error && <p role="alert" className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}
      </div>

      <footer className="flex shrink-0 gap-2 border-t border-stone-700 bg-stone-800 p-4">
        {onDelete && (
          <button type="button" onClick={onDelete} aria-label="원두 삭제" className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 font-bold text-red-300 hover:bg-red-900/40">
            <Icon name="trash" size={16} />
          </button>
        )}
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
