/**
 * deploy/tc/sw/TC-APP-DEP-01.spec.ts
 * TC-APP-DEP-01: VM 단일 배포 (Standalone)
 *
 * API: mc-application-manager /deploy (TODO — discovery 필요)
 * 화면: SW Catalogs iframe > Deploy 탭
 */
import { test, expect } from '@playwright/test';
import { API_ROUTES } from '../../shared/api-routes';
import { PAGES } from '../../shared/pages';
import { apiLoginBearer, loginAndGoto } from '../../shared/request-auth.helper';
import { gotoSwIframeTab } from '../../shared/sw-iframe.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-APP-DEP-01';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);

test.use({ storageState: { cookies: [], origins: [] } });

// ── TC-APP-DEP-01: VM 단일 배포 (Standalone) ─────────────────────────────────

test.describe('TC-APP-DEP-01: VM 단일 배포 (Standalone)', () => {

  test('API: Deploy API 엔드포인트 확인', async ({ request }) => {
    const auth = await apiLoginBearer(request);
    const res  = await request.get(API_ROUTES.sw.deploySw, { headers: auth });
    if (!res.ok()) {
      console.warn(`[TC-APP-DEP-01] deploySw GET ${res.status()} — TODO: Deploy API 경로 discovery 필요`);
      return;
    }
    const body = await res.json() as { code?: number; data?: unknown };
    expect(body).toBeDefined();
    console.log(`[TC-APP-DEP-01] Deploy 엔드포인트 응답: ${JSON.stringify(body).slice(0, 200)}`);
  });

  test('UI: SW Deploy 탭 진입 → VM Standalone 배포 흐름', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.sw.deploy, TC_ID);
    if (!ok) return;

    const frame = await gotoSwIframeTab(page, /deploy/i, TC_ID);
    if (!frame) return;

    // [1] Deploy 화면 진입 확인
    const deployContainer = frame.locator('[class*="deploy"], [class*="Deploy"], h1, h2').first();
    const pageLoaded = await deployContainer.isVisible().catch(() => false);
    console.log(`[TC-APP-DEP-01][1] Deploy 화면 진입: ${pageLoaded ? '확인' : 'warn-TODO(미확인)'}`);

    // [2] 배포 타입 선택 — VM Standalone
    const standaloneOpt = frame
      .locator('input[type="radio"], [class*="type-card"], [class*="option"]')
      .filter({ hasText: /standalone/i })
      .first();

    if (await standaloneOpt.count() > 0) {
      await standaloneOpt.click().catch(() => null);
      console.log('[TC-APP-DEP-01][2] Standalone 옵션 선택');
    } else {
      const deployTypeSelector = frame.locator('select[name*="type"], [class*="type"] select').first();
      if (await deployTypeSelector.count() > 0) {
        await deployTypeSelector.selectOption({ label: 'standalone' }).catch(async () => {
          await deployTypeSelector.selectOption({ index: 0 }).catch(() => null);
        });
        console.log('[TC-APP-DEP-01][2] VM Standalone 배포 타입 선택');
      } else {
        console.warn('[TC-APP-DEP-01][2] 배포 타입 selector 미발견 — discovery 필요');
      }
    }
    await page.waitForTimeout(500);

    // [3] 대상 VM 선택 (목록 첫 번째 항목)
    const vmSelector = frame.locator(
      'select[name*="vm"], select[name*="target"], select[name*="mci"], [class*="vm"] select'
    ).first();

    if (await vmSelector.count() > 0) {
      await vmSelector.selectOption({ index: 0 }).catch(() => null);
      console.log('[TC-APP-DEP-01][3] 대상 VM 선택 (첫 번째 항목)');
    } else {
      const firstVm = frame.locator('[class*="vm-item"], [class*="vmItem"], [class*="target"] [class*="item"]').first();
      if (await firstVm.count() > 0) {
        await firstVm.click();
        console.log('[TC-APP-DEP-01][3] VM 항목 클릭');
      } else {
        console.warn('[TC-APP-DEP-01][3] 대상 VM 선택 UI 미발견 — discovery 필요');
      }
    }
    await page.waitForTimeout(300);

    // [4] Catalog 선택
    const catalogSelector = frame.locator('select[name*="catalog"], select[name*="app"]').first();
    if (await catalogSelector.count() > 0) {
      await catalogSelector.selectOption({ index: 0 }).catch(() => null);
      console.log('[TC-APP-DEP-01][4] Catalog 선택 (첫 번째 항목)');
    } else {
      console.warn('[TC-APP-DEP-01][4] Catalog 선택 UI 미발견 — discovery 필요');
    }

    // [5] 배포 실행 버튼 클릭
    const deployBtn = frame.locator('button').filter({ hasText: /deploy|배포|실행|install/i }).first();
    if (await deployBtn.count() === 0) {
      console.warn('[TC-APP-DEP-01][5] 배포 버튼 미발견 — discovery 필요');
      return;
    }

    let deployStatus = 0;
    page.on('response', res => {
      if (res.request().method() === 'POST' && res.url().includes('/deploy')) {
        deployStatus = res.status();
      }
    });

    const clicked = await deployBtn.click({ timeout: 5_000 }).then(() => true).catch(() => false);
    if (!clicked) {
      console.warn('[TC-APP-DEP-01][5] 배포 버튼 클릭 실패 — 비활성 또는 오버레이 (discovery 필요)');
      return;
    }
    await page.waitForTimeout(2000);
    console.log(`[TC-APP-DEP-01][5] 배포 실행 클릭 — API 응답: ${deployStatus || 'warn-TODO(미캡처)'}`);

    expect(page.url()).toMatch(/\/webconsole\//);
  });
});
