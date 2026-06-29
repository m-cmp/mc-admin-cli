/**
 * deploy/tc/workflow/TC-WF-FLOW-03.spec.ts
 * TC-WF-FLOW-03: 신규 Workflow 생성 (정의 확인)
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-03.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-03.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-03.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   workflowName: 확인할 워크플로우 이름 (기본값: '' — FAIL)
 *
 * ── OUT params (시나리오 모드) ──────────────────────────────────
 *   store.set('workflowName', workflowName) — 발견된 경우
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-03';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

let foundWorkflowName = '';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-03: 신규 Workflow 생성 (정의 확인)', () => {

  test('워크플로우 페이지 접속 → 지정된 워크플로우 행 존재 확인', async ({ page }) => {
    test.setTimeout(60_000);

    const workflowName = (p.workflowName as string) ?? '';

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}, workflowName: ${workflowName || '(없음)'}`);

    // workflowName이 없으면 FAIL
    if (!workflowName) {
      throw new Error(`[${TC_ID}] workflowName 파라미터 없음 — params 설정 확인`);
    }

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

    // iframe 또는 메인 프레임에서 행 탐색
    const wfFrame = page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));
    const target  = wfFrame ?? page;

    const row = target.locator('.tabulator-row, tr').filter({ hasText: workflowName });
    const rowCount = await row.count().catch(() => 0);

    expect(rowCount).toBeGreaterThan(0);
    foundWorkflowName = workflowName;
    console.log(`[${TC_ID}] 워크플로우 행 발견: ${workflowName} (${rowCount}개)`);
  });

  test.afterAll(() => {
    if (!store) return;
    if (foundWorkflowName) {
      store.set('workflowName', foundWorkflowName);
      console.log(`[${TC_ID}] store OUT: workflowName=${foundWorkflowName}`);
    } else {
      console.warn(`[${TC_ID}] workflowName 미발견 — store OUT 없음`);
    }
  });
});
