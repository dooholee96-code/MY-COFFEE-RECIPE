import type { BrewLog, Recipe, TasteVerdict } from '../types';
import { type GrinderProfile, oneStepLabel } from './grinders';

export interface Adjustment {
  /** 다음에 바꿀 것 한 가지 */
  headline: string;
  /** 왜 */
  reason: string;
  /** 그래도 안 되면 시도해 볼 것들 */
  alternatives: string[];
}

export const TASTE_OPTIONS: { id: TasteVerdict; label: string; hint: string }[] = [
  { id: 'sour', label: '시다', hint: '떫고 날카로움 · 과소추출' },
  { id: 'bitter', label: '쓰다', hint: '텁텁하고 끝맛이 남음 · 과다추출' },
  { id: 'weak', label: '연하다', hint: '맛이 옅고 물 같음' },
  { id: 'strong', label: '진하다', hint: '너무 무겁고 강함' },
  { id: 'balanced', label: '좋다', hint: '단맛과 산미가 맞음' },
];

/**
 * 맛 판정 하나를 받아 다음에 바꿀 것 한 가지를 낸다.
 *
 * 조사한 앱들(Coffee Journal, Filtru 등)과 추출 이론이 공통으로 말하는 원칙이 둘 있다.
 *  1. 한 번에 하나만 바꾼다. 세 개를 동시에 바꾸면 무엇이 효과가 있었는지 알 수 없다.
 *  2. 분쇄도를 먼저 건드린다. 추출 수율에 가장 크게 작용하기 때문.
 * 그래서 이 함수는 후보를 늘어놓지 않고 "1순위" 하나를 고르고 나머지는 대안으로 미뤄 둔다.
 *
 * 실제 추출 시간이 목표와 크게 어긋났다면 그것이 맛보다 먼저다 — 물이 너무 빨리
 * 빠졌거나 막혔다는 뜻이고, 그 상태에서 맛만 보고 조정하면 엉뚱한 곳을 고치게 된다.
 */
export function suggestAdjustment(
  taste: TasteVerdict,
  context?: { targetSec?: number; actualSec?: number },
  grinder?: GrinderProfile,
): Adjustment {
  const target = context?.targetSec;
  const actual = context?.actualSec;
  // 조언의 "한 칸"을 내 그라인더 단위로 — Femobook A2 면 코만단테 한 클릭 ≈ 2클릭
  const step = oneStepLabel(grinder);

  // 목표 대비 25% 이상 어긋나면 흐름부터 잡는다
  if (target && actual && target > 0) {
    const drift = (actual - target) / target;
    if (drift > 0.25) {
      return {
        headline: '분쇄도를 굵게',
        reason: `목표 ${Math.round(target / 60)}분대보다 ${Math.round(actual - target)}초 오래 걸렸습니다. 물이 잘 안 빠지고 있어 맛보다 흐름을 먼저 잡아야 합니다.`,
        alternatives: ['교반을 줄이거나 생략', '물줄기를 더 부드럽게', '미분이 많다면 그라인더 청소'],
      };
    }
    if (drift < -0.25) {
      return {
        headline: '분쇄도를 가늘게',
        reason: `목표보다 ${Math.round(target - actual)}초 빨리 끝났습니다. 물이 너무 빨리 빠져 충분히 추출되지 않았습니다.`,
        alternatives: ['뜸 시간을 늘리기', '물줄기를 가늘게 해 접촉 시간 확보'],
      };
    }
  }

  switch (taste) {
    case 'sour':
      return {
        headline: `분쇄도를 ${step} 가늘게`,
        reason: '신맛은 대개 과소추출입니다. 가늘게 갈면 접촉 면적이 늘어 단맛이 먼저 올라옵니다.',
        alternatives: ['물 온도를 2~3℃ 올리기', '뜸을 10초 더 주기', '물줄기를 가늘게 해 추출 시간 늘리기'],
      };
    case 'bitter':
      return {
        headline: `분쇄도를 ${step} 굵게`,
        reason: '쓴맛과 텁텁함은 대개 과다추출입니다. 굵게 갈면 물이 빨리 빠져 과추출 구간을 피합니다.',
        alternatives: ['물 온도를 2~3℃ 내리기', '교반을 줄이기', '마지막 물줄기를 생략해 일찍 종료'],
      };
    case 'weak':
      return {
        headline: '원두량을 1~2g 늘리기',
        reason: '농도가 옅습니다. 추출 자체가 아니라 비율 문제일 가능성이 높으니 분쇄도보다 원두량을 먼저 봅니다.',
        alternatives: ['가수를 줄이거나 생략', `분쇄도를 ${step} 가늘게`, '물 양을 줄여 비율 낮추기'],
      };
    case 'strong':
      return {
        headline: '가수를 늘리거나 물 양을 늘리기',
        reason: '맛 자체가 나쁜 게 아니라 농도가 높은 상태입니다. 추출 변수를 건드리기 전에 희석으로 맞춰 봅니다.',
        alternatives: ['원두량을 1~2g 줄이기', `분쇄도를 ${step} 굵게`],
      };
    case 'balanced':
      return {
        headline: '이대로 반복',
        reason: '맞았습니다. 이 기록의 분쇄도와 시간을 그대로 다시 쓰세요.',
        alternatives: [`원두가 더 디게싱되면 ${step} 가늘게 가야 할 수 있습니다`],
      };
  }
}

/** 로스팅 후 지난 일수. 날짜가 없으면 null */
export function daysOffRoast(roastedOn: string | undefined, now = new Date()): number | null {
  if (!roastedOn) return null;
  const roasted = new Date(`${roastedOn}T00:00:00`);
  if (Number.isNaN(roasted.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today.getTime() - roasted.getTime()) / 86_400_000);
}

/**
 * 디게싱 상태 한 줄 평.
 * 날짜별 구간은 필터 커피에서 통용되는 범위를 따른다 — 갓 볶은 원두는 가스가 많아
 * 물이 뜨고, 너무 오래되면 향이 빠진다.
 */
export function restingAdvice(days: number | null): { label: string; tone: 'early' | 'good' | 'late' } | null {
  if (days === null || days < 0) return null;
  if (days <= 3) return { label: `로스팅 ${days}일차 · 가스가 많아 맛이 튈 수 있습니다`, tone: 'early' };
  if (days <= 21) return { label: `로스팅 ${days}일차 · 마시기 좋은 구간`, tone: 'good' };
  if (days <= 35) return { label: `로스팅 ${days}일차 · 향이 옅어지는 구간`, tone: 'late' };
  return { label: `로스팅 ${days}일차 · 향미가 많이 빠졌을 수 있습니다`, tone: 'late' };
}

/** 특정 레시피의 기록만, 최신순으로 */
export function logsForRecipe(logs: BrewLog[], recipeId: string): BrewLog[] {
  return logs
    .filter((l) => l.recipeId === recipeId)
    .sort((a, b) => b.brewedAt.localeCompare(a.brewedAt));
}

/** 평균 별점. 별점이 달린 기록이 없으면 null */
export function averageRating(logs: BrewLog[]): number | null {
  const rated = logs.filter((l) => typeof l.rating === 'number');
  if (!rated.length) return null;
  return rated.reduce((acc, l) => acc + (l.rating ?? 0), 0) / rated.length;
}

/** 이 레시피로 가장 잘 나왔던 기록 (별점 우선, 같으면 최신) */
export function bestLog(logs: BrewLog[]): BrewLog | null {
  const rated = logs.filter((l) => typeof l.rating === 'number');
  if (!rated.length) return null;
  return rated.reduce((best, l) =>
    (l.rating ?? 0) > (best.rating ?? 0) || ((l.rating ?? 0) === (best.rating ?? 0) && l.brewedAt > best.brewedAt)
      ? l
      : best,
  );
}

/** 기록에서 레시피 기본값을 만든다 — "지난번 그대로 다시" 용 */
export function draftFromLog(log: BrewLog, recipe: Recipe): { beanG: number; grindNote: string | undefined } {
  return { beanG: log.beanG || recipe.beanG, grindNote: log.grindNote };
}
