import { KEYS, readJSON } from './storage';

/** 'auto' = 기기 설정(라이트/다크)을 따른다 */
export type ThemePref = 'auto' | 'light' | 'dark';

export const THEME_OPTIONS: { id: ThemePref; label: string; hint: string }[] = [
  { id: 'auto', label: '자동', hint: '기기 설정을 따름' },
  { id: 'light', label: '카페', hint: '크림 바탕' },
  { id: 'dark', label: '에스프레소 바', hint: '어두운 바탕' },
];

/** <html data-theme> 를 맞춘다. 토큰 전환은 index.css 가 이 속성을 보고 한다. */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === 'auto') delete root.dataset.theme;
  else root.dataset.theme = pref;
}

/** 첫 렌더 전에 저장된 테마를 입힌다 — 그러지 않으면 크림색이 번쩍했다가 어두워진다 */
export function applyStoredTheme(): void {
  const pref = readJSON<ThemePref>(KEYS.theme, 'auto');
  applyTheme(pref === 'light' || pref === 'dark' ? pref : 'auto');
}
