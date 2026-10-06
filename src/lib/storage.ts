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

/** 저장이 실패했을 때 window 에 쏘는 이벤트 이름. App 이 받아 배너를 띄운다. */
export const STORAGE_ERROR_EVENT = 'mcr:storage-error';

/**
 * 저장. 실패하면 false 를 돌려주고 이벤트를 쏜다.
 * 기록·원두는 사용자 데이터라서, 저장이 안 됐는데 된 것처럼 보이면 안 된다
 * (용량 초과, 시크릿 모드, 사이트 데이터 차단).
 */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    try {
      window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key } }));
    } catch {
      /* 이벤트조차 못 쏘는 환경이면 할 수 있는 게 없다 */
    }
    return false;
  }
}

/** 저장된 키 전부 (백업·초기화용) */
export function allKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  } catch {
    return [];
  }
}

/** 이 앱의 저장 데이터를 전부 지운다. 오류 화면의 "초기화" 에서만 쓴다. */
export function clearAll(): void {
  for (const k of allKeys()) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* 무시 */
    }
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
