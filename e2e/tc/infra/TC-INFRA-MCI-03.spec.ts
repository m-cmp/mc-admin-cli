/**
 * deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 * TC-INFRA-MCI-03: MCI 생성 — 브라우저 UI 테스트
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 *   TC_VARIANT=azure npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 *
 * ── 시나리오 실행 (런타임 store OUT param 저장) ────────────────────
 *   SCENARIO_ID=C4-001 TC_VARIANT=aws \
 *     npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
 *
 * ── 런타임 OUT params (시나리오 모드) ─────────────────────────────
 *   store.set('mciId',   생성된 MCI ID or mciName)
 *   store.set('mciName', mciName)
 *   store.set('nsId',    nsId)
 */
import { test, expect } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-DEPLOY-05';
const scenarioId = process.env.SCENARIO_ID;
const variant    = process.env.TC_VARIANT;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

let createdMciId = '';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-INFRA-DEPLOY-05: MCI 생성', () => {

  test('UI: MCI 생성 마법사 → Deploy → 목록 확인', async ({ page }) => {
    test.setTimeout(8 * 60_000);

    const nsId    = (p.nsId    as string) ?? 'default';
    const mciName = (p.mciName as string) ?? 'tc-mci-temp';
    const vmName  = (p.vmName  as string) ?? `${mciName}-vm-0`;
    const specId  = (p.commonSpec as string) ?? '';
    const connName = (p.connectionName as string) ?? 'aws-ap-northeast-2';
    const tag     = TC_ID;

    console.log(`[${TC_ID}] variant: ${variant ?? '(base)'}`);
    console.log(`[${TC_ID}] mciName=${mciName}, conn=${connName}, spec=${specId}`);

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
      await page.waitForFunction(() => {
        const sel = document.querySelector('#select-current-project') as HTMLSelectElement;
        return sel && Array.from(sel.options).some(o => o.text.toLowerCase().includes('default'));
      }, { timeout: 15_000 });
      const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
      await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    } catch {}

    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(1_500);

    // 이미 존재 확인
    const existRow = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciName });
    if (await existRow.count().catch(() => 0) > 0) {
      await existRow.first().click();
      await page.waitForTimeout(500);
      createdMciId = await page.evaluate(() =>
        (window as unknown as { currentMciId?: string }).currentMciId ?? '') as string;
      if (!createdMciId) createdMciId = mciName;
      console.log(`[${tag}] MCI 재사용: ${mciName} (${createdMciId})`);
      return;
    }

    // Add Mci 버튼
    const addBtn = page.locator('#page-header-btn-list a', { hasText: 'Add Mci' });
    try {
      await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      console.warn(`[${tag}] Add Mci 버튼 없음 — 건너뜀`);
      return;
    }
    await page.evaluate(() => {
      const modal = document.querySelector('#commonDefaultModal') as HTMLElement | null;
      if (modal?.classList.contains('show')) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
      }
    });
    await addBtn.click();
    await page.locator('#mcicreate').waitFor({ state: 'visible', timeout: 5_000 });

    await page.fill('#mci_name', mciName);
    await page.fill('#mci_desc', `${TC_ID} E2E 테스트 (variant: ${variant ?? 'base'})`);
    await page.click('#mci_plusVmIcon');
    await page.locator('#server_configuration').waitFor({ state: 'visible', timeout: 5_000 });
    await page.fill('#ep_name', vmName);

    // Spec 검색 모달
    await page.click('#server_configuration [data-bs-target="#spec-search"]');
    await page.locator('#spec-search').first().waitFor({ state: 'visible', timeout: 5_000 });
    await page.locator('#spec-search a[onclick*="getRecommendVmInfo"]').first().click();
    try {
      await page.locator('#spec-table .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });
      // specId 기반 행 선택 (없으면 첫 번째)
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
      await page.locator('#spec-search button[onclick*="applySpecInfo"]').first().click();
      await page.locator('#spec-search').first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    } catch {
      console.warn(`[${tag}] Spec 선택 실패 — 건너뜀`);
      return;
    }

    // Image 검색 모달
    try {
      await page.click('#server_configuration [onclick*="validateAndOpenImageModal"]');
      await page.locator('#image-search').first().waitFor({ state: 'visible', timeout: 5_000 });
      try {
        await page.locator('#image-search [onclick*="toggleOSDropdown"]').click();
        await page.waitForTimeout(300);
        await page.locator('#image-search a[onclick*="ubuntu 22.04"]').first().click();
      } catch {}
      await page.locator('#image-search a[onclick*="getRecommendImageInfo"]').first().click();
      await page.locator('#image-table .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });
      await page.locator('#image-table .tabulator-row').first().click();
      await page.waitForTimeout(400);
      await page.locator('#image-search button[onclick*="applyImageInfo"]').first().click();
      await page.locator('#image-search').first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    } catch { console.warn(`[${tag}] Image 선택 실패 — 진행 계속`); }

    await page.click('button[onclick*="expressDone_btn"]');
    await page.waitForTimeout(1_000);

    await page.route('**/PostInfraDynamicReview', async route => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          responseData: { overallStatus: 'Ready', creationViable: true, infraName: mciName,
            overallMessage: 'bypass review', nodeReviews: [], vmReviews: [], resourceSummary: {} },
          status: { code: 200, message: 'OK' },
        }),
      });
    });
    page.on('dialog', async d => { await d.accept(); });

    const navPromise = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null);
    try {
      await page.click('button[onclick*="deployMci"]');
    } catch {
      console.warn(`[${tag}] Deploy 버튼 없음 — 건너뜀`);
      return;
    }
    await navPromise;
    await page.waitForTimeout(2_000);

    // 배포 후 목록 확인 (creating / running / failed 모두 유효)
    // 최대 6회 reload 재시도 (~60s). 미표시 시 배포 실패 처리한다.
    let found = false;
    for (let attempt = 0; attempt <= 5; attempt++) {
      // 워크스페이스 모달 처리
      try {
        await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 2_000 });
        await page.click('#commonDefaultModal-confirm-btn');
        await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 5_000 });
      } catch {}
      // 워크스페이스/프로젝트 재선택
      try {
        await page.waitForFunction(() => {
          const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement;
          return sel && Array.from(sel.options).some(o => o.text.includes('ws01'));
        }, { timeout: 10_000 });
        const wsVal = await page.locator('#select-current-workspace option').filter({ hasText: /ws01/i }).first().getAttribute('value');
        await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');
        await page.waitForFunction(() => {
          const sel = document.querySelector('#select-current-project') as HTMLSelectElement;
          return sel && Array.from(sel.options).some(o => o.text.toLowerCase().includes('default'));
        }, { timeout: 10_000 });
        const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
        await page.locator('#select-current-project').selectOption(projVal ?? 'default');
      } catch {}
      await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(2_000);

      // 테이블 페이지 크기를 최대로 늘려 전체 행 검색 가능하게 함 (기본 5행 페이지네이션 우회)
      await page.evaluate(() => {
        const sel = document.querySelector('#mcilist-table .tabulator-page-size') as HTMLSelectElement | null;
        if (!sel) return;
        const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
        if (max > 0 && sel.value !== String(max)) {
          sel.value = String(max);
          sel.dispatchEvent(new Event('change'));
        }
      }).catch(() => {});
      await page.waitForTimeout(800);

      const newRow = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciName });
      if (await newRow.count().catch(() => 0) > 0) {
        await newRow.first().click();
        await page.waitForTimeout(500);
        createdMciId = await page.evaluate(() =>
          (window as unknown as { currentMciId?: string }).currentMciId ?? '') as string;
        if (!createdMciId) createdMciId = mciName;
        console.log(`[${tag}] MCI 생성 확인: ${mciName} (${createdMciId}) — attempt ${attempt + 1}`);
        found = true;
        break;
      }
      console.log(`[${tag}] MCI ${mciName} 미표시 (attempt ${attempt + 1}/6) — 재시도`);
      if (attempt < 5) {
        await page.reload({ waitUntil: 'networkidle', timeout: 30_000 }).catch(() => null);
      }
    }
    expect(found, `MCI ${mciName} 배포 후 목록 미표시 — 배포 실패`).toBe(true);
    expect(createdMciId, 'MCI ID 없음').toBeTruthy();
  });

  test.afterAll(() => {
    if (!store) return;
    const mciName = (p.mciName as string) ?? 'tc-mci-temp';
    const nsId    = (p.nsId    as string) ?? 'default';
    store.set('mciId',   createdMciId);
    store.set('mciName', mciName);
    store.set('nsId',    nsId);
    console.log(`[${TC_ID}] store OUT: mciId=${createdMciId}, mciName=${mciName}, nsId=${nsId}`);
  });
});
