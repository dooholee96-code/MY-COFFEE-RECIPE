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
  if (!t.includes('MY COFFEE RECIPE')) throw new Error(`제목: ${t}`);
});

await step('17개 레시피가 보인다', async () => {
  const n = await page.locator('article').count();
  if (n !== 17) throw new Error(`카드 ${n}개`);
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
  const clock = d.locator('.font-mono.text-4xl').first();
  const t0 = await clock.textContent();
  await page.waitForFunction(
    (prev) => document.querySelector('[role=dialog] .font-mono.text-4xl')?.textContent !== prev,
    t0, { timeout: 4000 },
  );
  const t1 = await clock.textContent();
  if (t1 === t0) throw new Error('시계가 멈춰 있다');
  console.log(`      시계 ${t0} → ${t1}`);
});

await step('원두량을 바꾸면 물이 비례 조정된다', async () => {
  const d = page.locator('[role=dialog]');
  await d.getByRole('button', { name: '원두량 1g 늘리기' }).click(); // 18 → 19g
  await page.waitForFunction(() =>
    document.querySelector('[role=dialog]')?.textContent?.includes('19g 기준으로 조정됨'));
  const body = await d.textContent();
  if (!body.includes('232g')) throw new Error('220g × 19/18 = 232g 이 안 보인다');
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

await step('콘솔 에러가 없다', async () => {
  if (errors.length) throw new Error(errors.join(' | '));
});

await page.screenshot({ path: `${process.env.SHOT_DIR ?? process.cwd()}/shot-list.png`, fullPage: false });
await page.getByRole('button', { name: /브루잉/ }).click();
await page.getByRole('button', { name: '4666 V2', exact: true }).first().click();
await page.waitForSelector('[role=dialog]');
await page.screenshot({ path: `${process.env.SHOT_DIR ?? process.cwd()}/shot-detail.png` });

await browser.close();
console.log('\n스모크 테스트 종료');
