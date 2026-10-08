import { useState } from 'react';
import type { BrewStep, Category, DripperType, PourTechnique, Recipe, RoastLevel, ServeTemp } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { CATEGORIES } from '../lib/labels';
import { formatSec, sortSteps } from '../lib/brew';
import { parseGrinderText } from '../lib/grinders';
import { FLOW_LABEL, PATTERN_LABEL, describePour } from '../lib/pour';
import { PourGlyph } from './PourGlyph';

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
  pattern: PourTechnique['pattern'] | '';
  flow: PourTechnique['flow'] | '';
  pace: PourTechnique['pace'] | '';
  agitation: PourTechnique['agitation'] | '';
}

const emptyStep = (): DraftStep => ({
  min: '',
  sec: '',
  waterG: '',
  label: '',
  hint: '',
  pattern: '',
  flow: '',
  pace: '',
  agitation: '',
});

const toDraftSteps = (steps: BrewStep[]): DraftStep[] =>
  steps.map((s) => ({
    min: s.atSec === null ? '' : String(Math.floor(s.atSec / 60)),
    sec: s.atSec === null ? '' : String(s.atSec % 60),
    waterG: s.waterG === null ? '' : String(s.waterG),
    label: s.label,
    hint: s.hint ?? '',
    pattern: s.pour?.pattern ?? '',
    flow: s.pour?.flow ?? '',
    pace: s.pour?.pace ?? '',
    agitation: s.pour?.agitation ?? '',
  }));

const splitSec = (sec: number | undefined) => ({
  min: sec === undefined ? '' : String(Math.floor(sec / 60)),
  sec: sec === undefined ? '' : String(sec % 60),
});

/** 분·초 두 칸을 초로. 둘 다 비었으면 undefined */
function toSec(min: string, sec: string): number | undefined {
  if (min.trim() === '' && sec.trim() === '') return undefined;
  const m = Number(min || 0);
  const s = Number(sec || 0);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return undefined;
  return Math.max(0, Math.round(m * 60 + s));
}

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
  const [total, setTotal] = useState(splitSec(initial?.totalSec));
  const [steps, setSteps] = useState<DraftStep[]>(initial ? toDraftSteps(initial.steps) : [emptyStep()]);
  const [error, setError] = useState<string | null>(null);

  const parsedSteps: BrewStep[] = sortSteps(
    steps
      .filter((s) => s.label.trim() !== '')
      .map((s) => {
        const atSec = toSec(s.min, s.sec) ?? null;
        const water = s.waterG.trim() === '' ? null : Number(s.waterG);
        const step: BrewStep = { atSec, waterG: Number.isFinite(water) ? water : null, label: s.label.trim() };
        if (s.hint.trim()) step.hint = s.hint.trim();
        const pour: PourTechnique = {};
        if (s.pattern) pour.pattern = s.pattern;
        if (s.flow) pour.flow = s.flow;
        if (s.pace) pour.pace = s.pace;
        if (s.agitation) pour.agitation = s.agitation;
        if (Object.keys(pour).length) step.pour = pour;
        return step;
      }),
  );

  const waterG = parsedSteps.reduce((acc, s) => acc + (s.waterG ?? 0), 0);
  const lastAt = parsedSteps.reduce((acc, s) => (s.atSec !== null && s.atSec > acc ? s.atSec : acc), 0);
  const totalSecInput = toSec(total.min, total.sec);
  // 종료 시각을 비우면 마지막 단계 시각으로 — 그러면 타이머가 마지막 단계가 시작되는 순간 끝나므로 폼에서 알려준다
  const totalSec = totalSecInput ?? lastAt;

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
    if (totalSecInput !== undefined && totalSecInput < lastAt)
      return setError(`종료 시각(${formatSec(totalSecInput)})이 마지막 단계(${formatSec(lastAt)})보다 빠릅니다.`);
    if (youtubeUrl.trim()) {
      try {
        const u = new URL(youtubeUrl.trim());
        if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('bad protocol');
      } catch {
        return setError('유튜브 주소가 올바른 URL 이 아닙니다.');
      }
    }

    const grinderSettings = parseGrinderText(grinderText);
    const dilution = Number(dilutionG);

    // 폼에 칸이 없는 필드(family, pourSource, waterNote, 얼음·우유)는 수정해도 잃지 않도록 원본 위에 덮어쓴다
    const recipe: Recipe = {
      ...initial,
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
      totalSec: Math.max(totalSec, 1),
      steps: parsedSteps,
      custom: true,
    };
    // 폼에서 비운 선택 필드는 지운다
    delete recipe.dripperType;
    delete recipe.author;
    delete recipe.tag;
    delete recipe.youtubeUrl;
    delete recipe.grinderSettings;
    delete recipe.note;
    if (category === 'drip') recipe.dripperType = dripperType;
    if (author.trim()) recipe.author = author.trim();
    if (tag.trim()) recipe.tag = tag.trim();
    if (youtubeUrl.trim()) recipe.youtubeUrl = youtubeUrl.trim();
    if (grinderSettings.length) recipe.grinderSettings = grinderSettings;
    if (note.trim()) recipe.note = note.trim();

    const finishing = { ...initial?.finishing };
    delete finishing.note;
    delete finishing.waterG;
    if (finishNote.trim()) finishing.note = finishNote.trim();
    if (Number.isFinite(dilution) && dilution > 0) finishing.waterG = dilution;
    if (Object.keys(finishing).length) recipe.finishing = finishing;
    else delete recipe.finishing;

    onSave(recipe);
  };

  const field =
    'w-full rounded-lg border border-line-strong bg-well px-3 py-2 text-sm text-ink placeholder:text-ink-faint/70 focus:border-crema focus:outline-none';
  const small =
    'rounded-md border border-line-strong bg-well px-2 py-1.5 text-sm text-ink focus:border-crema focus:outline-none';
  const labelCls = 'block text-xs font-semibold text-ink-soft';

  return (
    <Modal open onClose={onClose} label={initial ? '레시피 수정' : '레시피 추가'}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-card px-5 py-4">
        <h2 className="hand text-[22px] leading-none text-ink">{initial ? '레시피 수정' : '레시피 추가'}</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full bg-well p-2 text-ink-soft hover:bg-line">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
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
          <p className="mt-1 text-xs text-ink-faint">여러 그라인더는 / 로 구분합니다. Femobook A2 값을 적으면 환산 없이 그대로 보입니다.</p>
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
            {steps.map((s, i) => {
              const pour: PourTechnique = {};
              if (s.pattern) pour.pattern = s.pattern;
              if (s.flow) pour.flow = s.flow;
              if (s.pace) pour.pace = s.pace;
              if (s.agitation) pour.agitation = s.agitation;
              const hasPour = describePour(pour) !== '';
              return (
                <div key={i} className="rounded-xl border border-line bg-well p-3">
                  <div className="flex items-center gap-2">
                    <input aria-label={`${i + 1}단계 분`} className={`${small} num w-12 text-center`} inputMode="numeric" value={s.min} onChange={(e) => setStep(i, { min: e.target.value })} placeholder="분" />
                    <span className="text-ink-faint">:</span>
                    <input aria-label={`${i + 1}단계 초`} className={`${small} num w-12 text-center`} inputMode="numeric" value={s.sec} onChange={(e) => setStep(i, { sec: e.target.value })} placeholder="초" />
                    <input aria-label={`${i + 1}단계 물 양`} className={`${small} num w-16 text-center`} inputMode="numeric" value={s.waterG} onChange={(e) => setStep(i, { waterG: e.target.value })} placeholder="g" />
                    <input aria-label={`${i + 1}단계 동작`} className={`${small} min-w-0 flex-1`} value={s.label} onChange={(e) => setStep(i, { label: e.target.value })} placeholder="동작 (예: 뜸 들이기)" />
                    <button type="button" onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))} aria-label={`${i + 1}단계 삭제`} disabled={steps.length === 1} className="shrink-0 rounded-md p-1.5 text-ink-faint hover:text-danger disabled:opacity-30">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <input aria-label={`${i + 1}단계 힌트`} className={`${field} mt-2`} value={s.hint} onChange={(e) => setStep(i, { hint: e.target.value })} placeholder="힌트 (예: 30초 대기)" />

                  {/* 붓는 방법 — 고르면 애니메이션이 바로 미리 보인다 */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
                      <select aria-label={`${i + 1}단계 궤적`} className={small} value={s.pattern} onChange={(e) => setStep(i, { pattern: e.target.value as DraftStep['pattern'] })}>
                        <option value="">궤적 —</option>
                        {(Object.keys(PATTERN_LABEL) as (keyof typeof PATTERN_LABEL)[]).map((k) => (
                          <option key={k} value={k}>{PATTERN_LABEL[k]}</option>
                        ))}
                      </select>
                      <select aria-label={`${i + 1}단계 물줄기`} className={small} value={s.flow} onChange={(e) => setStep(i, { flow: e.target.value as DraftStep['flow'] })}>
                        <option value="">물줄기 —</option>
                        {(Object.keys(FLOW_LABEL) as (keyof typeof FLOW_LABEL)[]).map((k) => (
                          <option key={k} value={k}>{FLOW_LABEL[k]}</option>
                        ))}
                      </select>
                      <select aria-label={`${i + 1}단계 속도`} className={small} value={s.pace} onChange={(e) => setStep(i, { pace: e.target.value as DraftStep['pace'] })}>
                        <option value="">속도 —</option>
                        <option value="slow">천천히</option>
                        <option value="fast">빠르게</option>
                      </select>
                      <select aria-label={`${i + 1}단계 교반`} className={small} value={s.agitation} onChange={(e) => setStep(i, { agitation: e.target.value as DraftStep['agitation'] })}>
                        <option value="">교반 —</option>
                        <option value="stir">교반 (젓기)</option>
                        <option value="swirl">스월링</option>
                      </select>
                    </div>
                    {hasPour ? (
                      <PourGlyph pour={pour} size={56} />
                    ) : (
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-[11px] leading-tight text-ink-faint" aria-hidden="true">
                        붓는
                        <br />
                        방법
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setSteps((p) => [...p, emptyStep()])} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-2.5 text-sm font-semibold text-ink-soft hover:border-crema hover:text-crema">
            <Icon name="plus" size={16} />
            단계 추가
          </button>
          <p className="mt-2 text-xs text-ink-faint">
            시간을 비우면 시계로 자동 진행하지 않는 단계가 됩니다. 물 양을 비우면 &quot;눈대중&quot;으로 표시됩니다. 순서는 시각대로
            정리됩니다.
          </p>
        </section>

        {/* 종료 시각 — 이게 없으면 타이머가 마지막 단계가 시작되는 순간 끝난다 */}
        <div>
          <label className={labelCls} htmlFor="rf-total-min">종료 시각 (총 추출 시간)</label>
          <div className="mt-1 flex items-center gap-2">
            <input id="rf-total-min" aria-label="종료 분" className={`${small} num w-14 text-center`} inputMode="numeric" value={total.min} onChange={(e) => setTotal((t) => ({ ...t, min: e.target.value }))} placeholder="분" />
            <span className="text-ink-faint">:</span>
            <input aria-label="종료 초" className={`${small} num w-14 text-center`} inputMode="numeric" value={total.sec} onChange={(e) => setTotal((t) => ({ ...t, sec: e.target.value }))} placeholder="초" />
            <span className="num text-xs text-ink-faint">
              {totalSecInput === undefined
                ? parsedSteps.length
                  ? `비우면 마지막 단계 시각 ${formatSec(lastAt)}에 타이머가 끝납니다`
                  : ''
                : `타이머가 ${formatSec(totalSecInput)}에 끝납니다`}
            </span>
          </div>
        </div>

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
