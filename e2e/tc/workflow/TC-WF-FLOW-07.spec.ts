/**
 * deploy/tc/workflow/TC-WF-FLOW-07.spec.ts
 * TC-WF-FLOW-07: Workflow 로그 모달 표시
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-07.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-07.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-07.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   workflowName: 로그를 볼 워크플로우 이름 (기본값: '' — 첫 번째 행 사용)
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음) — 로그 모달 표시 여부 로그만 출력
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-07';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

// iframe 내 워크플로우 프레임을 탐색하는 헬퍼
const getWfIframe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(3000);
  return page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));
};

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-07: Workflow 로그 모달 표시', () => {

  test('워크플로우 행 찾기 → LOG 버튼 클릭 → 로그 모달 표시 확인 → 닫기', async ({ page }) => {
    test.setTimeout(60_000);

    const workflowName = (p.workflowName as string) ?? '';

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}, workflowName: ${workflowName || '(없음 — 첫 번째 행 사용)'}`);

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

    // iframe 탐색 (getWfIframe 헬퍼 사용 — 3초 대기 포함)
    const wfFrame = await getWfIframe(page);
    const target  = wfFrame ?? page;

    // workflowName 행 또는 첫 번째 행 탐색
    let targetRow;
    if (workflowName) {
      const namedRow = target.locator('.tabulator-row, tr').filter({ hasText: workflowName });
      const namedCount = await namedRow.count().catch(() => 0);
      if (namedCount > 0) {
        targetRow = namedRow.first();
        console.log(`[${TC_ID}] 지정된 워크플로우 행 사용: ${workflowName}`);
      } else {
        console.warn(`[${TC_ID}] 지정된 워크플로우 행 없음 — 첫 번째 행으로 fallback`);
      }
    }

    if (!targetRow) {
      const firstRow = target.locator('.tabulator-row, tr:not(:first-child)').first();
      const firstVisible = await firstRow.isVisible().catch(() => false);
      if (!firstVisible) {
        throw new Error(`[${TC_ID}] 워크플로우 행 없음`);
      }
      targetRow = firstRow;
      console.log(`[${TC_ID}] 첫 번째 행 사용`);
    }

    // LOG/로그/기록 버튼 클릭
    const logBtn = targetRow.locator('button, a').filter({ hasText: /log|로그|기록|history/i }).first();
    const logBtnVisible = await logBtn.isVisible().catch(() => false);

    if (!logBtnVisible) {
      throw new Error(`[${TC_ID}] LOG 버튼 없음`);
    }

    await logBtn.click();
    console.log(`[${TC_ID}] LOG 버튼 클릭 완료`);
    await page.waitForTimeout(2_000);

    // 모달(.modal.show) 표시 확인
    const modal = page.locator('.modal.show').first();
    const modalVisible = await modal.isVisible().catch(() => false);

    if (!modalVisible) {
      throw new Error(`[${TC_ID}] 로그 모달 미표시`);
    }

    console.log(`[${TC_ID}] 로그 모달 표시 확인`);
    expect(modalVisible).toBe(true);

    // 로그 내용 영역(pre, code, [class*="log"]) 확인
    const logContent = modal.locator('pre, code, [class*="log"]').first();
    const logContentVisible = await logContent.isVisible().catch(() => false);

    if (logContentVisible) {
      const logText = await logContent.innerText().catch(() => '');
      console.log(`[${TC_ID}] 로그 내용 영역 확인 (길이: ${logText.length}자)`);
    } else {
      console.warn(`[${TC_ID}] 로그 내용 영역(pre/code/[class*=log]) 미확인 — 모달은 표시됨`);
    }

    // 모달 닫기 (close/닫기 버튼 또는 Escape)
    const closeBtn = modal.locator('button').filter({ hasText: /close|닫기|dismiss|cancel/i }).first();
    const closeBtnAlt = modal.locator('button.btn-close, .modal-header button, [data-bs-dismiss="modal"]').first();

    const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
    const closeAltVisible = await closeBtnAlt.isVisible().catch(() => false);

    if (closeBtnVisible) {
      await closeBtn.click();
      console.log(`[${TC_ID}] 닫기 버튼 클릭`);
    } else if (closeAltVisible) {
      await closeBtnAlt.click();
      console.log(`[${TC_ID}] 모달 닫기 버튼(alt) 클릭`);
    } else {
      await page.keyboard.press('Escape');
      console.log(`[${TC_ID}] Escape 키로 모달 닫기`);
    }

    await page.waitForTimeout(1_000);
    console.log(`[${TC_ID}] 로그 모달 닫기 완료`);
  });

  test.afterAll(() => {
    // OUT params 없음
    console.log(`[${TC_ID}] afterAll — store OUT 없음`);
  });
});
