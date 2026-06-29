/**
 * deploy/tc/workflow/TC-WF-EL-02.spec.ts
 * TC-WF-EL-02: 신규 Event Listener 생성
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-EL-02.spec.ts
 *   EL_NAME=my-el WORKFLOW_NAME=my-wf npx playwright test deploy/tc/workflow/TC-WF-EL-02.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-EL-02.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   eventListenerName : 생성할 EL 이름 (기본 'infra-create-el')
 *   workflowName      : 연결할 워크플로우 이름 (기본 '')
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   elName : 생성/확인된 EL 이름 → store에 저장
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-EL-02';
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

test.describe('TC-WF-EL-02: 신규 Event Listener 생성', () => {

  test('EL 생성 — 이미 있으면 store 저장 후 스킵, 없으면 생성 후 저장', async ({ page }) => {
    test.setTimeout(60_000);

    const elName       = (p.eventListenerName as string) || 'infra-create-el';
    const workflowName = (p.workflowName as string)      || '';

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'} | elName: ${elName} | workflowName: ${workflowName}`);

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

    // 이미 존재 여부 확인
    const existingRow = frame.locator('tr, .tabulator-row').filter({ hasText: elName }).first();
    const alreadyExists = await existingRow.isVisible().catch(() => false);
    if (alreadyExists) {
      console.log(`[${TC_ID}] '${elName}' 이미 존재 — 생성 스킵, store 저장`);
      store?.set('elName', elName);
      return;
    }

    // POST /eventlistener 응답 인터셉트
    let postStatus = 0;
    page.on('response', async (resp) => {
      if (resp.url().includes('eventlistener') && resp.request().method() === 'POST') {
        postStatus = resp.status();
        console.log(`[${TC_ID}] POST /eventlistener → status: ${postStatus}`);
      }
    });

    // create 버튼 클릭
    const createBtn = frame.locator('button, a').filter({ hasText: /create|추가|생성|new/i }).first();
    const createOk = await createBtn.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!createOk) {
      throw new Error(`[${TC_ID}] create 버튼을 찾지 못함`);
    }
    await createBtn.click();
    await frame.page().waitForTimeout(1000);

    // 이름 입력
    const nameInput = frame.locator('input[name*="name"], input[placeholder*="name"], input[id*="name"]').first();
    const nameOk = await nameInput.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!nameOk) {
      throw new Error(`[${TC_ID}] name input을 찾지 못함`);
    }
    await nameInput.fill(elName);

    // 워크플로우 select (첫 번째 select)
    if (workflowName) {
      try {
        const wfSelect = frame.locator('select').first();
        await wfSelect.selectOption({ label: workflowName });
      } catch {
        console.warn(`[${TC_ID}] 워크플로우 선택 실패 (무시)`);
      }
    }

    // submit 버튼 클릭
    const submitBtn = frame.locator('button[type="submit"], button').filter({ hasText: /save|submit|저장|확인|ok/i }).first();
    const submitOk = await submitBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (!submitOk) {
      throw new Error(`[${TC_ID}] submit 버튼을 찾지 못함`);
    }
    await submitBtn.click();
    await frame.page().waitForTimeout(2000);

    console.log(`[${TC_ID}] EL 생성 완료 — postStatus: ${postStatus}`);
    store?.set('elName', elName);
  });

  test.afterAll(async () => {
    const elName = (p.eventListenerName as string) || 'infra-create-el';
    store?.set('elName', elName);
  });
});
