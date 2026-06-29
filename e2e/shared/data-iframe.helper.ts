/**
 * mc-data-manager iframe 로딩 헬퍼
 *
 * mc-web-console api.yaml의 mc-data-manager-fe가 http:// 로 설정되어
 * HTTPS 부모 페이지에서 mixed content 차단됨.
 * → iframe src를 JS로 https:// 로 교체한 뒤 frame 반환.
 */
import { type Frame, type Page } from '@playwright/test';
import { loginAndGoto } from './request-auth.helper';

const DATA_MGMT_URL = '/webconsole/operations/manage/datamigrations';

/**
 * mc-web-console 로그인 → Data Migration 페이지 진입
 * → ws01/default 선택 → iframe src http→https 수정 → Frame 반환
 */
export async function loadDataFrame(page: Page, tag: string): Promise<Frame | null> {
  const ok = await loginAndGoto(page, DATA_MGMT_URL, tag);
  if (!ok) { console.warn(`[${tag}] 로그인 실패`); return null; }

  await page.waitForTimeout(1500);

  const wsSelect = page.locator('#select-current-workspace');
  if (await wsSelect.count() === 0) { console.warn(`[${tag}] workspace selector 없음`); return null; }
  await wsSelect.selectOption({ label: 'ws01' });
  await page.waitForTimeout(1500);

  const prjSelect = page.locator('#select-current-project');
  if (await prjSelect.count() === 0) { console.warn(`[${tag}] project selector 없음`); return null; }
  await prjSelect.selectOption({ label: 'default' });

  // iframe src 대기
  await page.waitForSelector('#targetIframe iframe[src]', { timeout: 20_000 }).catch(() => {});

  // http → https 수정 (mixed content 차단 우회)
  const iframeEl = page.locator('#targetIframe iframe').first();
  const src = await iframeEl.getAttribute('src').catch(() => '');
  if (src && src.startsWith('http://')) {
    await page.evaluate((s) => {
      const el = document.querySelector('#targetIframe iframe') as HTMLIFrameElement;
      if (el) el.src = s;
    }, src.replace('http://', 'https://'));
  }
  await page.waitForTimeout(3000);

  // page.frames()로 3300 frame 찾기
  for (let i = 0; i < 6; i++) {
    const f = page.frames().find(fr => fr.url().includes('3300'));
    if (f) {
      // nav 링크 로드 대기
      await f.locator('a.nav-link').first().waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
      console.log(`[${tag}] iframe frame URL: ${f.url()}`);
      return f;
    }
    await page.waitForTimeout(1000);
  }
  console.warn(`[${tag}] 3300 frame 없음`);
  return null;
}

/** iframe 내에서 서비스 탭(Object Storage/SQL Database/No-SQL) 클릭 */
export async function clickServiceTab(frame: Frame, page: Page, tabText: string, tag: string): Promise<void> {
  const tab = frame.locator('#serviceTabs .nav-link').filter({ hasText: tabText }).first();
  if (await tab.count() === 0) {
    console.warn(`[${tag}] service tab "${tabText}" 없음`);
    return;
  }
  await tab.click();
  await page.waitForTimeout(1500);
  console.log(`[${tag}] service tab "${tabText}" 클릭 → ${frame.url()}`);
}

/** 텍스트/select 채우기 */
export async function fillField(frame: Frame, selector: string, value: string): Promise<void> {
  const el = frame.locator(selector).first();
  if (await el.count() === 0) return;
  const tag = await el.evaluate((e) => e.tagName.toLowerCase()).catch(() => '');
  if (tag === 'select') {
    await el.selectOption(value).catch(() => {});
  } else {
    await el.fill(value).catch(() => {});
  }
}

/** Submit 버튼 클릭 후 resultText 확인 */
export async function submitAndCheckResult(
  frame: Frame, page: Page, tag: string, timeout = 60_000
): Promise<string> {
  const submitBtn = frame.locator('button:visible').filter({ hasText: 'Submit' }).first();
  if (await submitBtn.count() === 0) {
    console.warn(`[${tag}] Submit 버튼 없음`);
    return '';
  }
  await submitBtn.click();
  console.log(`[${tag}] Submit 클릭`);
  await page.waitForTimeout(timeout > 10_000 ? 5_000 : 3_000);

  const resultEl = frame.locator('#resultText').first();
  if (await resultEl.count() > 0) {
    const result = await resultEl.inputValue().catch(() => '') || await resultEl.textContent().catch(() => '') || '';
    console.log(`[${tag}] result: ${result.slice(0, 300)}`);
    return result;
  }
  return '';
}
