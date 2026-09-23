import { useState } from 'react';
import type { BrewStep, Category, DripperType, Recipe, RoastLevel, ServeTemp } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { CATEGORIES } from '../lib/labels';

interface Props {
  /** 수정할 레시피. 없으면 새로 추가 */
  initial: Recipe | undefined;
  defaultCategory: Category;
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
}

interface DraftStep {
  min: string;
  sec: string;
  waterG: string;
  label: string;
  hint: string;
}

const emptyStep = (): DraftStep => ({ min: '', sec: '', waterG: '', label: '', hint: '' });

const toDraftSteps = (steps: BrewStep[]): DraftStep[] =>
  steps.map((s) => ({
    min: s.atSec === null ? '' : String(Math.floor(s.atSec / 60)),
    sec: s.atSec === null ? '' : String(s.atSec % 60),
    waterG: s.waterG === null ? '' : String(s.waterG),
    label: s.label,
    hint: s.hint ?? '',
  }));

/**
 * 레시피 추가/수정 폼.
 *
 * v1 에서 레시피를 하나 늘리려면 HTML 파일을 열어 객체 리터럴을 손으로 넣어야 했고,
 * 그래서 모카포트·에스프레소·캡슐 탭은 코드에 탭만 있고 내용이 비어 있었다.
 * 여기서 추가한 레시피는 브라우저에 저장되고, 설정에서 JSON 으로 내보내
 * 저장소의 seedRecipes 로 옮겨 심을 수 있다.
 */
export function RecipeForm({ initial, defaultCategory, onSave, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? defaultCategory);
  const [dripperType, setDripperType] = useState<DripperType>(initial?.dripperType ?? 'v60');
  const [serve, setServe] = useState<ServeTemp>(initial?.serve ?? 'hot');
  const [roast, setRoast] = useState<RoastLevel>(initial?.roast ?? 'any');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [tag, setTag] = useState(initial?.tag ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '');
  const [beanG, setBeanG] = useState(String(initial?.beanG ?? ''));
  const [tempC, setTempC] = useState(String(initial?.tempC ?? ''));
  const [grind, setGrind] = useState(initial?.grind ?? '');
  const [grinderText, setGrinderText] = useState(
    (initial?.grinderSettings ?? []).map((s) => `${s.grinder} ${s.setting}`).join(' / '),
  );
  const [gear, setGear] = useState(initial?.gear ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [finishNote, setFinishNote] = useState(initial?.finishing?.note ?? '');
  const [dilutionG, setDilutionG] = useState(String(initial?.finishing?.waterG ?? ''));
  const [steps, setSteps] = useState<DraftStep[]>(
    initial ? toDraftSteps(initial.steps) : [emptyStep()],
  );
  const [error, setError] = useState<string | null>(null);

  const parsedSteps: BrewStep[] = steps
    .filter((s) => s.label.trim() !== '')
    .map((s) => {
      const hasTime = s.min.trim() !== '' || s.sec.trim() !== '';
      const atSec = hasTime ? (Number(s.min || 0) || 0) * 60 + (Number(s.sec || 0) || 0) : null;
      const waterG = s.waterG.trim() === '' ? null : Number(s.waterG);
      const step: BrewStep = { atSec, waterG: Number.isFinite(waterG) ? waterG : null, label: s.label.trim() };
      if (s.hint.trim()) step.hint = s.hint.trim();
      return step;
    });

  const waterG = parsedSteps.reduce((acc, s) => acc + (s.waterG ?? 0), 0);
  const lastAt = parsedSteps.reduce((acc, s) => (s.atSec !== null && s.atSec > acc ? s.atSec : acc), 0);

  const setStep = (i: number, patch: Partial<DraftStep>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const submit = () => {
    if (!title.trim()) return setError('레시피 이름을 입력하세요.');
    const bean = Number(beanG);
    if (!Number.isFinite(bean) || bean <= 0) return setError('원두량을 숫자로 입력하세요.');
    const temp = Number(tempC);
    if (!Number.isFinite(temp) || temp <= 0) return setError('물 온도를 숫자로 입력하세요.');
    if (parsedSteps.length === 0) return setError('추출 단계를 최소 한 개 입력하세요.');
    if (waterG <= 0) return setError('단계 중 최소 하나에는 붓는 물 양이 있어야 합니다.');
    if (youtubeUrl.trim()) {
      try {
        const u = new URL(youtubeUrl.trim());
        if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('bad protocol');
      } catch {
        return setError('유튜브 주소가 올바른 URL 이 아닙니다.');
      }
    }

    const grinderSettings = grinderText
      .split('/')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const at = chunk.lastIndexOf(' ');
        return at > 0
          ? { grinder: chunk.slice(0, at).trim(), setting: chunk.slice(at + 1).trim() }
          : { grinder: chunk, setting: '' };
      });

    const dilution = Number(dilutionG);
    const recipe: Recipe = {
      id: initial?.id ?? `custom-${Date.now().toString(36)}`,
      title: title.trim(),
      category,
      serve,
      roast,
      beanG: bean,
      waterG,
      tempC: temp,
      grind: grind.trim() || '—',
      gear: gear.trim() || '—',
      totalSec: Math.max(lastAt, 1),
      steps: parsedSteps,
      custom: true,
    };
    if (category === 'drip') recipe.dripperType = dripperType;
    if (author.trim()) recipe.author = author.trim();
    if (tag.trim()) recipe.tag = tag.trim();
    if (youtubeUrl.trim()) recipe.youtubeUrl = youtubeUrl.trim();
    if (grinderSettings.length) recipe.grinderSettings = grinderSettings;
    if (note.trim()) recipe.note = note.trim();
    if (finishNote.trim() || (Number.isFinite(dilution) && dilution > 0)) {
      recipe.finishing = {};
      if (finishNote.trim()) recipe.finishing.note = finishNote.trim();
      if (Number.isFinite(dilution) && dilution > 0) recipe.finishing.waterG = dilution;
    }

    onSave(recipe);
  };

  const field = 'w-full rounded-lg border border-line-strong bg-well px-3 py-2 text-sm text-ink placeholder:text-ink-faint/70 focus:border-crema focus:outline-none';
  const labelCls = 'block text-xs font-semibold text-ink-soft';

  return (
    <Modal open onClose={onClose} label={initial ? '레시피 수정' : '레시피 추가'}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-card px-5 py-4">
        <h2 className="text-lg font-bold text-ink">{initial ? '레시피 수정' : '레시피 추가'}</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full bg-well p-2 text-ink-soft hover:bg-line">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className={labelCls} htmlFor="rf-title">이름 *</label>
          <input id="rf-title" className={`${field} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 비알레티 모카포트 기본" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="rf-category">분류</label>
            <select id="rf-category" className={`${field} mt-1`} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          {category === 'drip' ? (
            <div>
              <label className={labelCls} htmlFor="rf-dripper">드리퍼</label>
              <select id="rf-dripper" className={`${field} mt-1`} value={dripperType} onChange={(e) => setDripperType(e.target.value as DripperType)}>
                <option value="v60">V60</option>
                <option value="kalita">칼리타</option>
                <option value="chemex">케멕스</option>
                <option value="etc">대형/기타</option>
              </select>
            </div>
          ) : (
            <div />
          )}
          <div>
            <label className={labelCls} htmlFor="rf-serve">온도</label>
            <select id="rf-serve" className={`${field} mt-1`} value={serve} onChange={(e) => setServe(e.target.value as ServeTemp)}>
              <option value="hot">HOT</option>
              <option value="ice">ICE</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-roast">배전도</label>
            <select id="rf-roast" className={`${field} mt-1`} value={roast} onChange={(e) => setRoast(e.target.value as RoastLevel)}>
              <option value="any">범용</option>
              <option value="light">약배전</option>
              <option value="medium">중배전</option>
              <option value="dark">강배전</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-bean">원두 (g) *</label>
            <input id="rf-bean" className={`${field} mt-1`} inputMode="decimal" value={beanG} onChange={(e) => setBeanG(e.target.value)} placeholder="18" />
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-temp">물 온도 (℃) *</label>
            <input id="rf-temp" className={`${field} mt-1`} inputMode="decimal" value={tempC} onChange={(e) => setTempC(e.target.value)} placeholder="93" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="rf-author">작성자/채널</label>
            <input id="rf-author" className={`${field} mt-1`} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="용챔" />
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-tag">태그</label>
            <input id="rf-tag" className={`${field} mt-1`} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Best Seller" />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="rf-grind">분쇄도 서술</label>
          <input id="rf-grind" className={`${field} mt-1`} value={grind} onChange={(e) => setGrind(e.target.value)} placeholder="보통-굵게" />
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-grinder">그라인더 세팅</label>
          <input id="rf-grinder" className={`${field} mt-1`} value={grinderText} onChange={(e) => setGrinderText(e.target.value)} placeholder="코만단테 26~27 / EK43 13~14" />
          <p className="mt-1 text-[11px] text-ink-faint">여러 그라인더는 / 로 구분합니다.</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-gear">추천 기구</label>
          <input id="rf-gear" className={`${field} mt-1`} value={gear} onChange={(e) => setGear(e.target.value)} placeholder="하리오 V60 02" />
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-yt">유튜브 주소</label>
          <input id="rf-yt" className={`${field} mt-1`} type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtu.be/..." />
        </div>

        {/* 단계 */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-ink-soft uppercase">추출 단계 *</h3>
            <span className="num text-xs text-ink-faint">총 {waterG}g</span>
          </div>
          <div className="mt-2 space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="rounded-xl border border-line bg-well p-3">
                <div className="flex items-center gap-2">
                  <input aria-label={`${i + 1}단계 분`} className="w-12 rounded-md border border-line-strong bg-well px-2 py-1.5 text-center num text-sm text-ink focus:border-crema focus:outline-none" inputMode="numeric" value={s.min} onChange={(e) => setStep(i, { min: e.target.value })} placeholder="분" />
                  <span className="text-ink-faint">:</span>
                  <input aria-label={`${i + 1}단계 초`} className="w-12 rounded-md border border-line-strong bg-well px-2 py-1.5 text-center num text-sm text-ink focus:border-crema focus:outline-none" inputMode="numeric" value={s.sec} onChange={(e) => setStep(i, { sec: e.target.value })} placeholder="초" />
                  <input aria-label={`${i + 1}단계 물 양`} className="w-16 rounded-md border border-line-strong bg-well px-2 py-1.5 text-center num text-sm text-ink focus:border-crema focus:outline-none" inputMode="numeric" value={s.waterG} onChange={(e) => setStep(i, { waterG: e.target.value })} placeholder="g" />
                  <input aria-label={`${i + 1}단계 동작`} className="min-w-0 flex-1 rounded-md border border-line-strong bg-well px-2 py-1.5 text-sm text-ink focus:border-crema focus:outline-none" value={s.label} onChange={(e) => setStep(i, { label: e.target.value })} placeholder="동작 (예: 뜸 들이기)" />
                  <button type="button" onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))} aria-label={`${i + 1}단계 삭제`} disabled={steps.length === 1} className="shrink-0 rounded-md p-1.5 text-ink-faint hover:text-danger disabled:opacity-30">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                <input aria-label={`${i + 1}단계 힌트`} className={`${field} mt-2`} value={s.hint} onChange={(e) => setStep(i, { hint: e.target.value })} placeholder="힌트 (예: 가는 물줄기, 30초 대기)" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSteps((p) => [...p, emptyStep()])} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-2.5 text-sm font-semibold text-ink-soft hover:border-crema hover:text-crema">
            <Icon name="plus" size={16} />
            단계 추가
          </button>
          <p className="mt-2 text-[11px] text-ink-faint">시간을 비우면 시계로 자동 진행하지 않는 단계가 됩니다. 물 양을 비우면 &quot;눈대중&quot;으로 표시됩니다.</p>
        </section>

        <div>
          <label className={labelCls} htmlFor="rf-note">메모</label>
          <textarea id="rf-note" rows={2} className={`${field} mt-1 resize-none`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="교반 필수 / 가수 권장 등" />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className={labelCls} htmlFor="rf-finish">마무리 안내</label>
            <input id="rf-finish" className={`${field} mt-1`} value={finishNote} onChange={(e) => setFinishNote(e.target.value)} placeholder="2분 30초 종료 → 드리퍼 제거" />
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-dilution">가수 (g)</label>
            <input id="rf-dilution" className={`${field} mt-1 w-24`} inputMode="numeric" value={dilutionG} onChange={(e) => setDilutionG(e.target.value)} placeholder="70" />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </div>

      <footer className="flex shrink-0 gap-2 border-t border-line bg-card p-4">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-line-strong bg-well py-3 font-bold text-ink-soft hover:bg-line">
          취소
        </button>
        <button type="button" onClick={submit} className="flex-[2] rounded-xl bg-crema py-3 font-bold text-on-crema hover:bg-crema-deep">
          저장
        </button>
      </footer>
    </Modal>
  );
}
