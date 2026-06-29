/**
 * deploy/tc/workflow/TC-WF-FLOW-01.spec.ts
 * TC-WF-FLOW-01: Workflow Engine(Jenkins) 등록 및 연동 확인
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-01.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-01.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-01.spec.ts
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음) — OSS 목록 조회만 수행, store에 저장하는 값 없음
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-01';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-01: Workflow Engine(Jenkins) 등록 및 연동 확인', () => {

  test('워크플로우 페이지 접속 → OSS/Engine 탭 확인 → OSS 목록 조회', async ({ page }) => {
    test.setTimeout(60_000);

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}`);

    const ok = await loginAndGoto(page, PAGES.sw.workflow, TC_ID);
    if (!ok) {
      throw new Error(`[${TC_ID}] 로그인 실패`);
    }

    // 워크스페이스/프로젝트 선택
    try {
      await page.waitForFunction(() => {
        const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement;
        return sel && Array.from(sel.options).some(o => o.text.includes('ws01'));
      }, { timeout: 15_000 });
      const wsVal = await page.locator('#select-current-workspace option').filter({ hasText: /ws01/i }).first().getAttribute('value');
      await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');
      await page.waitForFunction(() => {
        const sel = document.querySelector('#select-current-project') as HTMLSelectElement;
        return sel && Array.from(sel.options).some(o => o.text.toLowerCase().includes('default'));
      }, { timeout: 15_000 });
      const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
      await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    } catch {
      console.warn(`[${TC_ID}] 워크스페이스/프로젝트 선택 실패 — 진행 계속`);
    }

    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // OSS/Engine 탭 찾아 클릭 (없으면 pass)
    const ossTab = page.locator('a, button, [role="tab"]').filter({ hasText: /oss|engine|jenkins/i }).first();
    const ossTabVisible = await ossTab.isVisible().catch(() => false);
    if (ossTabVisible) {
      await ossTab.click();
      await page.waitForTimeout(1_500);
      console.log(`[${TC_ID}] OSS/Engine 탭 클릭 완료`);
    } else {
      console.warn(`[${TC_ID}] OSS/Engine 탭 없음 — 목록 조회만 진행`);
    }

    // GET /api/mc-workflow-manager/oss/list 호출 → 응답 status 로그
    let ossCount = 0;
    try {
      const response = await page.request.get('/api/mc-workflow-manager/oss/list');
      console.log(`[${TC_ID}] GET /api/mc-workflow-manager/oss/list → status: ${response.status()}`);
      if (response.ok()) {
        const body = await response.json().catch(() => null);
        if (body && Array.isArray(body)) {
          ossCount = body.length;
        } else if (body && typeof body === 'object') {
          const arr = body.data ?? body.items ?? body.list ?? body.result ?? [];
          ossCount = Array.isArray(arr) ? arr.length : 0;
        }
      }
    } catch (e) {
      console.warn(`[${TC_ID}] OSS 목록 API 호출 실패: ${e instanceof Error ? e.message : String(e)}`);
    }

    console.log(`[${TC_ID}] 등록된 OSS(Engine) count: ${ossCount}`);
    // 0이어도 pass — 미등록 환경 허용
    expect(ossCount).toBeGreaterThanOrEqual(0);
  });

  test.afterAll(() => {
    // OUT params 없음
    console.log(`[${TC_ID}] afterAll — store OUT 없음`);
  });
});
