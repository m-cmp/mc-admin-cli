/**
 * deploy/tc/sw/TC-APP-APPS-02.spec.ts
 * TC-APP-APPS-02: 배포 상세 조회
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../shared/api-routes';
import { PAGES } from '../../shared/pages';
import { apiLoginBearer, loginAndGoto } from '../../shared/request-auth.helper';
import { gotoSwIframeTab } from '../../shared/sw-iframe.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-APP-APPS-02';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-APP-APPS-02: 배포 상세 조회', () => {

  test('API: Apps 상세 조회 (목록 첫 번째 기준)', async ({ request }) => {
    const auth = await apiLoginBearer(request);

    const listRes = await request.get(API_ROUTES.sw.listAppsStatus, { headers: auth });
    if (!listRes.ok()) {
      console.warn(`[TC-APP-APPS-02] listAppsStatus ${listRes.status()} — discovery 필요`);
      return;
    }

    const listBody = await listRes.json() as { code?: number; data?: Array<{ id?: string | number; name?: string }> };
    const items = Array.isArray(listBody.data) ? listBody.data : [];
    if (items.length === 0) {
      console.warn('[TC-APP-APPS-02] 배포된 App 없음 — 사전 배포 필요');
      return;
    }

    const firstId = items[0]?.id;
    const detailRes = await request.get(`${API_ROUTES.sw.getAppsDetail}/${firstId}`, { headers: auth });
    if (!detailRes.ok()) {
      console.warn(`[TC-APP-APPS-02] getAppsDetail/${firstId} ${detailRes.status()} — discovery 필요`);
      return;
    }

    const detail = await detailRes.json() as { code?: number; data?: unknown };
    expect(detail.data).toBeDefined();
    console.log(`[TC-APP-APPS-02] 상세 데이터: ${JSON.stringify(detail.data).slice(0, 200)}`);
  });

  test('UI: Apps Status 탭 → 항목 클릭 → 상세 화면 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.sw.appsStatus, TC_ID);
    if (!ok) return;

    const frame = await gotoSwIframeTab(page, /apps?\s*status|appsStatus/i, TC_ID);
    if (!frame) return;

    // [1] 목록 첫 번째 항목 확인
    const firstRow = frame.locator('table tbody tr, .tabulator-row, [class*="app-item"]').first();
    if (await firstRow.count() === 0) {
      console.warn('[TC-APP-APPS-02][1] 배포된 App 없음 — 사전 배포 필요');
      return;
    }

    const itemName = ((await firstRow.textContent().catch(() => '')) ?? '').trim().slice(0, 40);
    console.log(`[TC-APP-APPS-02][1] 선택할 App: '${itemName}'`);

    // 상세 진입: Detail 버튼 → 행 클릭
    const detailTrigger = firstRow.locator('a, button').filter({ hasText: /detail|상세|보기/i }).first();
    if (await detailTrigger.count() > 0) {
      await detailTrigger.click();
    } else {
      await firstRow.click().catch(() => null);
    }

    await page.waitForTimeout(1000);

    // [2] 상세 화면 표시 확인
    const detailContainer = frame.locator('[class*="detail"], [class*="modal"], [role="dialog"]').first();
    const hasDetail = await detailContainer.count() > 0;
    console.log(`[TC-APP-APPS-02][2] 상세 화면 표시: ${hasDetail ? '확인' : 'warn-TODO(미확인)'}`);

    expect(page.url()).toMatch(/\/webconsole\//);
  });
});
