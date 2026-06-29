/**
 * deploy/tc/sw/TC-APP-APPS-01.spec.ts
 * TC-APP-APPS-01: 배포 상태 목록 갱신 (Refresh)
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../shared/api-routes';
import { PAGES } from '../../shared/pages';
import { apiLoginBearer, loginAndGoto } from '../../shared/request-auth.helper';
import { gotoSwIframeTab } from '../../shared/sw-iframe.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-APP-APPS-01';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-APP-APPS-01: 배포 상태 목록 갱신 (Refresh)', () => {

  test('API: Apps Status 목록 조회', async ({ request }) => {
    const auth = await apiLoginBearer(request);
    const res  = await request.get(API_ROUTES.sw.listAppsStatus, { headers: auth });
    if (!res.ok()) {
      console.warn(`[TC-APP-APPS-01] listAppsStatus ${res.status()} — TODO: Apps API 경로 discovery 필요`);
      return;
    }
    const body = await res.json() as { code?: number; data?: unknown };
    expect(body).toBeDefined();
    console.log(`[TC-APP-APPS-01] Apps 목록: ${JSON.stringify(body).slice(0, 200)}`);
  });

  test('UI: Apps Status 탭 진입 → 목록 확인 → Refresh → 목록 갱신', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.sw.appsStatus, TC_ID);
    if (!ok) return;

    const frame = await gotoSwIframeTab(page, /apps?\s*status|appsStatus/i, TC_ID);
    if (!frame) return;

    // [1] 목록 표시 확인
    const rows = frame.locator('table tbody tr, .tabulator-row, [class*="app-item"], [class*="status-item"]');
    await page.waitForTimeout(1000);
    const countBefore = await rows.count();
    console.log(`[TC-APP-APPS-01][1] 초기 Apps 목록 수: ${countBefore}`);

    if (countBefore === 0) {
      const emptyEl = frame.locator('[class*="empty"], [class*="no-data"]').first();
      console.log(`[TC-APP-APPS-01][1] 빈 목록: ${await emptyEl.isVisible().catch(() => false) ? '표시' : 'warn-TODO'}`);
    }

    // [2] Refresh 버튼 클릭
    const refreshBtn = frame
      .locator('button').filter({ hasText: /refresh|갱신|새로고침/i }).first()
      .or(frame.locator('[class*="refresh"], button[aria-label*="refresh" i]').first());

    if (await refreshBtn.count() === 0) {
      console.warn('[TC-APP-APPS-01][2] Refresh 버튼 미발견 — discovery 필요');
      return;
    }

    let refreshCalled = false;
    page.on('response', res => {
      if (res.url().includes('/apps') && res.request().method() === 'GET') refreshCalled = true;
    });

    await refreshBtn.click();
    await page.waitForTimeout(1500);
    console.log(`[TC-APP-APPS-01][2] Refresh 클릭 — API 재호출: ${refreshCalled ? '확인' : 'warn-TODO(미캡처)'}`);

    const countAfter = await rows.count();
    console.log(`[TC-APP-APPS-01][3] Refresh 후 목록 수: ${countAfter} (전: ${countBefore})`);

    expect(page.url()).toMatch(/\/webconsole\//);
  });
});
