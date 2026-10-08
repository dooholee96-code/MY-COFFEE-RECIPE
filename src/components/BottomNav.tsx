import { Icon } from './Icon';

export type View = 'recipes' | 'logs' | 'beans';

interface Props {
  view: View;
  onChange: (view: View) => void;
  /** 탭 옆에 붙는 개수 (기록 수, 쓰는 중인 원두 수) */
  counts: Partial<Record<View, number>>;
}

const TABS: { id: View; label: string; icon: 'coffee' | 'journal' | 'bean' }[] = [
  { id: 'recipes', label: '레시피', icon: 'coffee' },
  { id: 'logs', label: '기록', icon: 'journal' },
  { id: 'beans', label: '원두', icon: 'bean' },
];

/**
 * 최상위 화면 전환 — 화면 아래, 엄지가 닿는 자리.
 * 위에 있던 탭 줄을 내려서 홈의 첫 화면에 검색과 목록이 먼저 보이게 한다.
 */
export function BottomNav({ view, onChange, counts }: Props) {
  return (
    <nav
      aria-label="화면"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-4xl">
        {TABS.map((t) => {
          const active = view === t.id;
          const count = counts[t.id];
          return (
            <button
              key={t.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-xs font-bold transition ${
                active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
              }`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? 'bg-ink text-canvas' : ''}`}>
                <Icon name={t.icon} size={19} />
              </span>
              <span>
                {t.label}
                {count !== undefined && count > 0 && <span className="ml-1 num opacity-70">{count}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
