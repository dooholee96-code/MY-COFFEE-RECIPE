# MY COFFEE RECIPE

폰으로 보며 커피를 내리는 개인 레시피 앱. Vite + React + TypeScript.

## 명령

- `npm run dev` / `npm run build` / `npm run build:single` (단일 HTML 산출물)
- `npm test` — vitest. `npm run smoke` — 빌드 후 Playwright 로 실제 브라우저 확인
- `npm run lint` / `npm run typecheck`

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

## 그라인더 환산

`src/lib/grinders.ts`. 레시피는 코만단테 기준이고, 다른 그라인더는 클릭당 이동 거리(µm)의
비와 V60 기준점으로 환산합니다. **환산은 추정이라는 점을 UI 에서 숨기지 마세요** — 환산값
옆에는 항상 원본 값을 남기고, 사용자가 기준점을 보정할 수 있어야 합니다. 새 그라인더를
추가할 때 `micronsPerClick` 과 `v60Anchor` 는 반드시 출처가 있는 값이어야 합니다. 추측한
숫자를 넣지 마세요 — 사용자가 그 숫자대로 원두를 갈게 됩니다.

## 데이터

`src/data/recipes.ts` 가 기본 레시피입니다. 사용자가 앱에서 추가한 레시피, 추출 기록(`BrewLog`),
원두(`Bean`) 는 localStorage 에 들어갑니다. 모델 설명은 `src/types.ts` 의 주석에 있습니다.

기록은 지워지면 안 되는 사용자 데이터입니다. `BrewLog` 는 `recipeTitle` 을 복사해 들고 있어서
레시피가 지워져도 기록이 살아남습니다. 이 성질을 깨지 마세요.
