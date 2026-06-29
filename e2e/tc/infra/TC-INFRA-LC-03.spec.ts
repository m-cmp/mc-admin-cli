/**
 * deploy/tc/infra/TC-INFRA-LC-03.spec.ts
 * TC-INFRA-LC-03: mc* 로 시작하는 MCI 일괄 삭제 (case 분류 포함)
 *
 * ── case 정의 ─────────────────────────────────────────────────────
 *   case1 : MCI만 존재, Total Servers = 0  (nodegroup 없음)
 *   case2 : Total Servers = 1              (nodegroup 1개)
 *   case3 : Total Servers ≥ 2             (nodegroup 2개 이상)
 *   해당 case에 MCI가 없으면 SKIP 표시
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/infra/TC-INFRA-LC-03.spec.ts
 *
 * ── 시나리오 실행 ─────────────────────────────────────────────────
 *   SCENARIO_ID=C3-mci-cleanup npx playwright test deploy/tc/infra/TC-INFRA-LC-03.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID      = 'TC-INFRA-LC-03';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const store = ctx instanceof ScenarioContext ? ctx.store : null;

test.use({ storageState: { cookies: [], origins: [] } });

// ── 헬퍼: 워크스페이스 모달 닫기 ───────────────────────────────────────
async function dismissModal(page: Page) {
  try {
    await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 3_000 });
    await page.click('#commonDefaultModal-confirm-btn');
    await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 5_000 });
  } catch {}
}

// ── 헬퍼: ws01/default 선택 ────────────────────────────────────────
async function selectWsProj(page: Page) {
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
}

// ── 헬퍼: 테이블 페이지 크기 최대 확장 ────────────────────────────────
async function expandPageSize(page: Page) {
  await page.evaluate(() => {
    const sel = document.querySelector('#mcilist-table .tabulator-page-size') as HTMLSelectElement | null;
    if (!sel) return;
    const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
    if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
  }).catch(() => {});
  await page.waitForTimeout(800);
}

// ── 헬퍼: MCI 목록 스캔 → mc* 필터 후 case 분류 ───────────────────────
interface MciInfo { name: string; totalServers: number; }

async function scanMcMcis(page: Page): Promise<MciInfo[]> {
  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1_500);
  await expandPageSize(page);

  return (await page.evaluate(() => {
    const headerEls = Array.from(document.querySelectorAll('#mcilist-table .tabulator-col'));
    const colTitle  = (el: Element) =>
      (el.querySelector('.tabulator-col-title') as HTMLElement)?.innerText?.trim() ?? '';
    const nameIdx  = headerEls.findIndex(h => colTitle(h) === 'Name');
    const totalIdx = headerEls.findIndex(h => colTitle(h) === 'Total Servers');

    const rows = Array.from(
      document.querySelectorAll('#mcilist-table .tabulator-row:not(.tabulator-placeholder)')
    );
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('.tabulator-cell'));
      const name  = (cells[nameIdx]  as HTMLElement)?.innerText?.trim() || '';
      const total = parseInt((cells[totalIdx] as HTMLElement)?.innerText?.trim() || '0', 10) || 0;
      return { name, totalServers: total };
    }).filter(r => r.name.startsWith('mc'));
  })) as unknown as MciInfo[];
}

// ── 헬퍼: MCI 1개 삭제 ─────────────────────────────────────────────
async function deleteMci(page: Page, mciName: string): Promise<boolean> {
  await expandPageSize(page);

  const row = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciName }).first();
  if (await row.count().catch(() => 0) === 0) {
    console.warn(`[${TC_ID}] ${mciName} 행 없음 — skip`);
    return false;
  }
  await row.click();
  await page.waitForTimeout(500);

  try {
    await page.locator('a.btn-action:has(svg.icon-tabler-chevron-down)').first().click();
    await page.locator('a.dropdown-item[onclick*="MciDelete"]').first()
      .waitFor({ state: 'visible', timeout: 3_000 });
    await page.locator('a.dropdown-item[onclick*="MciDelete"]').first().click();
    await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });
    await page.click('#commonDefaultModal-confirm-btn');
    await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 10_000 });
    console.log(`[${TC_ID}] 삭제 요청 완료: ${mciName}`);
    await page.waitForTimeout(1_500);
    return true;
  } catch (e) {
    console.warn(`[${TC_ID}] ${mciName} 삭제 실패 — ${(e as Error).message?.slice(0, 80)}`);
    return false;
  }
}

// ── 테스트 ─────────────────────────────────────────────────────────
test.describe('TC-INFRA-LC-03: mc* MCI 일괄 삭제 (case 분류)', () => {

  test('UI: mc*로 시작하는 MCI 스캔 → case1/2/3 분류 → 전체 삭제', async ({ page }) => {
    test.setTimeout(20 * 60_000);

    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, TC_ID);
    if (!ok) { throw new Error(`[${TC_ID}] 로그인 실패`); }

    await dismissModal(page);
    await selectWsProj(page);
    // 워크스페이스 변경 후 추가 modal 대기·닫기
    await page.waitForTimeout(1_500);
    await dismissModal(page);

    // ── 1단계: 스캔 ────────────────────────────────────────────────
    const mcMcis = await scanMcMcis(page);

    const case1 = mcMcis.filter(m => m.totalServers === 0);
    const case2 = mcMcis.filter(m => m.totalServers === 1);
    const case3 = mcMcis.filter(m => m.totalServers >= 2);

    console.log(`[${TC_ID}] === mc* MCI 스캔 결과 ===`);
    console.log(`[${TC_ID}] case1 (nodegroup 없음,  0개): ${case1.length === 0 ? 'SKIP' : case1.map(m => `${m.name}(${m.totalServers})`).join(', ')}`);
    console.log(`[${TC_ID}] case2 (nodegroup 1개,  1 VM): ${case2.length === 0 ? 'SKIP' : case2.map(m => `${m.name}(${m.totalServers})`).join(', ')}`);
    console.log(`[${TC_ID}] case3 (nodegroup 2개+, ≥2VM): ${case3.length === 0 ? 'SKIP' : case3.map(m => `${m.name}(${m.totalServers})`).join(', ')}`);
    console.log(`[${TC_ID}] 총 삭제 대상: ${mcMcis.length}개`);

    if (mcMcis.length === 0) {
      console.log(`[${TC_ID}] mc*로 시작하는 MCI 없음 — 전체 SKIP`);
      return;
    }

    // ── 2단계: 전체 삭제 ─────────────────────────────────────────
    let deleted = 0;
    for (const mci of mcMcis) {
      const caseLabel = mci.totalServers === 0 ? 'case1' : mci.totalServers === 1 ? 'case2' : 'case3';
      console.log(`[${TC_ID}] [${caseLabel}] 삭제 시작: ${mci.name} (Total Servers: ${mci.totalServers})`);
      await dismissModal(page);
      const success = await deleteMci(page, mci.name);
      if (success) deleted++;
    }

    // ── 3단계: 잔류 확인 ─────────────────────────────────────────
    await dismissModal(page);
    await selectWsProj(page);
    const remaining = await scanMcMcis(page);
    console.log(`[${TC_ID}] 삭제 완료: ${deleted}/${mcMcis.length}, 잔류: ${remaining.length}개`);

    if (remaining.length > 0) {
      console.warn(`[${TC_ID}] 잔류 MCI: ${remaining.map(m => m.name).join(', ')}`);
    }

    // 잔류가 있어도 테스트는 통과 (비동기 삭제는 서버에서 진행 중)
    expect(deleted).toBeGreaterThan(0);
  });
});
