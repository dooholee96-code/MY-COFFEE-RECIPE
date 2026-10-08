import type { Recipe } from '../types';
import { formatSec } from '../lib/brew';
import { Icon } from './Icon';
import { roastLabel } from '../lib/labels';
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

/**
 * 홈 목록의 한 줄. 고르는 데 필요한 것만: 제목, HOT/ICE·배전도, 네 수치, 내 그라인더 분쇄도.
 * 기구·비율·메모는 상세 시트에 있다. 한 줄이 80px 남짓이라 17개가 두 화면에 들어간다 —
 * 전에는 카드 하나가 330px 라 여섯 화면을 넘겨야 했다.
 */
export function RecipeRow({ recipe, favorite, onOpen, onToggleFavorite, myGrinder, calibration }: Props) {
  const hot = recipe.serve === 'hot';
  return (
    // 제목만 버튼으로 두고 줄 전체를 그 버튼의 히트 영역으로 넓힌다 — 안쪽의 즐겨찾기 버튼과 겹치지 않게
    <article className="group relative flex items-start gap-3 px-4 py-3 transition-colors focus-within:bg-well hover:bg-well">
      <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${hot ? 'bg-hot' : 'bg-ice'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h3 className="text-base leading-snug font-bold text-ink">
          <button type="button" onClick={onOpen} className="text-left outline-none group-hover:text-crema focus-visible:text-crema">
            <span className="absolute inset-0" />
            {recipe.title}
          </button>
        </h3>
        <p className="mt-0.5 text-xs text-ink-soft">
          <span className={`font-bold ${hot ? 'text-hot' : 'text-ice'}`}>{hot ? 'HOT' : 'ICE'}</span>
          {' · '}
          {roastLabel(recipe.roast)}
          {recipe.custom && <span className="font-bold text-sage"> · 내 레시피</span>}
          {recipe.tag && ` · ${recipe.tag}`}
        </p>
        <p className="mt-1 num text-sm text-ink">
          {recipe.beanG}g · {recipe.waterG}g · {recipe.tempC}℃ · {formatSec(recipe.totalSec)}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-ink-soft">
          <GrindSetting
            settings={recipe.grinderSettings ?? []}
            myGrinder={myGrinder}
            calibration={calibration}
            fallback={recipe.grind}
            compact
          />
        </p>
      </div>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={favorite}
        aria-label={`${recipe.title} 즐겨찾기 ${favorite ? '해제' : '추가'}`}
        className={`relative z-10 -mr-2 -mt-1 rounded-lg p-2 transition-colors ${favorite ? 'animate-hop text-carrot' : 'text-ink-faint hover:text-ink-soft'}`}
      >
        {/* 당근 = 즐겨찾기. 연표에서 켜진 칸에 당근이 놓이는 것과 같은 말 */}
        <Icon name="carrot" size={20} filled={favorite} />
      </button>
    </article>
  );
}
