/**
 * deploy/tc/infra/TC-INFRA-K8S-05.spec.ts
 * TC-INFRA-K8S-05: PMK KubeConfig 획득 — 브라우저 UI 테스트
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-K8S-05.spec.ts
 *   TC_VARIANT=aws npx playwright test deploy/tc/infra/TC-INFRA-K8S-05.spec.ts
 *   TC_VARIANT=ibm npx playwright test deploy/tc/infra/TC-INFRA-K8S-05.spec.ts
 *
 * ── 시나리오 실행 ─────────────────────────────────────────────────
 *   SCENARIO_ID=C7-k8s-per-csp TC_VARIANT=aws \
 *     npx playwright test deploy/tc/infra/TC-INFRA-K8S-05.spec.ts
 *
 * ── 런타임 IN params ──────────────────────────────────────────────
 *   store.require('k8sId')   — TC-INFRA-K8S-03 OUT
 *   store.require('k8sName') — TC-INFRA-K8S-03 OUT
 *
 * ── 런타임 OUT params ─────────────────────────────────────────────
 *   store.set('kubeconfig', kubeconfig 내용)
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-K8S-05';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

let copiedKubeconfig = '';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-K8S-05: PMK KubeConfig 획득', () => {

  test('UI: KubeConfig 클립보드 복사 (클러스터 선택 → KubeConfig 탭 → 복사)', async ({ page }) => {
    test.setTimeout(5 * 60_000);

    const tag = TC_ID;
    let targetK8sName = '';

    if (store) {
      targetK8sName = store.require<string>('k8sName');
      console.log(`[${tag}] store IN: k8sName=${targetK8sName}`);
    } else {
      targetK8sName = (p.clusterName as string) ?? 'pmk1';
      console.log(`[${tag}] 단독 실행 — clusterName=${targetK8sName} (variant: ${variant ?? 'base'})`);
    }

    const ok = await loginAndGoto(page, PAGES.operations.pmkWorkloads, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

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
      const wsVal = await page.locator('#select-current-workspace option')
        .filter({ hasText: /ws01/i }).first().getAttribute('value');
      await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');
      const projVal = await page.locator('#select-current-project option')
        .filter({ hasText: /default/i }).first().getAttribute('value');
      await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    } catch {}

    // 클러스터 목록 로드
    await page.locator('#pmklist-table, #k8slist-table, table').first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    // 클러스터 행 선택
    const clusterRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row')
      .filter({ hasText: targetK8sName }).first();
    if (await clusterRow.count().catch(() => 0) === 0) {
      throw new Error(`[${tag}] 클러스터 ${targetK8sName} 목록에 없음`);
    }
    await clusterRow.click();
    await page.waitForTimeout(800);

    // KubeConfig 탭 이동
    try {
      const kubeconfigTab = page.locator(
        'a[href*="kubeconfig"], a[data-bs-target*="kubeconfig"], .nav-link:has-text("KubeConfig"), .nav-link:has-text("kubeconfig")'
      ).first();
      await kubeconfigTab.waitFor({ state: 'visible', timeout: 8_000 });
      await kubeconfigTab.click();
      await page.waitForTimeout(1_000);
    } catch {
      throw new Error(`[${tag}] KubeConfig 탭 미발견`);
    }

    // KubeConfig 복사 버튼 클릭
    try {
      // 클립보드 권한 허용 (headless 모드)
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      const copyBtn = page.locator(
        'button[onclick*="kubeconfig"], button[onclick*="KubeConfig"], button:has-text("Copy"), button:has-text("클립보드")'
      ).first();
      await copyBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await copyBtn.click();
      await page.waitForTimeout(500);

      // 클립보드에서 kubeconfig 읽기
      copiedKubeconfig = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
      if (copiedKubeconfig) {
        console.log(`[${tag}] KubeConfig 복사 완료 (${copiedKubeconfig.length} bytes)`);
      } else {
        // textarea에서 직접 읽기 시도
        const textarea = page.locator('textarea').filter({ hasText: /apiVersion.*kubeconfig/i }).first();
        if (await textarea.count().catch(() => 0) > 0) {
          copiedKubeconfig = await textarea.inputValue().catch(() => '');
          console.log(`[${tag}] KubeConfig textarea 읽기 (${copiedKubeconfig.length} bytes)`);
        }
      }
    } catch (e) {
      throw new Error(`[${tag}] KubeConfig 복사 실패 — ${(e as Error).message?.slice(0, 80)}`);
    }
  });

  test.afterAll(() => {
    if (!store) return;
    store.set('kubeconfig', copiedKubeconfig);
    console.log(`[${TC_ID}] store OUT: kubeconfig (${copiedKubeconfig.length} bytes)`);
  });
});
