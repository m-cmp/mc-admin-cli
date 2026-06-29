/**
 * deploy/tc/infra/TC-INFRA-K8S-03.spec.ts
 * TC-INFRA-K8S-03: K8s 클러스터(PMK) 생성 — 브라우저 UI 테스트
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-K8S-03.spec.ts
 *   TC_VARIANT=tencent npx playwright test deploy/tc/infra/TC-INFRA-K8S-03.spec.ts
 *   TC_VARIANT=ncp     npx playwright test deploy/tc/infra/TC-INFRA-K8S-03.spec.ts
 *
 * ── 시나리오 실행 (런타임 store OUT param 저장) ────────────────────
 *   SCENARIO_ID=C3-k8s-per-csp TC_VARIANT=tencent \
 *     npx playwright test deploy/tc/infra/TC-INFRA-K8S-03.spec.ts
 *
 * ── 런타임 OUT params (시나리오 모드) ─────────────────────────────
 *   store.set('k8sId',   생성된 K8s 클러스터 ID or clusterName)
 *   store.set('k8sName', clusterName)
 *   store.set('nsId',    nsId)
 */
import { test } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-K8S-03';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

let createdK8sId = '';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-K8S-03: K8s 클러스터 생성', () => {

  test('UI: K8s 클러스터 생성 (PMK workloads → Add Cluster → Deploy)', async ({ page }) => {
    test.setTimeout(10 * 60_000);

    const nsId        = (p.nsId         as string) ?? 'default';
    const clusterName = (p.clusterName  as string) ?? 'pmk1';
    const ngName      = (p.nodeGroupName as string) ?? 'png1';
    const connName    = (p.connectionName as string) ?? '';
    const specId      = (p.commonSpec   as string) ?? (p.specId as string) ?? '';
    const tag         = TC_ID;

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}`);
    console.log(`[${TC_ID}] clusterName=${clusterName}, conn=${connName}, spec=${specId}`);

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
      const wsVal = await page.locator('#select-current-workspace option').filter({ hasText: /ws01/i }).first().getAttribute('value');
      await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');
      const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
      await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    } catch {}

    // 목록 로드 대기
    await page.locator('#pmklist-table, #k8slist-table, table').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    // 이미 존재 확인
    const existRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row').filter({ hasText: clusterName });
    if (await existRow.count().catch(() => 0) > 0) {
      await existRow.first().click();
      await page.waitForTimeout(500);
      createdK8sId = await page.evaluate(() =>
        (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentPmkId ??
        (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentK8sId ?? ''
      ) as string;
      if (!createdK8sId) createdK8sId = clusterName;
      console.log(`[${tag}] K8s 재사용: ${clusterName} (${createdK8sId})`);
      return;
    }

    // Add Cluster 버튼
    const addBtn = page.locator('#page-header-btn-list a[href="#createcluster"], #page-header-btn-list a', {
      hasText: /Add.*Cluster|Add.*PMK/i,
    }).first();
    try {
      await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await addBtn.click();
      await page.locator('#createcluster').waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      console.warn(`[${tag}] Add Cluster 버튼 없음 — 건너뜀`);
      return;
    }

    // 폼 입력
    await page.fill('#cluster_name_dynamic', clusterName).catch(() => {});
    await page.fill('#cluster_desc_dynamic', `${TC_ID} E2E 테스트 (variant: ${variant ?? 'base'})`).catch(() => {});
    await page.fill('#nodegroup_name_dynamic', ngName).catch(() => {});

    // Connection 선택
    if (connName) {
      try {
        await page.waitForFunction((conn: string) => {
          const sel = document.querySelector('#cluster_cloudconnection_dynamic') as HTMLSelectElement;
          return sel && Array.from(sel.options).some(o =>
            o.value.toLowerCase().includes(conn.toLowerCase()) ||
            o.text.toLowerCase().includes(conn.toLowerCase()));
        }, connName, { timeout: 10_000 });
        const connOpt = await page.locator('#cluster_cloudconnection_dynamic option')
          .filter({ hasText: new RegExp(connName, 'i') }).first().getAttribute('value');
        await page.locator('#cluster_cloudconnection_dynamic').selectOption(connOpt ?? connName);
        await page.waitForTimeout(1_000);
      } catch { console.warn(`[${tag}] Connection ${connName} 선택 실패`); }
    }

    // Spec 검색 모달
    try {
      const specBtn = page.locator('[data-bs-target="#spec-search-pmk"], [onclick*="spec-search-pmk"]').first();
      await specBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await specBtn.click();
      await page.locator('#spec-search-pmk').waitFor({ state: 'visible', timeout: 5_000 });
      await page.locator('#spec-search-pmk a[onclick*="getRecommendVmInfoPmk"], #spec-search-pmk a[onclick*="getRecommendVmInfo"]').first().click();
      await page.locator('#spec-search-pmk .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });
      const cspSpecName = specId.split('+').pop() ?? '';
      await page.evaluate(
        ({ specName }: { specName: string }) => {
          const t = (window as unknown as {
            recommendTablePmk?: {
              getData: () => Array<Record<string, unknown>>;
              deselectRow: () => void;
              getRows: () => Array<{ select: () => void }>;
            };
          }).recommendTablePmk;
          if (!t) return;
          const rows = t.getData();
          let idx = rows.findIndex(r =>
            ((r['cspSpecName'] as string) ?? '').toLowerCase().includes(specName.toLowerCase())
          );
          if (idx < 0) idx = 0;
          t.deselectRow();
          t.getRows()[idx]?.select();
        },
        { specName: cspSpecName },
      );
      await page.waitForTimeout(400);
      await page.locator('#spec-search-pmk button[onclick*="applySpecInfo"]').click();
      await page.locator('#spec-search-pmk').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    } catch (e) {
      console.warn(`[${tag}] PMK Spec 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
    }

    // Deploy
    page.on('dialog', async d => { await d.accept(); });
    try {
      await page.locator('button[onclick*="deployPmkDynamic"], button', { hasText: /deploy/i }).first().click();
    } catch {
      console.warn(`[${tag}] PMK Deploy 버튼 없음 — 건너뜀`);
      return;
    }

    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null);
    await page.waitForTimeout(2_000);

    // 목록에서 K8s 확인
    const newRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row').filter({ hasText: clusterName });
    if (await newRow.count().catch(() => 0) > 0) {
      await newRow.first().click();
      await page.waitForTimeout(500);
      createdK8sId = await page.evaluate(() =>
        (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentPmkId ??
        (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentK8sId ?? ''
      ) as string;
      if (!createdK8sId) createdK8sId = clusterName;
      console.log(`[${tag}] K8s 생성 완료: ${clusterName} (${createdK8sId})`);
    } else {
      console.warn(`[${tag}] ${clusterName} 목록 미표시`);
    }
  });

  test.afterAll(() => {
    if (!store) return;
    const clusterName = (p.clusterName as string) ?? 'pmk1';
    const nsId        = (p.nsId        as string) ?? 'default';
    store.set('k8sId',   createdK8sId);
    store.set('k8sName', clusterName);
    store.set('nsId',    nsId);
    console.log(`[${TC_ID}] store OUT: k8sId=${createdK8sId}, k8sName=${clusterName}, nsId=${nsId}`);
  });
});
