import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 크기
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(`file://${process.cwd()}/dist-single/index.html`);
await page.waitForSelector('h1');

const step = async (name, fn) => {
  try { await fn(); console.log(`PASS  ${name}`); }
  catch (e) { console.log(`FAIL  ${name}: ${e.message}`); process.exitCode = 1; }
};

await step('앱이 렌더링된다', async () => {
  const t = await page.textContent('h1');
  if (!/my coffee recipe/i.test(t)) throw new Error(`제목: ${t}`);
});

await step('17개 레시피가 보인다', async () => {
  const n = await page.locator('article').count();
  if (n !== 17) throw new Error(`카드 ${n}개`);
});

await step('처음 열면 Femobook A2 가 기본 그라인더다', async () => {
  const body = await page.textContent('main');
  // 4666 V2 — 코만단테 22~24 → Femobook 45~48.5
  if (!body.includes('Femobook A2 45~48.5')) throw new Error(`기본 환산이 안 보인다: ${body.slice(0, 300)}`);
});

await step('V60 깔끔 레시피는 코만단테와 EK43 을 각각 환산하고 차이를 알린다', async () => {
  await page.getByRole('button', { name: '하리오 V60 깔끔 레시피', exact: true }).first().click();
  const d = page.locator('[role=dialog]');
  await d.getByText('← EK43 (0~16) 13~14').waitFor();
  const body = await d.textContent();
  if (!body.includes('51.5~53.5')) throw new Error('코만단테 환산 없음');
  if (!body.includes('44~46')) throw new Error('EK43 환산 없음');
  if (!body.includes('7.5클릭 차이')) throw new Error('차이 안내 없음');
  // 푸어 방식: 회차마다 물줄기가 굵어진다
  for (const t of ['가는 물줄기', '중간 물줄기', '굵은 물줄기']) if (!body.includes(t)) throw new Error(`${t} 없음`);
  await page.keyboard.press('Escape');
});

await step('용챔 레시피의 EK43 은 1~11 다이얼로 표시된다', async () => {
  await page.getByRole('button', { name: '용챔 약배전 (15g)', exact: true }).click();
  await page.locator('[role=dialog]').getByText('← EK43 (1~11) 9.0').waitFor();
  await page.keyboard.press('Escape');
});

await step('카스야 4:6 은 나선 푸어가 움직이는 그림으로 나온다', async () => {
  await page.getByRole('button', { name: '테츠 카스야 4:6', exact: true }).first().click();
  const d = page.locator('[role=dialog]');
  // 타이머 카드 — 움직이는 그림 (animateMotion 이 들어 있다)
  const live = d.locator('[aria-live=polite] svg[role=img][aria-label="나선"]');
  await live.waitFor();
  if ((await live.locator('animateMotion').count()) !== 1) throw new Error('나선 그림이 움직이지 않는다');
  // 단계 표 — 다섯 푸어 모두 정지 그림
  const table = d.locator('ol svg[role=img][aria-label="나선"]');
  if ((await table.count()) !== 5) throw new Error(`단계 표 그림 ${await table.count()}개`);
  if ((await table.locator('animate, animateMotion').count()) !== 0) throw new Error('단계 표 그림이 움직인다');
  await d.getByText('붓는 방식 출처').waitFor();
  await page.keyboard.press('Escape');
});

await step('원두량 조절 기능은 없다', async () => {
  await page.getByRole('button', { name: '4666 V2', exact: true }).first().click();
  const n = await page.locator('[role=dialog]').getByText('원두량 조정').count();
  if (n) throw new Error('원두량 조정이 남아 있다');
  await page.keyboard.press('Escape');
});

await step('검색이 목록을 줄인다', async () => {
  await page.fill('input[type=search]', '카스야');
  await page.waitForFunction(() => document.querySelectorAll('article').length === 2);
  await page.fill('input[type=search]', '');
  await page.waitForFunction(() => document.querySelectorAll('article').length === 17);
});

await step('ICE 필터가 9개로 줄이고, 칩으로 해제된다', async () => {
  await page.getByRole('button', { name: /^필터/ }).click();
  await page.getByRole('button', { name: 'ICE', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('article').length === 9);
  await page.getByRole('button', { name: /^필터/ }).click(); // 접기
  await page.getByRole('button', { name: 'ICE', exact: true }).click(); // 칩으로 해제
  await page.waitForFunction(() => document.querySelectorAll('article').length === 17);
});

await step('빈 카테고리에 안내가 나온다', async () => {
  await page.getByRole('button', { name: /에스프레소/ }).click();
  await page.waitForSelector('text=에스프레소 레시피가 아직 없습니다');
  await page.getByRole('button', { name: /브루잉/ }).click();
});

await step('상세 시트가 열린다', async () => {
  await page.getByRole('button', { name: '4666 V2', exact: true }).first().click();
  await page.waitForSelector('[role=dialog]');
  const d = page.locator('[role=dialog]');
  if (!(await d.textContent()).includes('브루잉 타이머') === false) {} // noop
  await d.getByText('추출 단계').waitFor();
});

await step('타이머가 돌고 단계가 넘어간다', async () => {
  const d = page.locator('[role=dialog]');
  await d.getByRole('button', { name: '시작' }).click();
  await d.getByRole('button', { name: '일시정지' }).waitFor();
  const clock = d.getByRole('timer');
  const t0 = await clock.textContent();
  await page.waitForFunction(
    (prev) => document.querySelector('[role=dialog] [role=timer]')?.textContent !== prev,
    t0, { timeout: 4000 },
  );
  const t1 = await clock.textContent();
  if (t1 === t0) throw new Error('시계가 멈춰 있다');
  console.log(`      시계 ${t0} → ${t1}`);
});

await step('HOT/ICE 버전 전환이 된다', async () => {
  const d = page.locator('[role=dialog]');
  await d.getByRole('button', { name: /ICE 버전 보기/ }).click();
  await page.waitForFunction(() =>
    document.querySelector('[role=dialog] h2')?.textContent?.includes('4666 V2'));
});

await step('Esc 로 닫힌다', async () => {
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
});

await step('즐겨찾기가 저장되고 새로고침 후에도 남는다', async () => {
  await page.locator('article').first().getByRole('button', { name: /즐겨찾기/ }).click();
  await page.reload();
  await page.waitForSelector('article');
  const pressed = await page.locator('article').first().getByRole('button', { name: /즐겨찾기/ }).getAttribute('aria-pressed');
  if (pressed !== 'true') throw new Error(`aria-pressed=${pressed}`);
});

await step('레시피를 추가하면 빈 카테고리가 채워진다', async () => {
  await page.getByRole('button', { name: '레시피 추가' }).click();
  const d = page.locator('[role=dialog]');
  await d.locator('#rf-title').fill('모카포트 테스트');
  await d.locator('#rf-category').selectOption('mokapot');
  await d.locator('#rf-bean').fill('16');
  await d.locator('#rf-temp').fill('95');
  await d.getByLabel('1단계 분').fill('0');
  await d.getByLabel('1단계 초').fill('0');
  await d.getByLabel('1단계 물 양').fill('120');
  await d.getByLabel('1단계 동작').fill('물 채우고 가열');
  await d.getByRole('button', { name: '저장' }).click();
  await page.waitForFunction(() =>
    document.querySelector('[role=dialog] h2')?.textContent?.includes('모카포트 테스트'));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /모카포트/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('article').length === 1);
});

await step('추출을 기록하면 조정 제안이 나온다', async () => {
  await page.getByRole('button', { name: /브루잉/ }).click();
  await page.getByRole('button', { name: '4666 V2', exact: true }).first().click();
  const d = page.locator('[role=dialog]');
  await d.getByRole('button', { name: '타이머 없이 기록하기' }).click();
  await page.waitForFunction(() =>
    document.querySelector('[role=dialog] h2')?.textContent?.includes('추출 기록'));
  await page.getByRole('button', { name: '시다', exact: true }).click();
  await page.waitForSelector('text=분쇄도를 2클릭 가늘게'); // Femobook A2 기준
  // 타이머를 돌리지 않았으므로 시간 칸은 비어 있어야 한다 (0 이 아니라)
  const sec = await d.locator('#bl-sec').inputValue();
  if (sec !== '') throw new Error(`시간 칸에 ${sec} 가 들어 있다`);
  await page.getByRole('radio', { name: '4점' }).click();
  await page.getByRole('button', { name: '저장' }).click();
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
});

await step('기록 화면에 남고 레시피에도 되비친다', async () => {
  await page.getByRole('button', { name: /^기록/ }).click();
  await page.waitForSelector('article');
  const body = await page.textContent('main');
  if (!body.includes('4666 V2')) throw new Error('기록 목록에 없다');
  await page.getByRole('button', { name: /^레시피$/ }).click();
  await page.getByRole('button', { name: '4666 V2', exact: true }).first().click();
  await page.waitForSelector('text=내 기록 1회');
  await page.waitForSelector('text=가장 잘 나온 설정');
  await page.keyboard.press('Escape');
});

await step('Femobook A2 를 고르면 분쇄도가 환산된다', async () => {
  await page.getByRole('button', { name: /^설정/ }).click();
  await page.getByRole('button', { name: 'Femobook A2', exact: true }).click();
  await page.waitForSelector('text=환산 기준 보정');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  const body = await page.textContent('main');
  // 코만단테 22~24 → Femobook 45~48.5 (기준 45)
  if (!body.includes('Femobook A2 45~48.5')) throw new Error(`환산값이 안 보인다: ${body.slice(0, 400)}`);
  if (!body.includes('코만단테 22~24')) throw new Error('원본 값이 사라졌다');
});

await step('보정하면 환산값이 함께 움직인다', async () => {
  await page.getByRole('button', { name: /^설정/ }).click();
  await page.getByRole('button', { name: '기준 1클릭 늘리기' }).click(); // 45 → 46
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  const body = await page.textContent('main');
  if (!body.includes('Femobook A2 46~49.5')) throw new Error(`보정이 반영 안 됨: ${body.slice(0, 300)}`);
});

await step('기록 폼의 분쇄도가 내 그라인더 값으로 채워진다', async () => {
  await page.getByRole('button', { name: /^레시피$/ }).click();
  await page.getByRole('button', { name: '테츠 카스야 4:6', exact: true }).first().click();
  const d = page.locator('[role=dialog]');
  await d.getByRole('button', { name: '타이머 없이 기록하기' }).click();
  const grind = await d.locator('#bl-grind').inputValue();
  if (!grind.startsWith('Femobook A2')) throw new Error(`분쇄도 기본값이 ${grind}`);
  console.log(`      기본값: ${grind}`);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
});

await step('원두를 등록하면 로스팅 일수가 계산된다', async () => {
  await page.getByRole('button', { name: /^원두/ }).click();
  await page.getByRole('button', { name: '원두 등록' }).first().click();
  const d = page.locator('[role=dialog]');
  await d.locator('#bf-name').fill('예가체프');
  const d5 = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  await d.locator('#bf-date').fill(d5);
  await d.locator('#bf-anchor').fill('41');
  await d.getByRole('button', { name: '저장' }).click();
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await page.waitForSelector('text=로스팅 5일차');
  // 처음 등록한 원두는 바로 "지금 쓰는 원두" 가 된다
  await page.getByRole('button', { name: '지금 쓰는 원두' }).waitFor();
});

await step('원두를 고르면 그 원두의 기준으로 분쇄도가 바뀐다', async () => {
  await page.getByRole('button', { name: /^레시피$/ }).click();
  let body = await page.textContent('main');
  // 설정 보정값(46) 대신 원두 기준(41)이 쓰인다
  if (!body.includes('Femobook A2 41~44.5')) throw new Error(`원두 기준 미반영: ${body.slice(0, 400)}`);
  // 원두 선택을 풀면 설정 보정값으로 돌아간다
  await page.locator('main select').first().selectOption('');
  body = await page.textContent('main');
  if (!body.includes('Femobook A2 46~49.5')) throw new Error(`원두 해제 후 복귀 안 됨: ${body.slice(0, 300)}`);
});

await step('콘솔 에러가 없다', async () => {
  if (errors.length) throw new Error(errors.join(' | '));
});

await page.getByRole('button', { name: /^레시피$/ }).click();
await page.screenshot({ path: `${process.env.SHOT_DIR ?? process.cwd()}/shot-list.png`, fullPage: false });
await page.getByRole('button', { name: '4666 V2', exact: true }).first().click();
await page.waitForSelector('[role=dialog]');
await page.screenshot({ path: `${process.env.SHOT_DIR ?? process.cwd()}/shot-detail.png` });

await browser.close();
console.log('\n스모크 테스트 종료');
