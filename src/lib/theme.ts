import { KEYS, readJSON } from './storage';

/** 'auto' = 기기 설정(라이트/다크)을 따른다. 기본은 라이트 — 연표 앱과 같다 */
export type ThemePref = 'auto' | 'light' | 'dark';
export const DEFAULT_THEME: ThemePref = 'light';

export const THEME_OPTIONS: { id: ThemePref; label: string; hint: string }[] = [
  { id: 'light', label: '라이트', hint: '연한 종이' },
  { id: 'dark', label: '다크', hint: '밤' },
  { id: 'auto', label: '시스템', hint: '기기 설정을 따름' },
];

/** <html data-theme> 를 맞춘다. 토큰 전환은 index.css 가 이 속성을 보고 한다. */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === 'auto') delete root.dataset.theme;
  else root.dataset.theme = pref;
  syncThemeColor(pref);
}

/**
 * 주소창·상태바 색(theme-color). index.html 의 두 meta 는 기기 설정만 따르므로,
 * 설정에서 직접 고른 테마는 여기서 덮어쓴다. 'auto' 면 media 가 있는 원래 meta 로 돌아간다.
 */
function syncThemeColor(pref: ThemePref): void {
  const ID = 'mcr-theme-color';
  let meta = document.getElementById(ID) as HTMLMetaElement | null;
  if (pref === 'auto') {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement('meta');
    meta.id = ID;
    meta.name = 'theme-color';
    // media 가 있는 meta 보다 앞에 두어야 먼저 매칭된다
    document.head.prepend(meta);
  }
  meta.content = pref === 'dark' ? '#1c1724' : '#f3e7d8';
}

/** 첫 렌더 전에 저장된 테마를 입힌다 — 그러지 않으면 크림색이 번쩍했다가 어두워진다 */
export function applyStoredTheme(): void {
  const pref = readJSON<ThemePref>(KEYS.theme, DEFAULT_THEME);
  applyTheme(pref === 'auto' || pref === 'dark' ? pref : 'light');
}
