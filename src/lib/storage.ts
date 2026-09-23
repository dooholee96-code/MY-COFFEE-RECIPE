/**
 * localStorage 래퍼.
 *
 * 시크릿 모드나 사이트 데이터 차단 환경에서는 읽기/쓰기가 예외를 던지므로 전부 감싼다.
 * 저장이 안 되더라도 앱은 그대로 동작해야 한다.
 */

const PREFIX = 'mcr:'; // my-coffee-recipe

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 실패는 조용히 넘긴다 — 기능이 아니라 편의이므로
  }
}

export const KEYS = {
  favorites: 'favorites',
  customRecipes: 'customRecipes',
  myGrinder: 'myGrinder',
  soundOn: 'soundOn',
  brewLogs: 'brewLogs',
  beans: 'beans',
  grinderCalibration: 'grinderCalibration',
  activeBean: 'activeBean',
  theme: 'theme',
  pourMotion: 'pourMotion',
} as const;
