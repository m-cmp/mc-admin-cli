/**
 * deploy/tc/workflow/TC-WF-FLOW-05.spec.ts
 * TC-WF-FLOW-05: Workflow 삭제
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-05.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-05.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-05.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   workflowName: 삭제할 워크플로우 이름 (기본값: '' — FAIL)
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음)
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-05';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-05: Workflow 삭제', () => {

  test('워크플로우 행 찾기 → 삭제 버튼 클릭 → 확인 → 행 사라짐 확인', async ({ page }) => {
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

    // iframe 또는 메인 프레임 탐색
    const wfFrame = page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));
    const target  = wfFrame ?? page;

    // workflowName 행 찾기
    const row = target.locator('.tabulator-row, tr').filter({ hasText: workflowName });
    const rowCount = await row.count().catch(() => 0);

    if (rowCount === 0) {
      throw new Error(`[${TC_ID}] 워크플로우 행 없음: ${workflowName}`);
    }

    // DEL/삭제 버튼 클릭
    const delBtn = row.first().locator('button, a').filter({ hasText: /del|delete|삭제|remove/i }).first();
    const delBtnVisible = await delBtn.isVisible().catch(() => false);

    if (!delBtnVisible) {
      throw new Error(`[${TC_ID}] 삭제 버튼 없음`);
    }

    await delBtn.click();
    console.log(`[${TC_ID}] 삭제 버튼 클릭 완료`);
    await page.waitForTimeout(1_500);

    // 확인 다이얼로그 클릭 (.swal2-confirm 또는 .modal.show button)
    const swal2Confirm = page.locator('.swal2-confirm').first();
    const swal2Visible = await swal2Confirm.isVisible().catch(() => false);

    if (swal2Visible) {
      await swal2Confirm.click();
      console.log(`[${TC_ID}] swal2 확인 버튼 클릭`);
    } else {
      // modal.show 내 확인 버튼
      const modalConfirm = page.locator('.modal.show button').filter({ hasText: /confirm|ok|확인|yes|삭제/i }).first();
      const modalVisible = await modalConfirm.isVisible().catch(() => false);
      if (modalVisible) {
        await modalConfirm.click();
        console.log(`[${TC_ID}] 모달 확인 버튼 클릭`);
      } else {
        // native dialog 처리
        page.once('dialog', async d => { await d.accept(); });
        console.warn(`[${TC_ID}] 확인 UI 없음 — native dialog 대기`);
      }
    }

    await page.waitForTimeout(3_000);

    // 삭제 후 행 없어짐 확인
    const rowAfter = target.locator('.tabulator-row, tr').filter({ hasText: workflowName });
    const rowAfterCount = await rowAfter.count().catch(() => 0);

    console.log(`[${TC_ID}] 삭제 후 행 수: ${rowAfterCount} (0이어야 성공)`);
    expect(rowAfterCount).toBe(0);
  });

  test.afterAll(() => {
    // OUT params 없음
    console.log(`[${TC_ID}] afterAll — store OUT 없음`);
  });
});
