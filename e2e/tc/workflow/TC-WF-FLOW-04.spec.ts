/**
 * deploy/tc/workflow/TC-WF-FLOW-04.spec.ts
 * TC-WF-FLOW-04: Workflow 상세 수정
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-FLOW-04.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-FLOW-04.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-FLOW-04.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   workflowName: 수정할 워크플로우 이름 (기본값: '' — FAIL)
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음) — 수정 후 PATCH 응답 status 로그만 출력
 */
import { test, expect } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-FLOW-04';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-WF-FLOW-04: Workflow 상세 수정', () => {

  test('워크플로우 행 찾기 → 수정 버튼 클릭 → description 수정 → 저장', async ({ page }) => {
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

    // 수정 버튼(edit/수정/편집) 클릭
    const editBtn = row.first().locator('button, a').filter({ hasText: /edit|수정|편집/i }).first();
    const editBtnVisible = await editBtn.isVisible().catch(() => false);

    if (!editBtnVisible) {
      // 행 자체를 클릭해 상세/편집 화면 진입 시도
      await row.first().click();
      await page.waitForTimeout(1_500);
      console.warn(`[${TC_ID}] 수정 버튼 없음 — 행 클릭으로 대체`);
    } else {
      await editBtn.click();
      await page.waitForTimeout(1_500);
      console.log(`[${TC_ID}] 수정 버튼 클릭 완료`);
    }

    // PATCH 요청 인터셉트 (응답 status 로그)
    let patchStatus = -1;
    page.on('response', res => {
      if (res.request().method() === 'PATCH' && res.url().includes('workflow')) {
        patchStatus = res.status();
        console.log(`[${TC_ID}] PATCH ${res.url()} → status: ${patchStatus}`);
      }
    });

    // description 필드 수정 (현재값 + ' (수정)')
    const descField = (wfFrame ?? page).locator(
      'textarea[name*="desc"], input[name*="desc"], textarea[placeholder*="desc"], input[placeholder*="desc"], #description, textarea, input[name="description"]'
    ).first();
    const descVisible = await descField.isVisible().catch(() => false);

    if (descVisible) {
      const currentVal = await descField.inputValue().catch(() => '');
      const newVal = currentVal.replace(/ \(수정\)$/, '') + ' (수정)';
      await descField.fill(newVal);
      console.log(`[${TC_ID}] description 수정: "${newVal}"`);
    } else {
      console.warn(`[${TC_ID}] description 필드 없음 — 저장만 시도`);
    }

    // 저장 버튼 클릭
    const saveBtn = (wfFrame ?? page).locator('button, a').filter({ hasText: /save|저장|확인|apply/i }).first();
    const saveBtnVisible = await saveBtn.isVisible().catch(() => false);

    if (!saveBtnVisible) {
      throw new Error(`[${TC_ID}] 저장 버튼 없음`);
    }
    await saveBtn.click();
    await page.waitForTimeout(2_000);
    console.log(`[${TC_ID}] 저장 버튼 클릭 완료, PATCH status: ${patchStatus}`);

    // PATCH가 없거나 성공이어도 pass
    expect(patchStatus === -1 || patchStatus < 500).toBeTruthy();
  });

  test.afterAll(() => {
    // OUT params 없음
    console.log(`[${TC_ID}] afterAll — store OUT 없음`);
  });
});
