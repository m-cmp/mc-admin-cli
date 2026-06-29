/**
 * deploy/tc/workload/TC-WORKLOAD-MCI-01.spec.ts
 * TC-WORKLOAD-MCI-01: MCI 터미널 접속 · 명령 실행
 *
 * ── 단독 실행 ────────────────────────────────────────────────────
 *   npx playwright test deploy/tc/workload/TC-WORKLOAD-MCI-01.spec.ts
 *   # 단독 실행 시 MCI_ID / MCI_NAME 은 params.mciId (없으면 오류)
 *   # 또는: PW_mciId=<id> PW_mciName=<name> npx playwright test ...
 *
 * ── 시나리오 실행 (런타임 store IN param 사용) ─────────────────────
 *   SCENARIO_ID=C4-001 npx playwright test deploy/tc/workload/TC-WORKLOAD-MCI-01.spec.ts
 *
 * ── 런타임 IN params ──────────────────────────────────────────────
 *   store.require('mciId')   — TC-INFRA-DEPLOY-05 OUT
 *   store.require('mciName') — TC-INFRA-DEPLOY-05 OUT
 *
 * ── IN param 주의 ────────────────────────────────────────────────
 *   store.require('mciId'), store.require('mciName') 이 없으면 FAIL
 */
import { test, expect, type Page } from '@playwright/test';
import { PAGES }        from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

// ── 컨텍스트 결정 ─────────────────────────────────────────────────────────────
const TC_ID      = 'TC-WORKLOAD-MCI-01';
const scenarioId = process.env.SCENARIO_ID;

const ctx   = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID)
  : new StandaloneContext(TC_ID);
const p     = ctx.params;
const store = ctx instanceof ScenarioContext ? ctx.store : null;

// ── IN param 확정 ─────────────────────────────────────────────────────────────
//   모듈 평가 시점이 아닌 test.beforeAll 에서 읽어야 한다
//   (이전 TC 가 afterAll 에서 store.set 을 호출하기 때문)
let mciId   = '';
let mciName = '';

test.use({ storageState: { cookies: [], origins: [] } });

// ── 헬퍼 함수 ─────────────────────────────────────────────────────────────────

async function selectByLabel(page: Page, selector: string, label: string): Promise<void> {
  const sel = page.locator(selector);
  await sel.waitFor({ state: 'attached', timeout: 10_000 });
  await expect(async () => {
    const opts = await sel.locator('option').allTextContents();
    expect(opts.some(t => t.trim() === label)).toBeTruthy();
  }).toPass({ timeout: 15_000 });
  await sel.selectOption({ label });
}

async function clickMciRow(page: Page, name: string): Promise<void> {
  await page.waitForSelector('#mcilist-table .tabulator-row', { timeout: 30_000 });
  const rows  = page.locator('#mcilist-table .tabulator-row');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    if ((await row.innerText()).includes(name)) {
      await row.click();
      return;
    }
  }
  throw new Error(`MCI 행 '${name}' 을 찾을 수 없음 — MCI 가 서버에 존재하는지 확인하세요`);
}

// ── TC-WORKLOAD-MCI-01 ────────────────────────────────────────────────────────

test.describe('TC-WORKLOAD-MCI-01: MCI 터미널 접속·명령 실행', () => {

  // IN param 읽기: 이전 TC afterAll 이 완료된 후 store 에서 읽는다
  test.beforeAll(() => {
    if (store) {
      mciId   = store.require<string>('mciId');
      mciName = store.require<string>('mciName');
      console.log(`[TC-WORKLOAD-MCI-01] store IN: mciId=${mciId}, mciName=${mciName}`);
    } else {
      // 단독 실행: params 에서 직접 읽음 (PW_mciId 로 주입 가능)
      mciId   = p.mciId   as string ?? '';
      mciName = p.mciName as string ?? '';
      if (!mciId) {
        console.warn('[TC-WORKLOAD-MCI-01] 단독 실행 — mciId 없음. PW_mciId=<id> 로 주입하거나 params 파일에 기재하세요.');
      }
    }
  });

  test('UI: MCI 워크로드 화면 → 터미널 → 명령 실행', async ({ page }) => {
    test.setTimeout(2 * 60_000);
    const tag = TC_ID;

    if (!mciId && !store) {
      throw new Error(`[${tag}] mciId 없음 — PW_mciId 환경변수 또는 시나리오 실행 필요`);
    }

    const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
    expect(ok, `[${tag}] 로그인 실패`).toBeTruthy();

    // 1. 워크스페이스 / 프로젝트 선택
    await selectByLabel(page, '#select-current-workspace', 'ws01');
    console.log(`[${tag}] 워크스페이스 ws01 선택`);

    await selectByLabel(page, '#select-current-project', 'default');
    console.log(`[${tag}] 프로젝트 default 선택`);

    // 2. MCI 행 클릭 (시나리오에서 받은 mciName 사용)
    await clickMciRow(page, mciName);
    console.log(`[${tag}] MCI '${mciName}' 행 클릭`);

    // 3. MCI 정보 카드 표시 확인
    await expect(page.locator('#mci_info'), 'MCI 정보 카드 미표시').toBeVisible({ timeout: 10_000 });

    // 4. Terminal 버튼 → confirm 모달
    await page.click('a[onclick*="initMciRemoteCmdModal"]');
    await expect(page.locator('#commonDefaultModal'), 'Confirm 모달 미오픈').toBeVisible({ timeout: 10_000 });

    // 5. 확인 → Remote Terminal 모달
    await page.click('#commonDefaultModal-confirm-btn');
    await expect(page.locator('#mci-cmdtestmodal'), 'Remote Terminal 모달 미오픈').toBeVisible({ timeout: 15_000 });

    // 6. 명령어 입력 (params 에서 읽음)
    const command = p.command as string ?? 'hostname';
    await page.fill('#mci-command-input', command);
    console.log(`[${tag}] 명령어 입력: '${command}'`);

    // 7. Execute → API 응답 확인
    const [response] = await Promise.all([
      page.waitForResponse(
        r => r.url().includes('PostCmdInfra'),
        { timeout: 30_000 },
      ),
      page.click('#mci-execute-command-btn'),
    ]);

    const status = response.status();
    console.log(`[${tag}] PostCmdInfra 응답 status: ${status}`);
    expect(
      status >= 200 && status < 300,
      `PostCmdInfra API 실패 (status: ${status})`,
    ).toBeTruthy();

    // 8. 결과 섹션 표시 확인
    await expect(
      page.locator('#mci-command-results-section'),
      '명령어 실행 결과 미표시',
    ).toBeVisible({ timeout: 15_000 });

    console.log(`[${tag}] ✅ 터미널 실행 완료`);
  });

});
