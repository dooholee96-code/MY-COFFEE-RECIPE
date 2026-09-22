import { useRef, useState } from 'react';
import type { Recipe } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
  grinders: string[];
  myGrinder: string | null;
  onMyGrinderChange: (g: string | null) => void;
  soundOn: boolean;
  onSoundChange: (on: boolean) => void;
  customRecipes: Recipe[];
  onImport: (recipes: Recipe[]) => void;
}

/** 내 레시피를 JSON 파일로 주고받는다 — 브라우저 저장소만으로는 기기를 옮기면 사라지므로. */
export function SettingsSheet({
  onClose,
  grinders,
  myGrinder,
  onMyGrinderChange,
  soundOn,
  onSoundChange,
  customRecipes,
  onImport,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(customRecipes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-coffee-recipes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('배열이 아닙니다');
      const valid = parsed.filter(
        (r): r is Recipe =>
          typeof r === 'object' &&
          r !== null &&
          typeof (r as Recipe).id === 'string' &&
          typeof (r as Recipe).title === 'string' &&
          Array.isArray((r as Recipe).steps),
      );
      if (!valid.length) throw new Error('레시피를 찾지 못했습니다');
      onImport(valid.map((r) => ({ ...r, custom: true })));
      setMessage(`${valid.length}개 레시피를 불러왔습니다.`);
    } catch (e) {
      setMessage(`불러오기 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <Modal open onClose={onClose} label="설정">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-700 bg-stone-800 px-5 py-4">
        <h2 className="text-lg font-bold text-stone-100">설정</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full bg-stone-700 p-2 text-stone-300 hover:bg-stone-600">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <section>
          <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">내 그라인더</h3>
          <p className="mt-1 text-xs text-stone-500">고르면 목록에서 그 그라인더의 클릭 수만 보여줍니다.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onMyGrinderChange(null)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                myGrinder === null ? 'border-transparent bg-amber-600 text-white' : 'border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              전체 표시
            </button>
            {grinders.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onMyGrinderChange(g)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  myGrinder === g ? 'border-transparent bg-amber-600 text-white' : 'border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">타이머 소리</h3>
          <button
            type="button"
            role="switch"
            aria-checked={soundOn}
            onClick={() => onSoundChange(!soundOn)}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-stone-700 bg-stone-900/50 px-4 py-3 text-sm font-semibold text-stone-200 hover:bg-stone-700/50"
          >
            <span className="flex items-center gap-2">
              <Icon name={soundOn ? 'sound' : 'mute'} size={16} className="text-amber-500" />
              단계가 바뀔 때 알림음
            </span>
            <span className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${soundOn ? 'bg-amber-600' : 'bg-stone-600'}`}>
              <span className={`block h-5 w-5 rounded-full bg-white transition ${soundOn ? 'translate-x-5' : ''}`} />
            </span>
          </button>
          <p className="mt-1 text-xs text-stone-500">진동은 기기가 지원하면 항상 함께 울립니다.</p>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">내 레시피 백업</h3>
          <p className="mt-1 text-xs text-stone-500">
            직접 추가한 {customRecipes.length}개 레시피는 이 브라우저에만 저장됩니다. 기기를 옮기거나 저장소에 심을 때는 내보내세요.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={exportJSON}
              disabled={customRecipes.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-700 py-2.5 text-sm font-bold text-stone-200 hover:bg-stone-600 disabled:opacity-40"
            >
              <Icon name="download" size={16} />
              내보내기
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-700 py-2.5 text-sm font-bold text-stone-200 hover:bg-stone-600"
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
          {message && <p className="mt-2 text-xs font-semibold text-amber-400">{message}</p>}
        </section>
      </div>
    </Modal>
  );
}
