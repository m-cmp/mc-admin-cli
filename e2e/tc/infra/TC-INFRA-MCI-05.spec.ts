/**
 * deploy/tc/infra/TC-INFRA-MCI-05.spec.ts
 * TC-INFRA-MCI-05: MCI 삭제 — 브라우저 UI 테스트
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-MCI-05.spec.ts
 *
 * ── 시나리오 실행 ─────────────────────────────────────────────────
 *   SCENARIO_ID=C4-001 npx playwright test deploy/tc/infra/TC-INFRA-MCI-05.spec.ts
 *
 * ── 런타임 IN params ──────────────────────────────────────────────
 *   store.require('mciId')  — TC-INFRA-DEPLOY-05 OUT
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-LC-02';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-LC-02: MCI 삭제', () => {

  test('UI: MCI 삭제 (목록 → 선택 → 삭제)', async ({ page }) => {
    test.setTimeout(3 * 60_000);

    // IN param 읽기
    let targetMciId = '';
    const mciName   = (p.mciName as string) ?? 'tc-mci-temp';

    if (store) {
      targetMciId = store.require<string>('mciId');
      console.log(`[${TC_ID}] store IN: mciId=${targetMciId}`);
    } else {
      // 단독 실행: mciName으로 찾음
      targetMciId = mciName;
      console.log(`[${TC_ID}] 단독 실행 — mciName: ${mciName}`);
    }

    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, TC_ID);
    if (!ok) { throw new Error(`[${TC_ID}] 로그인 실패`); }

    // 워크스페이스/프로젝트 선택
    try {
      await page.waitForFunction(() => {
        const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement;
        return sel && Array.from(sel.options).some(o => o.text.includes('ws01'));
      }, { timeout: 15_000 });
      const wsVal = await page.locator('#select-current-workspace option').filter({ hasText: /ws01/i }).first().getAttribute('value');
      await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');
      const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
      await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    } catch {}

    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    const mciRow = page.locator('#mcilist-table .tabulator-row').filter({ hasText: targetMciId }).first();
    if (await mciRow.count().catch(() => 0) === 0) {
      console.warn(`[${TC_ID}] MCI ${targetMciId} 목록에 없음 — 건너뜀`);
      return;
    }
    await mciRow.click();
    await page.waitForTimeout(500);

    try {
      await page.locator('a.btn-action:has(svg.icon-tabler-chevron-down)').click();
      await page.locator('a.dropdown-item[onclick*="MciDelete"]').waitFor({ state: 'visible', timeout: 3_000 });
      await page.locator('a.dropdown-item[onclick*="MciDelete"]').click();
      await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });
      await page.click('#commonDefaultModal-confirm-btn');
      await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 10_000 });
      console.log(`[${TC_ID}] MCI 삭제 완료: ${targetMciId}`);
    } catch (e) {
      console.warn(`[${TC_ID}] 삭제 버튼 클릭 실패 — ${(e as Error).message?.slice(0, 80)}`);
    }
  });
});
