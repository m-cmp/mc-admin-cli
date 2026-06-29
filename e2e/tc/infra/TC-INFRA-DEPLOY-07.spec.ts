/**
 * deploy/tc/infra/TC-INFRA-DEPLOY-07.spec.ts
 * TC-INFRA-DEPLOY-07: MCI 서버 추가 (Add Server — Expert 모드)
 *
 * 기존 MCI를 선택한 후 MCI Info Default Tab의 Add Server 버튼을 클릭하고
 * Deployment Algorithm을 'expert'로 전환한 뒤 + VM 버튼으로 VM 정보를 입력한다.
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-DEPLOY-07.spec.ts
 *   TC_VARIANT=gcp npx playwright test deploy/tc/infra/TC-INFRA-DEPLOY-07.spec.ts
 *
 * ── 시나리오 실행 ─────────────────────────────────────────────────
 *   SCENARIO_ID=C4-001 TC_VARIANT=aws \
 *     npx playwright test deploy/tc/infra/TC-INFRA-DEPLOY-07.spec.ts
 *
 * ── 런타임 IN params (시나리오 모드) ─────────────────────────────
 *   store.require('mciId')   — TC-INFRA-DEPLOY-05 OUT
 *   store.require('mciName') — TC-INFRA-DEPLOY-05 OUT
 *
 * ── 런타임 OUT params ─────────────────────────────────────────────
 *   store.set('subGroupId',   추가된 SubGroup ID)
 *   store.set('subGroupName', subGroupName)
 */
import { test } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-DEPLOY-07';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

let createdSubGroupId = '';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-DEPLOY-07: MCI 서버 추가 (Expert 모드)', () => {

  test('UI: Add Server → Expert 모드 → +VM → Deploy', async ({ page }) => {
    test.setTimeout(8 * 60_000);

    const nsId         = (p.nsId         as string) ?? 'default';
    const subGroupName = (p.subGroupName as string) ?? 'sg-exp1';
    const provider     = (p.provider     as string) ?? 'aws';
    const region       = (p.region       as string) ?? 'ap-northeast-2';
    const connName     = (p.connectionName as string) ?? 'aws-ap-northeast-2';
    const specId       = (p.commonSpec   as string) ?? '';
    const subGroupSize = (p.subGroupSize as string) ?? '1';
    const tag          = TC_ID;

    // 시나리오 모드: 이전 MCI 생성 결과 참조
    let targetMciName = (p.mciName as string) ?? 'mci11';
    if (store) {
      try {
        targetMciName = store.require<string>('mciName');
      } catch { /* 시나리오에 따라 없을 수 있음 */ }
    }

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}`);
    console.log(`[${TC_ID}] mciName=${targetMciName}, provider=${provider}, conn=${connName}`);

    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
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

    // MCI 목록 로드
    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    // 대상 MCI 행 선택
    const mciRow = page.locator('#mcilist-table .tabulator-row').filter({ hasText: targetMciName }).first();
    if (await mciRow.count().catch(() => 0) === 0) {
      throw new Error(`[${tag}] MCI ${targetMciName} 목록에 없음`);
    }
    await mciRow.click();
    await page.waitForTimeout(1_000);

    // MCI Info Default Tab에서 Add Server 버튼
    try {
      // Default Tab 활성화 (이미 활성화되어 있는 경우 생략)
      const defaultTab = page.locator(
        '[data-bs-target*="default"], .nav-link:has-text("Default"), .nav-link:first-child'
      ).first();
      if (await defaultTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await defaultTab.click();
        await page.waitForTimeout(500);
      }
    } catch {}

    const addServerBtn = page.locator(
      'button[onclick*="addServer"], button[onclick*="addSubGroup"], ' +
      'a[onclick*="addServer"], a[onclick*="addSubGroup"], ' +
      'button:has-text("Add Server"), a:has-text("Add Server")'
    ).first();
    try {
      await addServerBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await addServerBtn.click();
      await page.waitForTimeout(800);
    } catch {
      throw new Error(`[${tag}] Add Server 버튼 없음`);
    }

    // Deployment Algorithm → Expert 선택
    try {
      const algoSel = page.locator('#mci_deploy_algorithm, [id*="deploy_algorithm"]').first();
      await algoSel.waitFor({ state: 'visible', timeout: 5_000 });
      await algoSel.selectOption('expert');
      await page.waitForTimeout(800);
      console.log(`[${tag}] Expert 모드 전환`);
    } catch (e) {
      throw new Error(`[${tag}] Deployment Algorithm 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
    }

    // + VM 버튼 클릭 (Expert 폼에서 VM 추가 행)
    try {
      const addVmBtn = page.locator(
        'button[onclick*="addVm"], button[onclick*="addVM"], ' +
        'button:has-text("+ VM"), button:has-text("+VM"), ' +
        'a:has-text("+ VM"), a:has-text("Add VM")'
      ).first();
      await addVmBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await addVmBtn.click();
      await page.waitForTimeout(800);
      console.log(`[${tag}] + VM 버튼 클릭`);
    } catch (e) {
      throw new Error(`[${tag}] + VM 버튼 없음 — ${(e as Error).message?.slice(0, 60)}`);
    }

    // SubGroup 이름 입력
    await page.fill('[id*="subgroup_name"], [id*="sg_name"], [name*="subGroupName"]', subGroupName)
      .catch(() => {});

    // Provider 선택
    try {
      const provSel = page.locator('[id*="vm_provider"], [id*="expert"][id*="provider"]').first();
      if (await provSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const provOpt = await provSel.locator('option')
          .filter({ hasText: new RegExp(provider, 'i') }).first().getAttribute('value');
        await provSel.selectOption(provOpt ?? provider);
        await page.waitForTimeout(800);
      }
    } catch { console.warn(`[${tag}] Provider 선택 실패`); }

    // Region 선택
    try {
      const regionSel = page.locator('[id*="vm_region"], [id*="expert"][id*="region"]').first();
      if (await regionSel.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await page.waitForFunction((reg: string) => {
          const sel = document.querySelector('[id*="vm_region"], [id*="expert"][id*="region"]') as HTMLSelectElement;
          return sel && Array.from(sel.options).some(o =>
            o.value.toLowerCase().includes(reg.toLowerCase()) ||
            o.text.toLowerCase().includes(reg.toLowerCase()));
        }, region, { timeout: 8_000 }).catch(() => {});
        const regionOpt = await regionSel.locator('option')
          .filter({ hasText: new RegExp(region, 'i') }).first().getAttribute('value');
        await regionSel.selectOption(regionOpt ?? region).catch(() => {});
        await page.waitForTimeout(800);
      }
    } catch { console.warn(`[${tag}] Region 선택 실패`); }

    // Connection 선택
    if (connName) {
      try {
        const connSel = page.locator('[id*="vm_connection"], [id*="expert"][id*="connection"]').first();
        if (await connSel.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await page.waitForFunction((conn: string) => {
            const sel = document.querySelector('[id*="vm_connection"], [id*="expert"][id*="connection"]') as HTMLSelectElement;
            return sel && Array.from(sel.options).some(o =>
              o.value.toLowerCase().includes(conn.toLowerCase()) ||
              o.text.toLowerCase().includes(conn.toLowerCase()));
          }, connName, { timeout: 8_000 }).catch(() => {});
          const connOpt = await connSel.locator('option')
            .filter({ hasText: new RegExp(connName, 'i') }).first().getAttribute('value');
          await connSel.selectOption(connOpt ?? connName).catch(() => {});
          await page.waitForTimeout(800);
        }
      } catch { console.warn(`[${tag}] Connection 선택 실패`); }
    }

    // Spec 검색 모달 (Expert 폼 내부)
    try {
      const specBtn = page.locator('[data-bs-target*="spec-search"], [onclick*="spec-search"]').first();
      if (await specBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await specBtn.click();
        const specModal = page.locator('[id*="spec-search"]').first();
        await specModal.waitFor({ state: 'visible', timeout: 5_000 });
        await page.locator('[id*="spec-search"] a[onclick*="getRecommend"]').first().click();
        await page.locator('[id*="spec-search"] .tabulator-row:not(.tabulator-placeholder)').first()
          .waitFor({ timeout: 30_000 });
        const cspSpecName = specId.split('+').pop() ?? '';
        await page.evaluate(
          ({ specName }: { specName: string }) => {
            const t = (window as unknown as {
              recommendTable?: {
                getData: () => Array<Record<string, unknown>>;
                deselectRow: () => void;
                getRows: () => Array<{ select: () => void }>;
              };
            }).recommendTable;
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
        await page.locator('[id*="spec-search"] button[onclick*="applySpec"]').first().click();
        await specModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      }
    } catch (e) {
      console.warn(`[${tag}] Spec 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
    }

    // Subgroup 수량
    await page.fill('[id*="subgroup_size"], [name*="subGroupSize"]', subGroupSize).catch(() => {});

    // Deploy
    page.on('dialog', async d => { await d.accept(); });
    try {
      const deployBtn = page.locator(
        'button[onclick*="deployAddServer"], button[onclick*="addSubGroup"], ' +
        'button[onclick*="deploySubGroup"], button',
        { hasText: /deploy/i }
      ).first();
      await deployBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await deployBtn.click();
    } catch {
      throw new Error(`[${tag}] Deploy 버튼 없음`);
    }

    await page.waitForTimeout(3_000);
    createdSubGroupId = subGroupName;
    console.log(`[${tag}] Add Server Expert 완료: subGroup=${subGroupName}`);
  });

  test.afterAll(() => {
    if (!store) return;
    const subGroupName = (p.subGroupName as string) ?? 'sg-exp1';
    store.set('subGroupId',   createdSubGroupId);
    store.set('subGroupName', subGroupName);
    console.log(`[${TC_ID}] store OUT: subGroupId=${createdSubGroupId}, subGroupName=${subGroupName}`);
  });
});
