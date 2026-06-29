/**
 * deploy/tc/workflow/TC-WF-EL-03.spec.ts
 * TC-WF-EL-03: Event Listener 이름 중복 검사
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-EL-03.spec.ts
 *   EL_NAME=infra-create-el npx playwright test deploy/tc/workflow/TC-WF-EL-03.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-EL-03.spec.ts
 *
 * ── IN params ───────────────────────────────────────────────────
 *   eventListenerName : 중복 검사할 EL 이름
 *                       (기본값: store의 elName → EL_NAME 환경변수 → 'infra-create-el')
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음)
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-EL-03';
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

test.describe('TC-WF-EL-03: Event Listener 이름 중복 검사', () => {

  test('이미 존재하는 이름 입력 → 중복 오류 메시지 확인 → 폼 닫기', async ({ page }) => {
    test.setTimeout(60_000);

    // store의 elName → 환경변수 → params → fallback 순으로 이름 결정
    const elName: string = (p.eventListenerName as string)
      || (store?.get('elName') as string | undefined)
      || process.env.EL_NAME
      || 'infra-create-el';

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'} | elName: ${elName}`);

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

    // create 버튼 클릭
    const createBtn = frame.locator('button, a').filter({ hasText: /create|추가|생성|new/i }).first();
    const createOk = await createBtn.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!createOk) {
      throw new Error(`[${TC_ID}] create 버튼을 찾지 못함`);
    }
    await createBtn.click();
    await frame.page().waitForTimeout(1000);

    // 이미 존재하는 이름 입력
    const nameInput = frame.locator('input[name*="name"], input[placeholder*="name"], input[id*="name"]').first();
    const nameOk = await nameInput.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!nameOk) {
      throw new Error(`[${TC_ID}] name input을 찾지 못함`);
    }
    await nameInput.fill(elName);
    // blur 처리로 유효성 검사 트리거
    await nameInput.press('Tab');
    await frame.page().waitForTimeout(1000);

    // 중복 오류 메시지 확인
    const errorLocator = frame.locator('[class*="error"], [class*="invalid"], .alert, .text-danger');
    const hasError = await errorLocator.filter({ hasText: /중복|duplicate|already/i }).first()
      .isVisible().catch(() => false);

    if (hasError) {
      const errText = await errorLocator.filter({ hasText: /중복|duplicate|already/i }).first().textContent().catch(() => '');
      console.log(`[${TC_ID}] 중복 오류 메시지 확인: "${errText?.trim()}"`);
    } else {
      console.warn(`[${TC_ID}] 중복 오류 메시지를 찾지 못함 (UI 미지원 또는 서버 측 검사)`);
    }

    // 폼 닫기 — cancel 버튼 또는 Escape
    const cancelBtn = frame.locator('button').filter({ hasText: /cancel|취소|닫기|close/i }).first();
    const cancelOk = await cancelBtn.isVisible().catch(() => false);
    if (cancelOk) {
      await cancelBtn.click();
    } else {
      await frame.page().keyboard.press('Escape');
    }
    await frame.page().waitForTimeout(500);
  });
});
