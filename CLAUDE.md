# MY COFFEE RECIPE

폰으로 보며 커피를 내리는 개인 레시피 앱. Vite + React + TypeScript.

## 명령

- `npm run dev` / `npm run build` / `npm run build:single` (단일 HTML 산출물)
- `npm test` — vitest. `npm run smoke` — 빌드 후 Playwright 로 실제 브라우저 확인
- `npm run lint` / `npm run typecheck`
- `npm run smoke:pwa` — 배포 빌드(dist/)를 HTTP 로 띄워 서비스 워커·오프라인·매니페스트 확인

`smoke` 는 Chromium 이 필요합니다. 이 저장소가 원격 세션에서 돌 때는
`CHROME_PATH=/opt/pw-browsers/chromium-*/chrome-linux/chrome` 를 넘기세요.

## 규칙

- **계산은 `src/lib/` 에, UI 밖에.** 물 양·시간·비율에 관한 로직은 순수 함수로 두고
  테스트를 붙입니다. 컴포넌트 안에서 산수하지 않습니다.
- **수치는 숫자로.** `beanG: 18` 이지 `"18g"` 이 아닙니다. 단위는 필드 이름이 지닙니다.
- **`waterG` 는 단계 합과 일치해야 합니다.** `data/recipes.test.ts` 가 강제합니다.
  레시피를 추가/수정하면 `npm test` 를 돌리세요.
- **단계의 물 양은 증분입니다.** "그 단계에서 더 붓는 양". 누적값은 `cumulativeWater()` 가 냅니다.
- **모바일 우선.** 기본 뷰포트는 폰입니다. 한 손으로, 젖은 손으로, 타이머가 도는 동안
  읽을 수 있어야 합니다.
- **오프라인에서 동작해야 합니다.** 런타임에 외부 리소스를 받지 않습니다. 폰트도 아이콘도
  소리도 전부 내장입니다.
- **접근성을 깨지 마세요.** 누를 수 있는 것은 `<button>` 입니다. 모달은 `Modal.tsx` 를 쓰세요
  (Esc, 포커스 가두기·복귀, 스크롤 잠금이 들어 있습니다).
- **localStorage 접근은 `lib/storage.ts` 를 거칩니다.** 시크릿 모드에서 던지는 예외를 감쌉니다.

## 빌드 두 가지

- `build:single` → `dist-single/index.html` 한 파일. 폰에 복사해 `file://` 로 연다. 서비스 워커 없음.
- `build` → `dist/`. GitHub Pages 배포본 (`.github/workflows/deploy.yml`, `main` 푸시 시).
  `vite.config.ts` 의 `pwa()` 플러그인이 매니페스트 링크와 `sw.js` 를 넣는다. `__PWA__` 로 갈린다.

서비스 워커(`pwa/sw.template.js`)를 고칠 때:
- 자리표시자(`{{VERSION}}`, `{{PRECACHE}}`)는 코드에 정확히 한 번씩만 — 주석에 쓰지 마세요.
  `fill()` 이 개수가 1 이 아니면 빌드를 실패시킵니다. (주석에 같은 문자열이 있어서 코드 대신 주석이
  채워진 적이 있습니다. 그 상태로 배포되면 워커가 로드 중에 죽고 오프라인이 조용히 안 됩니다.)
- 고친 뒤 `npm run smoke:pwa` 로 오프라인 재진입을 확인하세요.
- 워커는 localStorage(사용자 기록)를 건드리지 않습니다.

## 디자인

카페 메뉴판(라이트)과 에스프레소 바(다크) 두 테마. 색은 `src/index.css` 의 **의미 토큰으로만** 씁니다 —
`bg-card`, `text-ink-soft`, `bg-crema`, `text-hot` 처럼. `stone-800`, `amber-600`, `text-white` 같은
팔레트 색을 컴포넌트에 직접 쓰면 다크 테마에서 깨집니다. 새 색이 필요하면 토큰을 추가하고 두 테마에
모두 값을 넣으세요.

- 토큰 조합은 전부 WCAG AA(4.5:1) 이상입니다. 색을 바꾸면 대비를 다시 재세요.
- 숫자(g, ℃, 시간)는 `num` 유틸리티 — 세리프 고정폭 숫자. 작은 영문 머리글은 `eyebrow`.
- 세리프(Fraunces)는 라틴 600 한 벌만 woff2 로 싣습니다. 굵기를 더 늘리면 단일 파일이 그만큼 커집니다.
- 강조색 `crema` 는 주 행동(시작, 저장, 추가)에, 잉크 칠(`bg-ink text-canvas`)은 선택된 탭에 씁니다.

## 그라인더 환산

`src/lib/grinders.ts`. 레시피는 코만단테 기준이고, 다른 그라인더는 클릭당 이동 거리(µm)의
비와 V60 기준점으로 환산합니다. **환산은 추정이라는 점을 UI 에서 숨기지 마세요** — 환산값
옆에는 항상 원본 값을 남기고, 사용자가 기준점을 보정할 수 있어야 합니다. 새 그라인더를
추가할 때 `micronsPerClick` 과 `v60Anchor` 는 반드시 출처가 있는 값이어야 합니다. 추측한
숫자를 넣지 마세요 — 사용자가 그 숫자대로 원두를 갈게 됩니다. (Femobook A2 의 기준 45 는
공개 권장값 50 이 아니라 소유자의 실사용 범위 40~50 에서 왔습니다 — 출처가 사용자 본인입니다.)

기준점 우선순위는 `calibrationForBean()` 이 정합니다: 원두별 `grindAnchor` > 설정 보정값 >
그라인더 기본값. 원두 기준은 적힌 그라인더에만 적용됩니다.

기본 그라인더는 Femobook A2 입니다. 조정 조언("한 칸 가늘게")도 `oneStepLabel()` 로 내 그라인더 단위가
됩니다 (코만단테 1클릭 ≈ A2 2클릭). EK43 은 다이얼이 두 종류(0~16, 1~11)라 이름에 다이얼을 적습니다.

## 붓는 방식

`BrewStep.pour` (`PourTechnique`: 궤적·물줄기 굵기·속도·교반). **원본 레시피가 말한 것만** 넣습니다 —
말하지 않은 칸은 비워 두고, 모르는 레시피(4666, 6888 등)는 아예 넣지 않습니다. `pour.test.ts` 가 이를 지킵니다.
레시피 메모가 아니라 외부 자료에서 가져왔으면 `pourSource` 에 출처를 적으세요 (앱에 그대로 보입니다).
붓는 방식은 `hint` 에 다시 쓰지 않습니다 — `describePour()` 가 문장을 만듭니다.

`PourGlyph` 가 움직이는 그림을 그립니다(인라인 SVG + SMIL). SMIL 의 `dur` 는 `calc()` 를 받지 않으니
숫자로 넘기세요. 기기의 동작 줄이기 설정이면 정지 그림입니다.

## 데이터

`src/data/recipes.ts` 가 기본 레시피입니다. 사용자가 앱에서 추가한 레시피, 추출 기록(`BrewLog`),
원두(`Bean`) 는 localStorage 에 들어갑니다. 모델 설명은 `src/types.ts` 의 주석에 있습니다.

기록은 지워지면 안 되는 사용자 데이터입니다. `BrewLog` 는 `recipeTitle` 을 복사해 들고 있어서
레시피가 지워져도 기록이 살아남습니다. 이 성질을 깨지 마세요.
