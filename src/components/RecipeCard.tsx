import type { Recipe } from '../types';
import { formatRatio, formatSec } from '../lib/brew';
import { Icon } from './Icon';
import { roastBadgeClass, roastLabel } from '../lib/labels';
import { GrindSetting } from './GrindSetting';
import type { Calibration, GrinderProfile } from '../lib/grinders';

interface Props {
  recipe: Recipe;
  favorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  /** 내가 쓰는 그라인더. 레시피 값을 이 그라인더 기준으로 환산해 보여준다. */
  myGrinder: GrinderProfile | undefined;
  calibration: Calibration;
}

export function RecipeCard({ recipe, favorite, onOpen, onToggleFavorite, myGrinder, calibration }: Props) {

  return (
    // 카드 전체가 버튼이면 안쪽의 즐겨찾기 버튼을 넣을 수 없으므로,
    // 제목만 버튼으로 두고 카드를 그 버튼의 히트 영역으로 확장한다.
    <article className="group relative flex flex-col rounded-2xl border border-line bg-card p-5 shadow-card transition-colors focus-within:border-crema hover:border-line-strong">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${roastBadgeClass(recipe.roast)}`}>
            {roastLabel(recipe.roast)}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              recipe.serve === 'hot'
                ? 'border-hot/25 bg-hot-soft text-danger'
                : 'border-ice/25 bg-ice-soft text-ice'
            }`}
          >
            {recipe.serve === 'hot' ? 'HOT' : 'ICE'}
          </span>
          {recipe.custom && (
            <span className="rounded-full border border-sage/25 bg-sage-soft px-2 py-0.5 text-[10px] font-bold text-sage">
              내 레시피
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={`${recipe.title} 즐겨찾기 ${favorite ? '해제' : '추가'}`}
          className={`relative z-10 -m-1.5 rounded-lg p-1.5 transition-colors ${
            favorite ? 'text-crema' : 'text-ink-faint hover:text-ink-soft'
          }`}
        >
          <Icon name="star" size={18} filled={favorite} />
        </button>
      </div>

      <h3 className="text-lg leading-snug font-bold text-ink">
        <button
          type="button"
          onClick={onOpen}
          className="text-left outline-none group-hover:text-crema focus-visible:text-crema"
        >
          {/* 카드 전체를 클릭 가능하게 만드는 확장 히트 영역 */}
          <span className="absolute inset-0 rounded-2xl" />
          {recipe.title}
        </button>
      </h3>

      <p className="mt-0.5 text-xs text-ink-faint">
        {[recipe.author && !recipe.title.includes(recipe.author) ? recipe.author : null, recipe.tag]
          .filter(Boolean)
          .join(' · ') || ' '}
      </p>

      {/* 핵심 수치 — 저울에 올리기 전에 알아야 하는 것들 */}
      <dl className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-line bg-well text-center">
        {[
          { icon: 'scale', label: '원두', value: `${recipe.beanG}g` },
          { icon: 'droplet', label: '물', value: `${recipe.waterG}g` },
          { icon: 'thermometer', label: '온도', value: `${recipe.tempC}℃` },
          { icon: 'clock', label: '시간', value: formatSec(recipe.totalSec) },
        ].map((cell) => (
          <div key={cell.label} className="bg-well px-1 py-2.5">
            <dt className="flex items-center justify-center gap-1 text-[10px] text-ink-faint">
              <Icon name={cell.icon as 'scale'} size={11} />
              {cell.label}
            </dt>
            <dd className="mt-0.5 num text-sm font-bold text-ink">{cell.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 space-y-1.5 text-xs text-ink-soft">
        <p className="flex items-center gap-2">
          <Icon name="grinder" size={13} className="shrink-0 text-crema" />
          <span className="truncate">
            <GrindSetting
              settings={recipe.grinderSettings ?? []}
              myGrinder={myGrinder}
              calibration={calibration}
              fallback={recipe.grind}
              compact
            />
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Icon name="filter" size={13} className="shrink-0 text-crema" />
          <span className="truncate">{recipe.gear}</span>
        </p>
        <p className="flex items-center gap-2">
          <Icon name="info" size={13} className="shrink-0 text-crema" />
          <span>
            비율 {formatRatio(recipe)}
            {recipe.finishing?.waterG ? ` · 가수 ${recipe.finishing.waterG}g` : ''}
            {recipe.finishing?.milkG ? ` · 우유 ${recipe.finishing.milkG}g` : ''}
            {recipe.finishing?.iceG ? ` · 얼음 ${recipe.finishing.iceG}g` : ''}
          </span>
        </p>
      </div>

      {recipe.note && (
        <p className="mt-3 line-clamp-2 rounded-lg border border-crema/25 bg-crema-soft px-3 py-2 text-xs text-ink">
          {recipe.note}
        </p>
      )}
    </article>
  );
}
