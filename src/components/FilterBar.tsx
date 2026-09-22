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
      <legend className="mb-1.5 text-[11px] font-bold tracking-wider text-stone-500 uppercase">{legend}</legend>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={value === opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex-1 rounded-lg border py-2 text-xs font-bold transition md:text-sm ${
              value === opt.id
                ? 'border-transparent bg-amber-600 text-white'
                : 'border-stone-700 bg-stone-900/50 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * 검색줄은 항상 보이고, 세부 필터는 접어 둔다.
 *
 * v1 은 드리퍼·배전도·온도 세 블록이 항상 펼쳐져 있어서 폰에서 첫 레시피 카드를
 * 보려면 한 화면을 통째로 스크롤해야 했다. 레시피를 고르는 것이 이 앱의 본래 목적이므로
 * 필터는 필요할 때만 펼치고, 접힌 상태에서는 지금 걸린 조건만 칩으로 보여준다.
 */
export function FilterBar({ filters, onChange, favoriteCount }: Props) {
  const [open, setOpen] = useState(false);

  const active: { label: string; clear: Partial<Filters> }[] = [];
  if (filters.dripper !== 'all' && filters.category === 'drip')
    active.push({ label: dripperLabel(filters.dripper), clear: { dripper: 'all' } });
  if (filters.roast !== 'all')
    active.push({
      label: ROAST_OPTIONS.find((o) => o.id === filters.roast)?.label ?? filters.roast,
      clear: { roast: 'all' },
    });
  if (filters.serve !== 'all')
    active.push({ label: filters.serve === 'hot' ? 'HOT' : 'ICE', clear: { serve: 'all' } });

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-500"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="레시피, 작성자, 그라인더 세팅"
            aria-label="레시피 검색"
            className="w-full rounded-xl border border-stone-700 bg-stone-800 py-2.5 pr-3 pl-9 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          aria-pressed={filters.favoritesOnly}
          aria-label={`즐겨찾기만 보기 (${favoriteCount}개)`}
          onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition ${
            filters.favoritesOnly
              ? 'border-transparent bg-amber-600 text-white'
              : 'border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          <Icon name="star" size={16} filled={filters.favoritesOnly} />
          <span className="tabular-nums">{favoriteCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition ${
            open || active.length
              ? 'border-amber-700 bg-stone-800 text-amber-400'
              : 'border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          <Icon name="filter" size={15} />
          필터
          {active.length > 0 && <span className="tabular-nums">{active.length}</span>}
        </button>
      </div>

      {/* 접힌 상태에서 지금 걸린 조건 — 탭 한 번으로 해제 */}
      {!open && active.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {active.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onChange(chip.clear)}
              className="flex items-center gap-1 rounded-full border border-amber-800/60 bg-amber-950/40 py-1 pr-2 pl-2.5 text-xs font-bold text-amber-300 hover:bg-amber-900/40"
            >
              {chip.label}
              <Icon name="close" size={12} />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div id="filter-panel" className="space-y-3 rounded-xl border border-stone-700 bg-stone-800 p-3">
          {filters.category === 'drip' && (
            <Segmented
              legend="Dripper"
              options={DRIPPER_OPTIONS}
              value={filters.dripper}
              onSelect={(dripper) => onChange({ dripper })}
            />
          )}
          <Segmented legend="Roast" options={ROAST_OPTIONS} value={filters.roast} onSelect={(roast) => onChange({ roast })} />
          <Segmented
            legend="Temperature"
            options={[
              { id: 'all' as const, label: '전체' },
              { id: 'hot' as const, label: 'HOT' },
              { id: 'ice' as const, label: 'ICE' },
            ]}
            value={filters.serve}
            onSelect={(serve) => onChange({ serve })}
          />
        </div>
      )}
    </div>
  );
}
