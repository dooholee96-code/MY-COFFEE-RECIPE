import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { applyStoredTheme } from './lib/theme';

applyStoredTheme();

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 호스팅 배포본만 서비스 워커를 등록한다 — 오프라인에서도 열리고 홈 화면에 설치된다.
// 단일 HTML 파일(file://)에서는 서비스 워커가 동작하지 않으므로 등록하지 않는다.
if (import.meta.env.PROD && __PWA__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 등록 실패해도 앱은 그대로 쓸 수 있다 */
    });
  });
}
