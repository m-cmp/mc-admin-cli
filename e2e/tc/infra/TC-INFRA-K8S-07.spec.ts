/**
 * deploy/tc/infra/TC-INFRA-K8S-07.spec.ts
 * TC-INFRA-K8S-07: PMK NodeGroup 삭제 — 브라우저 UI 테스트
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-K8S-07.spec.ts
 *   TC_VARIANT=tencent npx playwright test deploy/tc/infra/TC-INFRA-K8S-07.spec.ts
 *
 * ── 시나리오 실행 ─────────────────────────────────────────────────
 *   SCENARIO_ID=C3-k8s-per-csp TC_VARIANT=tencent \
 *     npx playwright test deploy/tc/infra/TC-INFRA-K8S-07.spec.ts
 *
 * ── 런타임 IN params ──────────────────────────────────────────────
 *   store.require('k8sId')   — TC-INFRA-K8S-03 OUT
 *   store.require('k8sName') — TC-INFRA-K8S-03 OUT
 *   p.nodeGroupName          — 삭제할 NodeGroup 이름 (기본: 'png1')
 *   p.minNodeGroupRequired   — true: CSP가 최소 1 NodeGroup 필요
 *                              → 이 TC를 건너뛰고 PMK 삭제(K8S-08)로 일괄 처리
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-K8S-07';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-K8S-07: PMK NodeGroup 삭제', () => {

  test('UI: PMK NodeGroup 삭제 (클러스터 선택 → NodeGroup 탭 → 삭제)', async ({ page }) => {
    test.setTimeout(5 * 60_000);

    const tag     = TC_ID;
    const ngName  = (p.nodeGroupName       as string)  ?? 'png1';
    const minNgRequired = !!(p.minNodeGroupRequired);

    let targetK8sId   = '';
    let targetK8sName = '';

    if (store) {
      // CSP가 최소 1 NodeGroup을 요구하는 경우 FAIL
      if (minNgRequired) {
        throw new Error(`[${tag}] minNodeGroupRequired=true — NodeGroup 개별 삭제 불가`);
      }
      targetK8sId   = store.require<string>('k8sId');
      targetK8sName = store.require<string>('k8sName');
      console.log(`[${tag}] store IN: k8sId=${targetK8sId}, k8sName=${targetK8sName}, ngName=${ngName}`);
    } else {
      targetK8sName = (p.clusterName as string) ?? 'pmk1';
      targetK8sId   = targetK8sName;
      if (minNgRequired) {
        console.log(`[${tag}] minNodeGroupRequired=true → 건너뜀`);
        return;
      }
      console.log(`[${tag}] 단독 실행 — clusterName=${targetK8sName}, ngName=${ngName}`);
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

    // 페이지 크기 최대로 확장 (페이지네이션 우회)
    await page.evaluate(() => {
      const sel = document.querySelector('#pmklist-table .tabulator-page-size, #k8slist-table .tabulator-page-size') as HTMLSelectElement | null;
      if (!sel) return;
      const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
      if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
    }).catch(() => {});
    await page.waitForTimeout(800);

    // 클러스터 행 선택
    const clusterRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row')
      .filter({ hasText: targetK8sName }).first();
    if (await clusterRow.count().catch(() => 0) === 0) {
      throw new Error(`[${tag}] 클러스터 ${targetK8sName} 목록에 없음`);
    }
    await clusterRow.click();
    await page.waitForTimeout(800);

    // NodeGroup 탭 이동
    try {
      const ngTab = page.locator(
        'a[href*="nodegroup"], a[data-bs-target*="nodegroup"], .nav-link:has-text("NodeGroup"), .nav-link:has-text("Node Group")'
      ).first();
      await ngTab.waitFor({ state: 'visible', timeout: 8_000 });
      await ngTab.click();
      await page.waitForTimeout(1_000);
    } catch {
      throw new Error(`[${tag}] NodeGroup 탭 미발견`);
    }

    // NodeGroup 행 찾기
    const ngRow = page.locator('.tabulator-row, tr').filter({ hasText: ngName }).first();
    if (await ngRow.count().catch(() => 0) === 0) {
      throw new Error(`[${tag}] NodeGroup ${ngName} 없음`);
    }
    await ngRow.click();
    await page.waitForTimeout(400);

    // 삭제 액션
    try {
      // 드롭다운 액션 버튼 또는 개별 삭제 버튼
      const dropdownBtn = page.locator('a.btn-action:has(svg.icon-tabler-chevron-down)').first();
      const hasDropdown = await dropdownBtn.isVisible({ timeout: 2_000 }).catch(() => false);
      if (hasDropdown) {
        await dropdownBtn.click();
        const deleteItem = page.locator('a.dropdown-item').filter({ hasText: /delete|삭제/i }).first();
        await deleteItem.waitFor({ state: 'visible', timeout: 3_000 });
        await deleteItem.click();
      } else {
        await page.locator('button, a').filter({ hasText: /delete.*nodegroup|nodegroup.*delete|노드그룹.*삭제/i })
          .first().click();
      }
      await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });
      await page.click('#commonDefaultModal-confirm-btn');
      await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 10_000 });
      console.log(`[${tag}] NodeGroup 삭제 완료: ${ngName}`);
    } catch (e) {
      throw new Error(`[${tag}] NodeGroup 삭제 버튼 실패 — ${(e as Error).message?.slice(0, 80)}`);
    }
  });
});
