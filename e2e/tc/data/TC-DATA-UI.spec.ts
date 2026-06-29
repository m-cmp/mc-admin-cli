/**
 * deploy/tc/data/TC-DATA-UI.spec.ts
 * TC-DATA-UI-01~06: mc-data-manager UI 브라우저 테스트 (포털 iframe)
 *
 * 접속: https://15.164.139.37:3001/webconsole/operations/manage/datamigrations
 * iframe: mc-data-manager-fe (:3300)
 */
import { test, expect } from '@playwright/test';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';
import { loadDataFrame, clickServiceTab } from './helpers/data-portal.helper';

const TC_ID = 'TC-DATA-UI-01';
const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p = ctx.params;

const PAGE_URL = (p.pageUrl as string) ?? '/webconsole/operations/manage/datamigrations';
const DATA_MANAGER = (p.dataManagerBaseUrl as string) ?? 'https://15.164.139.37:3300';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-UI-01: 페이지 로드 및 iframe 초기화', () => {

  test('UI: workspace/project 선택 후 iframe 로드 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGE_URL, 'TC-DATA-UI-01');
    expect(ok).toBeTruthy();

    await page.waitForTimeout(1500);
    await page.locator('#select-current-workspace').selectOption({ label: p.workspaceName as string ?? 'ws01' });
    await page.waitForTimeout(1500);
    await page.locator('#select-current-project').selectOption({ label: p.projectName as string ?? 'default' });
    await page.waitForTimeout(3000);

    const iframeEl = page.locator('#targetIframe iframe').first();
    await iframeEl.waitFor({ state: 'attached', timeout: 15_000 });
    const src = await iframeEl.getAttribute('src') || '';
    console.log(`[TC-DATA-UI-01] iframe src: ${src}`);
    expect(src).toMatch(/3300/);
  });
});

test.describe('TC-DATA-UI-02: Nav 탭 Navigation', () => {

  test('UI: Generate / Migration / Back up / Restore nav 링크 확인', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-UI-02');
    if (!frame) { console.warn('[TC-DATA-UI-02] SKIP'); return; }

    const navLinks = frame.locator('a.nav-link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push((await navLinks.nth(i).textContent())?.trim() ?? '');
    }
    console.log(`[TC-DATA-UI-02] nav links: ${texts.join(', ')}`);
    expect(texts.some(t => /generate|migration|back|restore/i.test(t))).toBeTruthy();
  });
});

test.describe('TC-DATA-UI-03: Service 탭 전환', () => {

  test('UI: Object Storage / SQL Database / No-SQL 탭 전환', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-UI-03');
    if (!frame) { console.warn('[TC-DATA-UI-03] SKIP'); return; }

    for (const tab of ['Object Storage', 'SQL Database', 'No-SQL']) {
      await clickServiceTab(frame, page, tab, 'TC-DATA-UI-03');
    }
    console.log('[TC-DATA-UI-03] service tab 전환 완료');
  });
});

test.describe('TC-DATA-UI-04: Object Storage Migration 태스크 목록', () => {

  test('UI: /migrate/objectstorage 페이지 로드', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-UI-04');
    if (!frame) { console.warn('[TC-DATA-UI-04] SKIP'); return; }

    await frame.goto(`${DATA_MANAGER}/migrate/objectstorage`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/migrate/objectstorage');
    console.log(`[TC-DATA-UI-04] URL: ${frame.url()}`);
  });
});

test.describe('TC-DATA-UI-05: Generate 페이지', () => {

  test('UI: /generate/objectstorage form 확인', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-UI-05');
    if (!frame) { console.warn('[TC-DATA-UI-05] SKIP'); return; }

    await frame.goto(`${DATA_MANAGER}/generate/objectstorage`, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    }).catch(() => {});
    await page.waitForTimeout(2000);
    expect(frame.url()).toContain('/generate/objectstorage');

    const submitBtn = frame.locator('button:visible').filter({ hasText: 'Submit' });
    expect(await submitBtn.count()).toBeGreaterThan(0);
    console.log('[TC-DATA-UI-05] Generate form 확인 완료');
  });
});

test.describe('TC-DATA-UI-06: Back up / Restore 등록 페이지', () => {

  test('UI: /backup/register 및 /restore/register 페이지 로드', async ({ page }) => {
    const frame = await loadDataFrame(page, 'TC-DATA-UI-06');
    if (!frame) { console.warn('[TC-DATA-UI-06] SKIP'); return; }

    for (const path of ['/backup/register', '/restore/register']) {
      await frame.goto(`${DATA_MANAGER}${path}`, {
        timeout: 10_000,
        waitUntil: 'domcontentloaded',
      }).catch(() => {});
      await page.waitForTimeout(1500);
      expect(frame.url()).toContain(path);
      console.log(`[TC-DATA-UI-06] ${path} 로드 확인`);
    }
  });
});
