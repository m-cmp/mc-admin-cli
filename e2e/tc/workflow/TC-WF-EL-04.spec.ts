/**
 * deploy/tc/workflow/TC-WF-EL-04.spec.ts
 * TC-WF-EL-04: Event Listener 상세 수정
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-EL-04.spec.ts
 *   EL_NAME=infra-create-el npx playwright test deploy/tc/workflow/TC-WF-EL-04.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-EL-04.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   eventListenerName : 수정할 EL 이름 (없으면 FAIL)
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음)
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-EL-04';
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

test.describe('TC-WF-EL-04: Event Listener 상세 수정', () => {

  test('EL 행 클릭 → edit 버튼 → description 수정 → 저장', async ({ page }) => {
    test.setTimeout(60_000);

    // params에서 이름 취득 (없으면 FAIL)
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

    // edit/수정 버튼 클릭
    const editBtn = row.locator('button, a').filter({ hasText: /edit|수정|편집/i }).first();
    const editOk = await editBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (!editOk) {
      // 행 자체를 클릭해 상세 패널 열기 시도
      await row.click();
      await frame.page().waitForTimeout(1000);
    } else {
      await editBtn.click();
      await frame.page().waitForTimeout(1000);
    }

    // description input 수정
    const descInput = frame.locator('input[name*="desc"], textarea[name*="desc"], input[id*="desc"], textarea[id*="desc"]').first();
    const descOk = await descInput.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!descOk) {
      throw new Error(`[${TC_ID}] description input을 찾지 못함`);
    }
    const currentDesc = await descInput.inputValue().catch(() => '');
    await descInput.fill(`${currentDesc} (수정)`);

    // PATCH /eventlistener 응답 인터셉트
    let patchStatus = 0;
    page.on('response', async (resp) => {
      if (resp.url().includes('eventlistener') && resp.request().method() === 'PATCH') {
        patchStatus = resp.status();
        console.log(`[${TC_ID}] PATCH /eventlistener → status: ${patchStatus}`);
      }
    });

    // save 버튼 클릭
    const saveBtn = frame.locator('button[type="submit"], button').filter({ hasText: /save|저장|확인|ok|update/i }).first();
    const saveOk = await saveBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (!saveOk) {
      throw new Error(`[${TC_ID}] save 버튼을 찾지 못함`);
    }
    await saveBtn.click();
    await frame.page().waitForTimeout(2000);

    console.log(`[${TC_ID}] 수정 완료 — patchStatus: ${patchStatus}`);
  });
});
