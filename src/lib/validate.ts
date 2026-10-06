import type { Bean, BrewLog, BrewStep, Recipe } from '../types';

/**
 * localStorage 에서 읽은 값의 모양을 확인한다.
 *
 * 저장된 데이터는 앱 밖에서 올 수 있다 — 백업 파일을 손으로 고쳤거나, 옛 버전이 다른 모양으로
 * 저장했거나. 모양이 어긋난 항목 하나가 목록 전체를 못 열게 하면 안 되므로, 읽을 때 걸러내고
 * 나머지는 그대로 쓴다. 걸러낸 수는 호출한 쪽이 알 수 있게 돌려준다.
 */
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isStep(v: unknown): v is BrewStep {
  if (!isObj(v)) return false;
  const atOk = v.atSec === null || isNum(v.atSec);
  const waterOk = v.waterG === null || isNum(v.waterG);
  return atOk && waterOk && isStr(v.label);
}

export function isRecipe(v: unknown): v is Recipe {
  if (!isObj(v)) return false;
  return (
    isStr(v.id) &&
    isStr(v.title) &&
    isStr(v.category) &&
    isStr(v.serve) &&
    isStr(v.roast) &&
    isNum(v.beanG) &&
    isNum(v.waterG) &&
    isNum(v.tempC) &&
    isNum(v.totalSec) &&
    Array.isArray(v.steps) &&
    v.steps.every(isStep)
  );
}

export function isBrewLog(v: unknown): v is BrewLog {
  if (!isObj(v)) return false;
  return isStr(v.id) && isStr(v.recipeId) && isStr(v.recipeTitle) && isStr(v.brewedAt) && isNum(v.beanG) && isNum(v.waterG) && isNum(v.tempC);
}

export function isBean(v: unknown): v is Bean {
  return isObj(v) && isStr(v.id) && isStr(v.name);
}

export interface Sanitized<T> {
  items: T[];
  dropped: number;
}

/** 배열이 아니면 빈 목록으로, 배열이면 모양이 맞는 것만 */
export function sanitizeList<T>(value: unknown, guard: (v: unknown) => v is T): Sanitized<T> {
  if (!Array.isArray(value)) return { items: [], dropped: value == null ? 0 : 1 };
  const items = value.filter(guard);
  return { items, dropped: value.length - items.length };
}
