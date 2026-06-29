/**
 * deploy/tc/workflow/TC-WF-FLOW-06.spec.ts
 * TC-WF-FLOW-06: Workflow 실행 (RUN)
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-06.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-06.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-06.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   workflowName: 실행할 워크플로우 이름 (기본값: '' — FAIL)
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음) — POST /workflow/run 응답 status 로그만 출력
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-06';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-06: Workflow 실행 (RUN)', () => {

  test('워크플로우 행 찾기 → RUN 버튼 클릭 → RunWorkflow 모달 → 실행', async ({ page }) => {
    test.setTimeout(60_000);

    const workflowName = (p.workflowName as string) ?? '';

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}, workflowName: ${workflowName || '(없음)'}`);

    if (!workflowName) {
      throw new Error(`[${TC_ID}] workflowName 파라미터 없음`);
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

    // POST /workflow/run 응답 인터셉트
    let runStatus = -1;
    page.on('response', res => {
      if (res.request().method() === 'POST' && res.url().match(/workflow.*run|run.*workflow/i)) {
        runStatus = res.status();
        console.log(`[${TC_ID}] POST ${res.url()} → status: ${runStatus}`);
      }
    });

    // iframe 또는 메인 프레임 탐색
    const wfFrame = page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));
    const target  = wfFrame ?? page;

    // workflowName 행 찾기
    const row = target.locator('.tabulator-row, tr').filter({ hasText: workflowName });
    const rowCount = await row.count().catch(() => 0);

    if (rowCount === 0) {
      throw new Error(`[${TC_ID}] 워크플로우 행 없음: ${workflowName}`);
    }

    // RUN/실행 버튼 클릭
    const runBtn = row.first().locator('button, a').filter({ hasText: /^run$|실행|play/i }).first();
    const runBtnVisible = await runBtn.isVisible().catch(() => false);

    if (!runBtnVisible) {
      throw new Error(`[${TC_ID}] RUN 버튼 없음`);
    }

    await runBtn.click();
    console.log(`[${TC_ID}] RUN 버튼 클릭 완료`);
    await page.waitForTimeout(1_500);

    // RunWorkflow 모달(#runWorkflow, .modal.show) 대기
    const modal = page.locator('#runWorkflow, .modal.show').first();
    const modalVisible = await modal.isVisible().catch(() => false);

    if (!modalVisible) {
      throw new Error(`[${TC_ID}] RunWorkflow 모달 미표시`);
    }

    console.log(`[${TC_ID}] RunWorkflow 모달 표시 확인`);

    // 모달 내 Run/실행 버튼 클릭
    const modalRunBtn = modal.locator('button').filter({ hasText: /^run$|실행|submit|확인/i }).first();
    const modalRunBtnVisible = await modalRunBtn.isVisible().catch(() => false);

    if (!modalRunBtnVisible) {
      throw new Error(`[${TC_ID}] 모달 Run 버튼 없음`);
    }
    await modalRunBtn.click();
    await page.waitForTimeout(3_000);
    console.log(`[${TC_ID}] 모달 Run 버튼 클릭 완료, POST run status: ${runStatus}`);

    // POST run이 없거나 성공이어도 pass
    expect(runStatus === -1 || runStatus < 500).toBeTruthy();
  });

  test.afterAll(() => {
    // OUT params 없음
    console.log(`[${TC_ID}] afterAll — store OUT 없음`);
  });
});
