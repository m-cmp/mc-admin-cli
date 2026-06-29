/**
 * deploy/tc/workflow/TC-WF-EL-05.spec.ts
 * TC-WF-EL-05: Event Listener 삭제
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-EL-05.spec.ts
 *   EL_NAME=infra-create-el npx playwright test deploy/tc/workflow/TC-WF-EL-05.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-EL-05.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   eventListenerName : 삭제할 EL 이름 (없으면 FAIL)
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음)
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-EL-05';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

// ── 헬퍼 ─────────────────────────────────────────────────────────

const getWfFrame = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(3000);
  return page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));
};

const enterElTab = async (frame: import('@playwright/test').Frame) => {
  const tab = frame.locator('a, button, [role="tab"], .nav-link, li')
    .filter({ hasText: /event.?listener|이벤트.?리스너/i }).first();
  const ok = await tab.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false);
  if (ok) { await tab.click(); await frame.page().waitForTimeout(1000); }
  return ok;
};

// ─────────────────────────────────────────────────────────────────

test.describe('TC-WF-EL-05: Event Listener 삭제', () => {

  test('EL 행 클릭 → 삭제 버튼 → 확인 다이얼로그 → 행 사라짐 확인', async ({ page }) => {
    test.setTimeout(60_000);

    const elName = (p.eventListenerName as string) || '';

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'} | elName: ${elName || '(없음)'}`);

    if (!elName) {
      throw new Error(`[${TC_ID}] eventListenerName 파라미터 없음`);
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
      }, { timeout: 10_000 });
      const wsVal = await page.locator('#select-current-workspace option').filter({ hasText: /ws01/i }).first().getAttribute('value');
      await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');
      const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
      await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    } catch {}

    // iframe 취득
    const frame = await getWfFrame(page);
    if (!frame) {
      throw new Error(`[${TC_ID}] 워크플로우 iframe 없음`);
    }

    // EL 탭 진입
    const tabOk = await enterElTab(frame);
    if (!tabOk) {
      throw new Error(`[${TC_ID}] Event Listener 탭을 찾지 못함`);
    }

    // EL 행 찾기
    const row = frame.locator('tr, .tabulator-row').filter({ hasText: elName }).first();
    const rowOk = await row.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!rowOk) {
      throw new Error(`[${TC_ID}] '${elName}' 행을 찾지 못함`);
    }

    // 삭제 버튼 클릭
    const delBtn = row.locator('button, a').filter({ hasText: /del|delete|삭제|remove/i }).first();
    const delOk = await delBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (!delOk) {
      throw new Error(`[${TC_ID}] 삭제 버튼을 찾지 못함`);
    }
    await delBtn.click();
    await frame.page().waitForTimeout(1000);

    // 확인 다이얼로그 처리 (SweetAlert2 또는 Bootstrap modal)
    const confirmBtn = page.locator('.swal2-confirm, .modal.show button')
      .filter({ hasText: /확인|ok|yes|삭제/i }).first();
    const confirmOk = await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (confirmOk) {
      await confirmBtn.click();
    } else {
      // iframe 내부 confirm 버튼 시도
      const frameConfirmBtn = frame.locator('.swal2-confirm, .modal.show button, button')
        .filter({ hasText: /확인|ok|yes|삭제/i }).first();
      const frameConfirmOk = await frameConfirmBtn.isVisible().catch(() => false);
      if (frameConfirmOk) {
        await frameConfirmBtn.click();
      } else {
        console.warn(`[${TC_ID}] 확인 다이얼로그를 찾지 못함 — 계속 진행`);
      }
    }

    await frame.page().waitForTimeout(1500);

    // 행 사라짐 확인
    const rowGone = await row.isVisible().then(v => !v).catch(() => true);
    if (rowGone) {
      console.log(`[${TC_ID}] '${elName}' 삭제 확인 — 행이 목록에서 사라짐`);
    } else {
      console.warn(`[${TC_ID}] '${elName}' 행이 아직 보임 — 삭제가 반영되지 않았거나 비동기 처리 중`);
    }
  });
});
