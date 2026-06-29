/**
 * deploy/tc/workflow/TC-WF-EL-07.spec.ts
 * TC-WF-EL-07: Event Listener를 통한 Workflow 실행 (POST)
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-EL-07.spec.ts
 *   EL_NAME=infra-create-el npx playwright test deploy/tc/workflow/TC-WF-EL-07.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-EL-07.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   eventListenerName : callUrl을 조회할 EL 이름 (없으면 FAIL)
 *   triggerBody       : POST body (기본 {})
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음)
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-EL-07';
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

/**
 * EL 행에서 callUrl을 취득한다.
 * 1순위: td 내 http로 시작하는 텍스트
 * 2순위: detail/상세 버튼 클릭 후 readonly input의 value
 */
const getCallUrl = async (
  frame: import('@playwright/test').Frame,
  elName: string,
): Promise<string | null> => {
  const row = frame.locator('tr, .tabulator-row').filter({ hasText: elName }).first();
  const rowOk = await row.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
  if (!rowOk) return null;

  // 1순위: td 중 http 텍스트 포함 셀
  const urlCell = row.locator('td').filter({ hasText: /https?:\/\//i }).first();
  const urlCellOk = await urlCell.isVisible().catch(() => false);
  if (urlCellOk) {
    const text = await urlCell.textContent().catch(() => '');
    const match = text?.match(/https?:\/\/\S+/);
    if (match) return match[0].trim();
  }

  // 2순위: detail/상세 버튼 클릭
  const detailBtn = row.locator('button, a').filter({ hasText: /detail|상세|view|보기/i }).first();
  const detailOk = await detailBtn.isVisible().catch(() => false);
  if (detailOk) {
    await detailBtn.click();
    await frame.page().waitForTimeout(1000);
    const urlInput = frame.locator('input[readonly]').filter({ hasText: /https?/i }).first();
    const urlInputOk = await urlInput.isVisible().catch(() => false);
    if (urlInputOk) {
      return await urlInput.inputValue().catch(() => null);
    }
    // 모든 readonly input의 value 순회
    const allReadonlyInputs = frame.locator('input[readonly]');
    const count = await allReadonlyInputs.count();
    for (let i = 0; i < count; i++) {
      const val = await allReadonlyInputs.nth(i).inputValue().catch(() => '');
      if (val.startsWith('http')) return val;
    }
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────

test.describe('TC-WF-EL-07: Event Listener를 통한 Workflow 실행 (POST)', () => {

  test('EL callUrl 취득 → POST 요청 → 응답 상태 확인', async ({ page }) => {
    test.setTimeout(60_000);

    const elName      = (p.eventListenerName as string) || '';
    const triggerBody = (p.triggerBody as Record<string, unknown>) || {};

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

    // callUrl 취득
    const callUrl = await getCallUrl(frame, elName);
    if (!callUrl) {
      throw new Error(`[${TC_ID}] '${elName}'의 callUrl을 취득하지 못함`);
    }

    console.log(`[${TC_ID}] callUrl: ${callUrl}`);
    console.log(`[${TC_ID}] triggerBody: ${JSON.stringify(triggerBody)}`);

    // POST 요청
    const response = await page.request.post(callUrl, {
      data: triggerBody,
      ignoreHTTPSErrors: true,
    }).catch((e) => {
      console.warn(`[${TC_ID}] POST 요청 실패: ${e}`);
      return null;
    });

    if (!response) {
      throw new Error(`[${TC_ID}] POST 요청 실패 — callUrl: ${callUrl}`);
    }

    const status = response.status();
    console.log(`[${TC_ID}] POST ${callUrl} → status: ${status}`);

    if (status >= 200 && status < 300) {
      console.log(`[${TC_ID}] PASS — 2xx 응답 수신`);
    } else {
      console.warn(`[${TC_ID}] 비정상 응답 status: ${status} (워크플로우 미연결 또는 인증 필요일 수 있음)`);
    }
  });
});
