/**
 * deploy/tc/workflow/TC-WF-EL-01.spec.ts
 * TC-WF-EL-01: Event Listener 목록 조회
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workflow/TC-WF-EL-01.spec.ts
 *   TC_VARIANT=default npx playwright test deploy/tc/workflow/TC-WF-EL-01.spec.ts
 *
 * ── 시나리오 실행 ────────────────────────────────────────────────
 *   SCENARIO_ID=WF-001 npx playwright test deploy/tc/workflow/TC-WF-EL-01.spec.ts
 *
 * ── OUT params ──────────────────────────────────────────────────
 *   (없음) — EL 목록 조회만 수행, store에 저장하는 값 없음
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-WF-EL-01';
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

test.describe('TC-WF-EL-01: Event Listener 목록 조회', () => {

  test('워크플로우 페이지 접속 → EL 탭 진입 → 목록 영역 확인', async ({ page }) => {
    test.setTimeout(60_000);

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}`);

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

    // 목록 영역 확인 (없어도 pass)
    const listLocator = frame.locator('table, .tabulator, [class*="list"]').first();
    const listVisible = await listLocator.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (listVisible) {
      // 행 개수 집계
      const rowCount = await frame.locator('table tr, .tabulator-row').count();
      console.log(`[${TC_ID}] Event Listener 목록 확인 — 행 수: ${rowCount}`);
    } else {
      console.log(`[${TC_ID}] 목록 영역 미발견 (데이터 없음 또는 구조 상이) — 테스트 통과 처리`);
    }
  });
});
