/*
 * 서비스 워커 — GitHub Pages 배포본을 오프라인에서도 열리게 한다.
 * 빌드 때 vite.config.ts 의 pwa() 플러그인이 아래 두 줄의 버전과 파일 목록을 채운다.
 * (단일 HTML 빌드에는 들어가지 않는다 — file:// 에서는 서비스 워커가 동작하지 않고, 필요도 없다.)
 *
 * 전략
 *  - 페이지(index.html): 네트워크 우선. 온라인이면 항상 최신 배포본, 오프라인이면 저장본.
 *  - 그 밖의 파일: 캐시 우선. JS/CSS 는 이름에 내용 해시가 붙어 있어 바뀌면 이름이 바뀌므로
 *    오래된 파일을 잘못 내줄 일이 없다.
 *  - 버전이 바뀌면 이전 캐시를 지운다.
 *
 * 사용자 데이터(기록·원두)는 localStorage 에 있고 여기서 건드리지 않는다.
 */
const CACHE = 'mcr-{{VERSION}}';
const PRECACHE = /* {{PRECACHE}} */ [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mcr-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
