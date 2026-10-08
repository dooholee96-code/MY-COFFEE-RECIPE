import { useState } from 'react';
import type { Filters } from '../types';
import { Icon } from './Icon';
import { DRIPPER_OPTIONS, ROAST_OPTIONS, dripperLabel } from '../lib/labels';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  favoriteCount: number;
}

function Segmented<T extends string>({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onSelect: (id: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[11px] font-bold tracking-wider text-ink-faint uppercase">{legend}</legend>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={value === opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex-1 rounded-lg border py-2 text-xs font-bold transition md:text-sm ${
              value === opt.id
                ? 'border-transparent bg-crema text-on-crema'
                : 'border-line bg-well text-ink-soft hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const chipCls = (on: boolean) =>
  `flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
    on ? 'border-crema/40 bg-crema-soft text-crema-deep' : 'border-line bg-card text-ink-soft hover:bg-well hover:text-ink'
  }`;

/**
 * 검색 한 줄 + 칩 한 줄. 자주 쓰는 조건(즐겨찾기, HOT/ICE)은 칩으로 바로 켜고 끄고,
 * 드리퍼·배전도는 "필터" 로 펼친다. 펼치지 않은 상태에서도 걸린 조건은 칩으로 보여 한 번에 푼다.
 */
export function FilterBar({ filters, onChange, favoriteCount }: Props) {
  const [open, setOpen] = useState(false);
  const panelCount = (filters.dripper !== 'all' ? 1 : 0) + (filters.roast !== 'all' ? 1 : 0);

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="레시피 검색"
            aria-label="레시피 검색"
            className="w-full rounded-xl border border-line bg-card py-2.5 pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint/70 focus:border-crema focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition ${
            open || panelCount ? 'border-crema bg-card text-crema' : 'border-line bg-card text-ink-soft hover:bg-well'
          }`}
        >
          <Icon name="filter" size={15} />
          필터
          {panelCount > 0 && <span className="num">{panelCount}</span>}
        </button>
      </div>

      <div className="scrollbar-hide -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5">
        <button
          type="button"
          aria-pressed={filters.favoritesOnly}
          aria-label={`즐겨찾기만 보기 (${favoriteCount}개)`}
          onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}
          className={chipCls(filters.favoritesOnly)}
        >
          {/* 당근 = 즐겨찾기. 연표에서 켜진 칸에 당근이 놓이는 것과 같은 말 */}
          <Icon name="carrot" size={14} filled className={filters.favoritesOnly ? 'text-carrot' : 'text-ink-faint'} />
          즐겨찾기
          <span className="num">{favoriteCount}</span>
        </button>
        <button type="button" aria-pressed={filters.serve === 'hot'} onClick={() => onChange({ serve: filters.serve === 'hot' ? 'all' : 'hot' })} className={chipCls(filters.serve === 'hot')}>
          HOT
        </button>
        <button type="button" aria-pressed={filters.serve === 'ice'} onClick={() => onChange({ serve: filters.serve === 'ice' ? 'all' : 'ice' })} className={chipCls(filters.serve === 'ice')}>
          ICE
        </button>
        {/* 펼침 패널에서 건 조건 — 접힌 상태에서도 보이고, 탭 한 번으로 풀린다 */}
        {filters.dripper !== 'all' && (
          <button type="button" onClick={() => onChange({ dripper: 'all' })} className={chipCls(true)}>
            {dripperLabel(filters.dripper)}
            <Icon name="close" size={12} />
          </button>
        )}
        {filters.roast !== 'all' && (
          <button type="button" onClick={() => onChange({ roast: 'all' })} className={chipCls(true)}>
            {ROAST_OPTIONS.find((o) => o.id === filters.roast)?.label ?? filters.roast}
            <Icon name="close" size={12} />
          </button>
        )}
      </div>

      {open && (
        <div id="filter-panel" className="space-y-3 rounded-xl border border-line bg-card p-3">
          <Segmented legend="Dripper" options={DRIPPER_OPTIONS} value={filters.dripper} onSelect={(dripper) => onChange({ dripper })} />
          <Segmented legend="Roast" options={ROAST_OPTIONS} value={filters.roast} onSelect={(roast) => onChange({ roast })} />
        </div>
      )}
    </div>
  );
}
