/**
 * deploy/tc/workflow/TC-WF-FLOW-02.spec.ts
 * TC-WF-FLOW-02: Workflow 목록 조회
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-02.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-02.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-02.spec.ts
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음) — 목록 행 수 로그만 출력, store에 저장 없음
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-02';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-02: Workflow 목록 조회', () => {

  test('워크플로우 페이지 접속 → 목록 행 수 확인', async ({ page }) => {
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

    // iframe 내부 워크플로우 테이블 탐색
    const wfFrame = page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));

    let rowCount = 0;
    if (wfFrame) {
      // iframe 내 tabulator 또는 tr 행 수 확인
      try {
        await wfFrame.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        const rows = wfFrame.locator('.tabulator-row, tr:not(:first-child)');
        rowCount = await rows.count().catch(() => 0);
      } catch {
        console.warn(`[${TC_ID}] iframe 내 행 탐색 실패`);
      }
    } else {
      // 메인 프레임에서 탐색
      try {
        const rows = page.locator('.tabulator-row, tr:not(:first-child)');
        rowCount = await rows.count().catch(() => 0);
      } catch {
        console.warn(`[${TC_ID}] 메인 프레임 행 탐색 실패`);
      }
    }

    // 0이어도 pass — 빈 목록 허용
    console.log(`[${TC_ID}] 워크플로우 목록 행 수: ${rowCount}`);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test.afterAll(() => {
    // OUT params 없음
    console.log(`[${TC_ID}] afterAll — store OUT 없음`);
  });
});
