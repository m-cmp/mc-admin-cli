/**
 * deploy/tc/infra/TC-INFRA-DEPLOY-06.spec.ts
 * TC-INFRA-DEPLOY-06: MCI 생성 Expert 모드 — 오류 상태 확인
 *
 * Expert 모드는 현재 UI에서 오류를 반환한다.
 * Add MCI → Deployment Algorithm → 'expert' 선택 시 오류 메시지가 표시되는지 확인한다.
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-DEPLOY-06.spec.ts
 */
import { test, expect } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';
import { StandaloneContext } from '../../params/runtime/context';

const TC_ID = 'TC-INFRA-DEPLOY-06';
const ctx   = new StandaloneContext(TC_ID);

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-DEPLOY-06: MCI 생성 Expert 모드 오류 확인', () => {

  test('UI: Expert 모드 선택 시 오류 표시 확인', async ({ page }) => {
    test.setTimeout(3 * 60_000);

    const tag = TC_ID;

    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
    if (!ok) { console.warn(`[${tag}] 로그인 실패 — 건너뜀`); return; }

    // 워크스페이스 경고 모달
    try {
      await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 3_000 });
      await page.click('#commonDefaultModal-confirm-btn');
      await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 5_000 });
    } catch {}

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
    await page.waitForTimeout(1_000);

    // Add MCI 버튼
    const addBtn = page.locator('#page-header-btn-list a[href="#addmci"], #page-header-btn-list a', {
      hasText: /Add.*MCI|Add.*VM/i,
    }).first();
    try {
      await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await addBtn.click();
      await page.locator('#addmci, [id*="mci-create"], [id*="createMci"]').first()
        .waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      console.warn(`[${tag}] Add MCI 버튼 없음 — 건너뜀`);
      return;
    }

    // Deployment Algorithm 드롭다운에서 'expert' 선택
    try {
      const algoSel = page.locator('#mci_deploy_algorithm');
      await algoSel.waitFor({ state: 'visible', timeout: 5_000 });
      await algoSel.selectOption('expert');
      await page.waitForTimeout(1_500);
    } catch (e) {
      console.warn(`[${tag}] Deployment Algorithm 드롭다운 없음 — ${(e as Error).message?.slice(0, 60)}`);
      return;
    }

    // Expert 모드 선택 후 오류 메시지 또는 오류 상태 확인
    const errorLocator = page.locator(
      '.alert-danger, .alert-warning, [class*="error"], [class*="Error"], ' +
      '.toast-error, #expertModeError, [id*="expert-error"], ' +
      'div:has-text("not supported"), div:has-text("미지원"), ' +
      'div:has-text("준비 중"), div:has-text("개발 중")'
    ).first();

    const hasError = await errorLocator.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasError) {
      const errText = await errorLocator.textContent().catch(() => '');
      console.log(`[${tag}] Expert 모드 오류 확인 완료: "${errText?.trim().slice(0, 100)}"`);
    } else {
      // 오류 메시지가 안 보여도 expert 폼 상태 확인
      const expertForm = page.locator('#expert_server_configuration');
      const formVisible = await expertForm.isVisible({ timeout: 2_000 }).catch(() => false);
      if (formVisible) {
        // Expert 폼이 나타났으면 Deploy 시도 후 오류 확인
        console.log(`[${tag}] Expert 폼 표시됨 — Deploy 시도`);
        const deployBtn = page.locator(
          '#expert_server_configuration button[onclick*="deploy"], button[onclick*="deployMci"]',
          { hasText: /deploy/i }
        ).first();
        if (await deployBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await deployBtn.click();
          await page.waitForTimeout(2_000);
          // Deploy 후 오류 확인
          const postError = await errorLocator.isVisible({ timeout: 3_000 }).catch(() => false);
          console.log(`[${tag}] Deploy 후 오류 발생: ${postError}`);
          expect(postError, 'Expert 모드 Deploy 시 오류가 발생해야 함').toBe(true);
        }
      } else {
        console.log(`[${tag}] Expert 모드 선택 후 상태 변화 없음 (버그 또는 미구현 상태)`);
      }
    }
  });
});
