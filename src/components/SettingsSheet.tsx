import { useRef, useState } from 'react';
import type { Bean, BrewLog, Recipe } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { type Calibration, GRINDERS, findGrinder } from '../lib/grinders';
import { THEME_OPTIONS, type ThemePref } from '../lib/theme';

interface Props {
  onClose: () => void;
  myGrinder: string | null;
  onMyGrinderChange: (g: string | null) => void;
  calibration: Calibration;
  onCalibrationChange: (c: Calibration) => void;
  soundOn: boolean;
  onSoundChange: (on: boolean) => void;
  theme: ThemePref;
  onThemeChange: (t: ThemePref) => void;
  customRecipes: Recipe[];
  brewLogs: BrewLog[];
  beans: Bean[];
  onImport: (data: { recipes?: Recipe[]; logs?: BrewLog[]; beans?: Bean[] }) => void;
}

interface Backup {
  version: 2;
  exportedAt: string;
  recipes: Recipe[];
  logs: BrewLog[];
  beans: Bean[];
}

export function SettingsSheet({
  onClose,
  myGrinder,
  onMyGrinderChange,
  calibration,
  onCalibrationChange,
  soundOn,
  onSoundChange,
  theme,
  onThemeChange,
  customRecipes,
  brewLogs,
  beans,
  onImport,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const profile = findGrinder(myGrinder);
  const anchor = profile ? (calibration[profile.id] ?? profile.v60Anchor) : null;

  const exportJSON = () => {
    const backup: Backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      recipes: customRecipes,
      logs: brewLogs,
      beans,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-coffee-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      // v1 백업은 레시피 배열만 들어 있었다 — 둘 다 받는다
      const payload = Array.isArray(parsed)
        ? { recipes: parsed as Recipe[] }
        : (parsed as Partial<Backup>);

      const recipes = (payload.recipes ?? []).filter(
        (r): r is Recipe => typeof r?.id === 'string' && typeof r?.title === 'string' && Array.isArray(r?.steps),
      );
      const logs = (payload.logs ?? []).filter(
        (l): l is BrewLog => typeof l?.id === 'string' && typeof l?.recipeId === 'string',
      );
      const importedBeans = (payload.beans ?? []).filter(
        (b): b is Bean => typeof b?.id === 'string' && typeof b?.name === 'string',
      );

      if (!recipes.length && !logs.length && !importedBeans.length) throw new Error('읽을 수 있는 데이터가 없습니다');
      onImport({ recipes, logs, beans: importedBeans });
      setMessage(`레시피 ${recipes.length} · 기록 ${logs.length} · 원두 ${importedBeans.length} 불러왔습니다.`);
    } catch (e) {
      setMessage(`불러오기 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <Modal open onClose={onClose} label="설정">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-card px-5 py-4">
        <h2 className="text-lg font-bold text-ink">설정</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full bg-well p-2 text-ink-soft hover:bg-line">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        <section>
          <h3 className="text-xs font-bold tracking-wider text-ink-soft uppercase">내 그라인더</h3>
          <p className="mt-1 text-xs text-ink-faint">
            고르면 레시피의 분쇄도를 내 그라인더 클릭 수로 환산해 보여줍니다.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onMyGrinderChange(null)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                myGrinder === null
                  ? 'border-transparent bg-crema text-on-crema'
                  : 'border-line bg-card text-ink-soft hover:bg-well'
              }`}
            >
              원본 그대로
            </button>
            {GRINDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onMyGrinderChange(g.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  myGrinder === g.id
                    ? 'border-transparent bg-crema text-on-crema'
                    : 'border-line bg-card text-ink-soft hover:bg-well'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          {profile && <p className="mt-2 text-[11px] text-ink-faint">{profile.note ?? `클릭당 약 ${profile.micronsPerClick}µm`}</p>}
        </section>

        {/* 보정 — 환산을 믿으라고 하는 대신 직접 맞추게 한다 */}
        {profile && profile.id !== 'comandante' && anchor !== null && (
          <section className="rounded-xl border border-line bg-well p-4">
            <h3 className="text-xs font-bold tracking-wider text-ink-soft uppercase">환산 기준 보정</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              그라인더마다 0점이 달라 환산은 추정입니다. {profile.name} 로 V60 을 내렸을 때 가장 잘 나온
              클릭 수를 넣으면 모든 레시피의 환산값이 그만큼 함께 움직입니다.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              원두마다 다르게 쓴다면 원두 탭에서 원두별 기준을 넣으세요. 원두를 고르면 그 값이 이 기본값보다
              우선합니다.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onCalibrationChange({ ...calibration, [profile.id]: Math.max(1, anchor - 1) })}
                aria-label="기준 1클릭 줄이기"
                className="h-10 w-10 shrink-0 rounded-lg border border-line-strong bg-well text-lg font-bold text-ink hover:bg-line"
              >
                −
              </button>
              <label className="flex flex-1 items-baseline justify-center gap-1">
                <span className="sr-only">{profile.name} V60 기준 클릭 수</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={profile.maxClicks ?? 200}
                  value={anchor}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n > 0) onCalibrationChange({ ...calibration, [profile.id]: n });
                  }}
                  className="w-20 border-b border-line-strong bg-transparent text-center num text-2xl font-bold text-ink outline-none focus:border-crema"
                />
                <span className="num text-sm font-bold text-ink-faint">클릭</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  onCalibrationChange({ ...calibration, [profile.id]: Math.min(profile.maxClicks ?? 200, anchor + 1) })
                }
                aria-label="기준 1클릭 늘리기"
                className="h-10 w-10 shrink-0 rounded-lg border border-line-strong bg-well text-lg font-bold text-ink hover:bg-line"
              >
                +
              </button>
            </div>
            {anchor !== profile.v60Anchor && (
              <button
                type="button"
                onClick={() => {
                  const next = { ...calibration };
                  delete next[profile.id];
                  onCalibrationChange(next);
                }}
                className="mt-2 w-full text-xs font-semibold text-crema hover:underline"
              >
                기본값 {profile.v60Anchor}클릭 으로 되돌리기
              </button>
            )}
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold tracking-wider text-ink-soft uppercase">화면</h3>
          <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="화면 테마">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={theme === opt.id}
                onClick={() => onThemeChange(opt.id)}
                className={`rounded-xl border px-2 py-2.5 text-center transition ${
                  theme === opt.id
                    ? 'border-transparent bg-ink text-canvas'
                    : 'border-line bg-well text-ink-soft hover:border-line-strong'
                }`}
              >
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className={`block text-[10px] ${theme === opt.id ? 'text-canvas/70' : 'text-ink-faint'}`}>{opt.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-wider text-ink-soft uppercase">타이머 소리</h3>
          <button
            type="button"
            role="switch"
            aria-checked={soundOn}
            onClick={() => onSoundChange(!soundOn)}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-line bg-well px-4 py-3 text-sm font-semibold text-ink hover:bg-well"
          >
            <span className="flex items-center gap-2">
              <Icon name={soundOn ? 'sound' : 'mute'} size={16} className="text-crema" />
              단계가 바뀔 때 알림음
            </span>
            <span className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${soundOn ? 'bg-crema' : 'bg-line-strong'}`}>
              <span className={`block h-5 w-5 rounded-full bg-card shadow-sm transition ${soundOn ? 'translate-x-5' : ''}`} />
            </span>
          </button>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-wider text-ink-soft uppercase">백업</h3>
          <p className="mt-1 text-xs text-ink-faint">
            내 레시피 {customRecipes.length} · 기록 {brewLogs.length} · 원두 {beans.length} 개가 이 브라우저에만
            저장돼 있습니다. 기기를 옮기기 전에 내보내세요.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={exportJSON}
              disabled={!customRecipes.length && !brewLogs.length && !beans.length}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-well py-2.5 text-sm font-bold text-ink hover:bg-line disabled:opacity-40"
            >
              <Icon name="download" size={16} />
              내보내기
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-well py-2.5 text-sm font-bold text-ink hover:bg-line"
            >
              <Icon name="upload" size={16} />
              불러오기
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJSON(file);
              e.target.value = '';
            }}
          />
          {message && <p className="mt-2 text-xs font-semibold text-crema">{message}</p>}
        </section>
      </div>
    </Modal>
  );
}
