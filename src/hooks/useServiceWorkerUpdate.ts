import { useEffect, useState } from 'react';

/**
 * 배포본이 바뀌어 새 서비스 워커가 페이지를 넘겨받으면 true.
 * 워커는 skipWaiting + clients.claim 으로 즉시 교체되지만, 열려 있는 페이지의 JS 는 옛 버전이다 —
 * 새로고침해야 새 화면이 되므로, 조용히 바뀌게 두지 않고 알린다.
 */
export function useServiceWorkerUpdate(): boolean {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // 첫 설치(controller 가 없던 상태 → 생김)는 업데이트가 아니다
    if (!navigator.serviceWorker.controller) return;
    const onChange = () => setUpdated(true);
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, []);
  return updated;
}
