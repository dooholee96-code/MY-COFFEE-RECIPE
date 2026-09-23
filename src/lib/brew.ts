import type { BrewStep, Recipe } from '../types';

/** 초를 m:ss 로. 음수는 0 으로 취급한다. */
export function formatSec(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 붓는 양이 정해진 단계인지 */
function isPour(step: BrewStep): boolean {
  return step.waterG !== null && step.waterG > 0;
}

/**
 * 각 단계까지의 누적 투입량.
 *
 * v1 은 레시피마다 누적/증분 표기가 섞여 있어 브루잉 중에 "지금 저울이 몇 g 이어야
 * 하는지"를 사람이 더해야 했다. 여기서 한 번에 계산한다.
 * 양이 정해지지 않은 단계(null)를 지나면 그 뒤의 누적값은 알 수 없으므로 null 이 된다.
 */
export function cumulativeWater(steps: BrewStep[]): (number | null)[] {
  let running: number | null = 0;
  return steps.map((step) => {
    if (step.waterG === null) running = null;
    else if (running !== null) running += step.waterG;
    return running;
  });
}

/** 물/원두 비율. 18g·280g → 15.6 */
export function brewRatio(recipe: Pick<Recipe, 'beanG' | 'waterG'>): number {
  if (recipe.beanG <= 0) return 0;
  return recipe.waterG / recipe.beanG;
}

/** '1:15.6' 형태로. 소수점이 필요 없으면 생략한다. */
export function formatRatio(recipe: Pick<Recipe, 'beanG' | 'waterG'>): string {
  const r = brewRatio(recipe);
  if (r === 0) return '—';
  const rounded = Math.round(r * 10) / 10;
  return `1:${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}`;
}

/** 타이머가 시계로 자동 진행할 수 있는 레시피인지 (모든 단계에 시각이 있어야 한다) */
export function isAutoPlayable(recipe: Pick<Recipe, 'steps'>): boolean {
  return recipe.steps.every((s) => s.atSec !== null);
}

/** 레시피 한 잔을 다 마실 때까지 잔에 들어가는 최종 음료량 (가수·우유 포함, 얼음 제외) */
export function servedVolumeG(recipe: Recipe): number {
  const f = recipe.finishing;
  return recipe.waterG + (f?.waterG ?? 0) + (f?.milkG ?? 0);
}

/** 현재 경과 초에 해당하는 단계 index. 아직 시작 전이면 -1 */
export function activeStepIndex(steps: BrewStep[], elapsedSec: number): number {
  let idx = -1;
  steps.forEach((step, i) => {
    if (step.atSec !== null && elapsedSec >= step.atSec) idx = i;
  });
  return idx;
}

/** 지금 저울에 찍혀 있어야 하는 목표 누적 투입량 */
export function targetWaterAt(steps: BrewStep[], elapsedSec: number): number | null {
  const idx = activeStepIndex(steps, elapsedSec);
  if (idx < 0) return 0;
  return cumulativeWater(steps)[idx] ?? null;
}

/** 붓는 단계만 골라 번호를 붙인다 (상세 화면 표기용) */
export function pourCount(steps: BrewStep[]): number {
  return steps.filter(isPour).length;
}
