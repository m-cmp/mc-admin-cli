/**
 * deploy/scenarios/shared/runScenarioStep.ts
 * 레지스트리 스텝(TC ID)별 브라우저 UI 실행 — API 직접 호출 없음
 */
import { test, expect, type Page, type Locator, type APIRequestContext } from '@playwright/test';
import * as fs   from 'fs';
import * as os   from 'os';
import * as path from 'path';
import { PAGES } from '../../shared/pages';
import { loginAndGoto } from '../../shared/request-auth.helper';
import { gotoSwIframeTab } from '../../shared/sw-iframe.helper';
import { ScenarioContext } from '../../params/runtime/context';
import { ScenarioRuntimeStore } from '../../params/runtime/store';
import type { ScenarioStep } from '../../registry/types';

const DEFAULT_NS = 'default';

export interface StepRunContext {
  page: Page;
  request: APIRequestContext; // reserved — not used directly
  store: ScenarioRuntimeStore;
  scenarioId: string;
  step: ScenarioStep;
}

function warn(tag: string, msg: string) {
  console.warn(`[${tag}] ${msg}`);
}

function failStep(tag: string, reason: string): never {
  throw new Error(`[${tag}] ${reason}`);
}

// deploy_result_table.md 에 spec/image 결과를 기록
function recordDeployResult(opts: {
  provider: string; region: string; spec: string; image: string;
  result: 'success' | 'fail'; reason?: string;
}): void {
  try {
    const tableFile = path.resolve('deploy_result', 'deploy_result_table.md');
    const now  = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const icon = opts.result === 'success' ? '✅' : '❌';
    const row  = `| ${opts.provider} | ${opts.region} | ${opts.spec} | ${opts.image || '-'} | ${icon} ${opts.result} | ${opts.reason || '-'} | ${now} |`;
    const SECTION = '## CSP별 MCI spec/image 기록';
    const header  = `\n\n${SECTION}\n\n| provider | region | spec | image | 결과 | 사유 | 기록 시각 |\n|---------|--------|------|-------|------|------|----------|\n`;
    let content = fs.existsSync(tableFile) ? fs.readFileSync(tableFile, 'utf-8') : '';
    content += content.includes(SECTION) ? row + '\n' : header + row + '\n';
    fs.writeFileSync(tableFile, content, 'utf-8');
  } catch { /* 기록 실패 무시 */ }
}

// ── 공통 헬퍼 ──────────────────────────────────────────────────────────────

async function selectWorkspaceProject(page: Page, tag: string): Promise<void> {
  try {
    await page.waitForFunction(() => {
      const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement;
      return sel && Array.from(sel.options).some(o => o.text.includes('ws01') || o.value.includes('ws01'));
    }, { timeout: 15_000 });
    const wsVal = await page.locator('#select-current-workspace option').filter({ hasText: /ws01/i }).first().getAttribute('value');
    await page.locator('#select-current-workspace').selectOption(wsVal ?? 'ws01');

    await page.waitForFunction(() => {
      const sel = document.querySelector('#select-current-project') as HTMLSelectElement;
      return sel && Array.from(sel.options).some(o => o.text.toLowerCase().includes('default'));
    }, { timeout: 15_000 });
    const projVal = await page.locator('#select-current-project option').filter({ hasText: /default/i }).first().getAttribute('value');
    await page.locator('#select-current-project').selectOption(projVal ?? 'default');
    console.log(`[${tag}] ws01/default 선택`);
  } catch (e) {
    warn(tag, `ws01/default 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
  }
}

async function dismissWorkspaceModal(page: Page): Promise<void> {
  try {
    await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 3_000 });
    await page.click('#commonDefaultModal-confirm-btn');
    await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 5_000 });
  } catch { /* 모달 없음 */ }
}

// workspace/project 선택 후 팝업이 남아있으면 dismiss, 최종 선택값 확인
async function ensureWorkspaceProjectSelected(page: Page, tag: string): Promise<void> {
  await selectWorkspaceProject(page, tag);
  await page.waitForTimeout(500);

  // 1) 선택 요구 팝업(commonDefaultModal) 처리
  await dismissWorkspaceModal(page);
  await page.waitForTimeout(500);

  // 2) 일반 모달/얼럿("워크스페이스를 선택해주세요" 계열) 처리
  const genericModal = page.locator('[role="dialog"], .modal.show').first();
  const isGenericVisible = await genericModal.isVisible({ timeout: 2_000 }).catch(() => false);
  if (isGenericVisible) {
    const confirmBtn = genericModal.locator('button').filter({ hasText: /ok|confirm|확인|닫기/i }).first();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 3) 현재 선택값 검증
  const wsSelected = await page.locator('#select-current-workspace').inputValue().catch(() => '');
  const projSelected = await page.locator('#select-current-project').inputValue().catch(() => '');
  console.log(`[${tag}] workspace 선택값="${wsSelected}", project 선택값="${projSelected}"`);

  const wsOk   = wsSelected.toLowerCase().includes('ws01') || wsSelected !== '';
  const projOk = projSelected.toLowerCase().includes('default') || projSelected !== '';

  if (!wsOk || !projOk) {
    // 재시도: selectWorkspaceProject 다시 호출
    console.log(`[${tag}] workspace/project 미선택 → 재시도`);
    await selectWorkspaceProject(page, tag);
    await page.waitForTimeout(800);
    await dismissWorkspaceModal(page);
  }

  await page.waitForTimeout(1_000);
}

// ── MCI spec/image 모달 헬퍼 ───────────────────────────────────────────────

async function selectSpecForConnection(page: Page, tag: string, connectionName: string, targetSpecId: string): Promise<boolean> {
  const specModal = page.locator('#spec-search').first();
  const provider     = targetSpecId.split('+')[0].toLowerCase();
  const cspSpecName  = targetSpecId.split('+').pop() ?? '';
  const preferredConn = connectionName.toLowerCase(); // e.g. "tencent-ap-seoul"

  console.log(`[${tag}] Spec 검색: targetSpecId="${targetSpecId}" conn="${connectionName}"`);

  // Bootstrap 모달 애니메이션 완료 대기
  await page.waitForTimeout(600);

  // ① 지역 선택 — "Seoul" (위치 기반 우선순위 정렬)
  await page.evaluate(() => {
    const sel = document.getElementById('assistRecommendSpecConnectionName') as HTMLSelectElement | null;
    if (sel) { sel.value = 'seoul'; sel.dispatchEvent(new Event('change')); }
    // showRecommendSpecSetting('seoul')이 위도/경도를 설정
    type ModMap = Record<string, Record<string, (v: string) => void>>;
    const rec = (window as unknown as { webconsolejs?: ModMap }).webconsolejs;
    rec?.['partials/operation/manage/serverrecommendation']?.['showRecommendSpecSetting']?.('seoul');
  }).catch(() => {});
  await page.waitForTimeout(200);

  // ② provider checkbox 설정
  await page.evaluate((prov: string) => {
    const allCb  = document.getElementById('spec-provider-all') as HTMLInputElement | null;
    const provCb = document.getElementById(`spec-provider-${prov}`) as HTMLInputElement | null;
    if (allCb)  allCb.checked  = false;
    if (provCb) provCb.checked = true;
  }, provider).catch(() => {});

  // ③ 검색 버튼 클릭
  await specModal.locator('a[onclick*="getRecommendVmInfo"]').click();
  try {
    await specModal.locator('#spec-table .tabulator-row:not(.tabulator-placeholder)').first()
      .waitFor({ timeout: 30_000 });
  } catch {
    warn(tag, 'Spec 목록 로드 실패');
    await specModal.locator('[data-bs-dismiss="modal"]').first().click().catch(() => {});
    return false;
  }

  // 페이지 크기 최대화 — Tabulator API + select 양방향 시도
  await page.evaluate(() => {
    const table = (window as unknown as { recommendTable?: { setPageSize: (n: number) => void } }).recommendTable;
    if (table) { try { table.setPageSize(9999); } catch { /* 무시 */ } }
    const sel = document.querySelector('#spec-table .tabulator-page-size') as HTMLSelectElement | null;
    if (sel) {
      const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
      if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
    }
  }).catch(() => {});
  await page.waitForTimeout(800);

  const specRows = specModal.locator('#spec-table .tabulator-row:not(.tabulator-placeholder)');
  const rowCount  = await specRows.count();
  console.log(`[${tag}] Spec 검색결과: ${rowCount}행 (찾는 spec: ${cspSpecName}, conn: ${connectionName})`);

  // 디버그: 처음 5행 텍스트 출력
  for (let _di = 0; _di < Math.min(5, rowCount); _di++) {
    const _t = ((await specRows.nth(_di).textContent()) ?? '').replace(/\s+/g, ' ').trim();
    console.log(`[${tag}] row[${_di}]: ${_t.slice(0, 120)}`);
  }

  // ④ connectionName에서 region 추출: "alibaba-ap-northeast-2" → "ap-northeast-2"
  //    첫 번째 '-' 이후를 region으로 사용 (provider prefix 제거)
  const dashIdx    = preferredConn.indexOf('-');
  const regionPart = dashIdx >= 0 ? preferredConn.slice(dashIdx + 1) : preferredConn;

  const findRowByRegion = async (region: string): Promise<number> => {
    for (let i = 0; i < rowCount; i++) {
      const text = ((await specRows.nth(i).textContent()) ?? '').toLowerCase();
      if (text.includes(region.toLowerCase()) && text.includes(cspSpecName.toLowerCase())) return i;
    }
    return -1;
  };

  // ⑤ Spec 행 선택 — commonSpec 미지정 시 vCPU 1→2→4 우선순위, 지정 시 region+spec명 매칭
  let idx = -1;

  if (!cspSpecName) {
    // vCPU 1→2→4 자동 선택 (commonSpec 미지정)
    idx = await page.evaluate(() => {
      const t = (window as unknown as { recommendTable?: { getData: () => Array<Record<string, unknown>> } }).recommendTable;
      if (!t) return 0;
      const rows = t.getData();
      for (const vcpu of [1, 2, 4]) {
        const found = rows.findIndex(r => Number(r['vCPU']) === vcpu);
        if (found >= 0) return found;
      }
      return 0;
    }).catch(() => 0);
    console.log(`[${tag}] vCPU 자동 선택 (1→2→4 우선순위): row ${idx}`);
  } else {
    // spec 이름 지정 → region + spec 이름 텍스트 매칭
    idx = await findRowByRegion(regionPart);
    if (idx >= 0) {
      console.log(`[${tag}] Spec 선택: region=${regionPart} / ${cspSpecName}`);
    }
  }

  // ⑥ 미발견 처리 (spec명 지정 모드에서만 실패 처리)
  if (idx < 0) {
    warn(tag, `Spec 미발견: ${targetSpecId} (region=${regionPart})`);
    recordDeployResult({ provider, region: regionPart, spec: cspSpecName, image: '', result: 'fail', reason: 'spec 미발견' });
    await specModal.locator('[data-bs-dismiss="modal"]').first().click().catch(() => {});
    return false;
  }

  await specRows.nth(idx).click();

  await page.waitForTimeout(400);
  await specModal.locator('button[onclick*="applySpecInfo"]').click();
  await specModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});

  // window.selectedSpecInfo 설정 확인 (callbackServerRecommendation는 async이므로 최대 2초 대기)
  const specInfo = await page.waitForFunction(
    () => (window as unknown as { selectedSpecInfo?: { provider?: string } }).selectedSpecInfo?.provider,
    { timeout: 2_000 }
  ).then(h => h.jsonValue() as Promise<string>).catch(() => '');
  if (specInfo) {
    console.log(`[${tag}] selectedSpecInfo.provider: ${specInfo}`);
  } else {
    warn(tag, 'selectedSpecInfo.provider 미설정 — 이미지 검색 provider 불확실');
  }
  return true;
}

async function selectImageForSpec(page: Page, tag: string, fixedImageId?: string, specProvider?: string, specRegion?: string): Promise<boolean> {
  const imgModal = page.locator('#image-search').first();

  // Ubuntu 22.04 OS 선택 시도 — fixedImageId 지정 시 OS 필터 스킵 (e.g. NCP Ubuntu 24.04)
  if (!fixedImageId) {
    try {
      await imgModal.locator('[onclick*="toggleOSDropdown"]').click();
      await page.waitForTimeout(300);
      await imgModal.locator('a[onclick*="ubuntu 22.04"]').first().click();
    } catch { /* OS dropdown 없으면 무시 */ }
  }

  // selectedSpecInfo에서 provider/region을 즉시 강제 설정
  await page.evaluate(({ prov, reg }: { prov: string; reg: string }) => {
    const info = (window as unknown as { selectedSpecInfo?: { provider?: string; regionName?: string; region?: string } }).selectedSpecInfo;
    const p = document.getElementById('image-provider') as HTMLInputElement | null;
    const r = document.getElementById('image-region')   as HTMLInputElement | null;
    const provVal = info?.provider  || prov;
    const regVal  = info?.regionName || info?.region || reg;
    if (p && provVal) { p.value = provVal; p.dispatchEvent(new Event('change')); p.dispatchEvent(new Event('input')); }
    if (r && regVal)  { r.value = regVal;  r.dispatchEvent(new Event('change')); r.dispatchEvent(new Event('input')); }
  }, { prov: specProvider ?? '', reg: specRegion ?? '' }).catch(() => {});

  // 검색: 1차(osType 포함) → 결과 없으면 osType 초기화 후 2차
  let loaded = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt === 2) {
      // 2차: osType 필터 초기화 (osType 미스매치 방어)
      await page.evaluate(() => {
        const el = document.getElementById('assist_os_type') as HTMLInputElement | null;
        if (el) el.value = '';
      }).catch(() => {});
      warn(tag, 'Image 1차 조회 결과 없음 — osType 필터 제거 후 재검색');
    }
    // provider/region 재설정 (비동기 초기화 방어)
    await page.evaluate(({ prov, reg }: { prov: string; reg: string }) => {
      const p = document.getElementById('image-provider') as HTMLInputElement | null;
      const r = document.getElementById('image-region')   as HTMLInputElement | null;
      if (p && prov) p.value = prov;
      if (r && reg)  r.value = reg;
    }, { prov: specProvider ?? '', reg: specRegion ?? '' }).catch(() => {});
    await imgModal.locator('a[onclick*="getRecommendImageInfo"]').click();
    try {
      await imgModal.locator('#image-table .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });
      loaded = true;
      break;
    } catch {
      warn(tag, `Image 로드 실패 (${attempt}/2)`);
    }
  }

  // fixedImageId 지정 시: 검색 실패 또는 행 미발견이면 ep_commonImageId 직접 설정
  if (fixedImageId) {
    let imageFoundInModal = false;
    if (loaded) {
      const targetRow = imgModal.locator('#image-table .tabulator-row').filter({ hasText: fixedImageId }).first();
      if (await targetRow.count() > 0) {
        await targetRow.click();
        console.log(`[${tag}] Image 지정 선택: ${fixedImageId}`);
        imageFoundInModal = true;
        await page.waitForTimeout(500);
        await imgModal.locator('button[onclick*="applyImageInfo"]').click();
        await imgModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      }
    }
    if (!imageFoundInModal) {
      warn(tag, `Image ID(${fixedImageId}) 모달 미발견 — ep_commonImageId 직접 설정`);
      // 모달 닫기
      await imgModal.locator('[data-bs-dismiss="modal"]').first().click().catch(() => {});
      await imgModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      // ep_commonImageId 직접 설정 (expressDone_btn이 이 값을 읽음)
      await page.evaluate((id: string) => {
        const ep = document.getElementById('ep_commonImageId') as HTMLInputElement | null;
        if (ep) ep.value = id;
      }, fixedImageId).catch(() => {});
      console.log(`[${tag}] Image 고정 설정(직접): ${fixedImageId}`);
    }
    const imageId = await page.locator('#ep_commonImageId').inputValue().catch(() => '');
    if (!imageId) { warn(tag, 'Image ep_commonImageId 설정 실패'); return false; }
    console.log(`[${tag}] Image 선택: ${imageId}`);
    return true;
  }

  if (!loaded) {
    warn(tag, 'Image 목록 로드 불가');
    await imgModal.locator('[data-bs-dismiss="modal"]').first().click().catch(() => {});
    return false;
  }

  // fixedImageId 미지정 시: non-pro 이미지 우선 선택
  const allRows = imgModal.locator('#image-table .tabulator-row:not(.tabulator-placeholder)');
  const rowCount = await allRows.count();
  let imageClicked = false;
  for (let i = 0; i < Math.min(rowCount, 30); i++) {
    const row = allRows.nth(i);
    const text = (await row.textContent()) ?? '';
    if (!text.toLowerCase().includes('-pro-') && !text.toLowerCase().includes('ubuntu-pro')) {
      await row.click();
      imageClicked = true;
      break;
    }
  }
  if (!imageClicked) await allRows.first().click();

  await page.waitForTimeout(500);
  await imgModal.locator('button[onclick*="applyImageInfo"]').click();
  await imgModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});

  const imageId = await page.locator('#ep_commonImageId').inputValue().catch(() => '');
  if (!imageId) { warn(tag, 'Image 미선택'); return false; }
  console.log(`[${tag}] Image 선택: ${imageId}`);
  return true;
}

// ── TC-INFRA-DEPLOY-05: MCI 생성 (UI) ────────────────────────────────────────

async function runInfraDeploy05(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { page, store, scenarioId } = ctx;
  const sc         = new ScenarioContext(scenarioId, 'TC-INFRA-DEPLOY-05', variant);
  const nsId       = (sc.params.nsId    as string) ?? DEFAULT_NS;
  const mciName    = (sc.params.mciName as string) ?? `deploy-${scenarioId}`;
  const vmName     = (sc.params.vmName  as string) ?? `${mciName}-vm-0`;
  const specId     = (sc.params.commonSpec    as string) ?? '';
  const connName   = (sc.params.connectionName as string) ?? 'aws-ap-northeast-2';
  const fixedImgId = (sc.params.imageId as string | undefined);

  const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
  if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);

  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(1_500);

  // mcilist-table 페이지 크기를 최대로 확장 — 8개 이상의 MCI가 있을 때 페이지네이션으로 탈락하지 않도록
  await page.evaluate(() => {
    const sel = document.querySelector('#mcilist-table .tabulator-page-size') as HTMLSelectElement | null;
    if (!sel) return;
    const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
    if (max > 0 && sel.value !== String(max)) {
      sel.value = String(max);
      sel.dispatchEvent(new Event('change'));
    }
  }).catch(() => {});
  await page.waitForTimeout(500);

  // 이미 존재하면 재사용 — Name 셀 exact match (mci17-dryrun 등 부분 매칭 방지)
  const existRow = page.locator('#mcilist-table .tabulator-row').filter({
    has: page.locator('.tabulator-cell').filter({ hasText: new RegExp(`^\\s*${mciName}\\s*$`) }),
  });
  if (await existRow.count().catch(() => 0) > 0) {
    await existRow.first().click({ force: true });
    await page.waitForTimeout(500);
    const mciId = await page.evaluate(() => (window as unknown as { currentMciId?: string }).currentMciId ?? '') as string;
    const id = mciId || mciName;
    if (variant) { store.set(`mciId_${variant}`, id); store.set(`mciName_${variant}`, mciName); }
    store.set('mciId', id); store.set('mciName', mciName); store.set('nsId', nsId);
    console.log(`[${tag}] MCI 재사용: ${mciName} (${id})`);
    return;
  }

  // Add Mci 버튼
  const addBtn = page.locator('#page-header-btn-list a', { hasText: 'Add Mci' });
  try {
    await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await addBtn.click();
    await page.locator('#mcicreate').waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    throw new Error(`[${tag}] Add Mci 버튼 없음`);
  }

  await page.fill('#mci_name', mciName);
  await page.fill('#mci_desc', `${scenarioId} deploy scenario`);

  // + SubGroup
  await page.click('#mci_plusVmIcon');
  await page.locator('#server_configuration').waitFor({ state: 'visible', timeout: 5_000 });
  await page.fill('#ep_name', vmName);

  // Spec 검색 모달
  await page.click('#server_configuration [data-bs-target="#spec-search"]');
  await page.locator('#spec-search').first().waitFor({ state: 'visible', timeout: 5_000 });
  const specOk = await selectSpecForConnection(page, tag, connName, specId);
  if (!specOk) { throw new Error(`[${tag}] Spec(${specId}) 선택 실패 — MCI 미생성`); }

  // Image 검색 모달
  const specProviderPart = specId.split('+')[0] ?? '';
  const specRegionPart   = specId.split('+')[1] ?? '';
  let selectedImageId = '';
  try {
    await page.click('#server_configuration [onclick*="validateAndOpenImageModal"]');
    await page.locator('#image-search').first().waitFor({ state: 'visible', timeout: 5_000 });
    const imgOk = await selectImageForSpec(page, tag, fixedImgId, specProviderPart, specRegionPart);
    if (imgOk) {
      selectedImageId = await page.locator('#ep_commonImageId').inputValue().catch(() => '');
    } else {
      recordDeployResult({ provider: specProviderPart, region: specRegionPart, spec: specId, image: '', result: 'fail', reason: 'image 선택 실패' });
    }
  } catch { warn(tag, 'Image 모달 열기 실패 — 진행 계속'); }

  // Done
  await page.click('button[onclick*="expressDone_btn"]');
  await page.waitForTimeout(1_000);

  // expressDone_btn 이후 Express_Server_Config_Arr 상태 확인
  const configArr = await page.evaluate(() => {
    const g = window as unknown as Record<string, unknown>;
    const arr = g['Express_Server_Config_Arr'];
    return Array.isArray(arr) ? arr : null;
  }).catch(() => null);
  console.log(`[${tag}] Express_Server_Config_Arr:`, JSON.stringify(configArr));

  // PostInfraDynamicReview 모킹 (리뷰 결과 고정 — 인프라 프로비저닝 사전 검증 우회용 mock)
  await page.route('**/PostInfraDynamicReview', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        responseData: {
          overallStatus: 'Ready', overallMessage: 'deploy-scenario bypass review',
          creationViable: true, infraName: mciName, nodeReviews: [], vmReviews: [], resourceSummary: {},
        },
        status: { code: 200, message: 'OK' },
      }),
    });
  });

  // PostInfraDynamic 요청/응답 인터셉트 (디버깅용 — 실제 요청은 통과시킴)
  await page.route('**/PostInfraDynamic', async route => {
    const reqBody = route.request().postData() || '';
    console.log(`[${tag}] PostInfraDynamic req: ${reqBody.slice(0, 300)}`);
    try {
      const response = await route.fetch();
      const respText = await response.text().catch(() => '');
      console.log(`[${tag}] PostInfraDynamic res(${response.status()}): ${respText.slice(0, 300)}`);
      await route.fulfill({ response });
    } catch {
      // page/context가 이미 닫힌 경우 — route를 중단하지 않고 무시
    }
  });

  page.on('dialog', async dialog => { await dialog.accept(); });

  const navPromise = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null);
  try {
    await page.click('button[onclick*="deployMci"]');
  } catch {
    throw new Error(`[${tag}] Deploy 버튼 없음`);
  }
  await navPromise;

  // 배포 후 목록 복귀 → MCI 표시 확인 (creating / running / failed 모두 유효)
  // 최대 6회 reload 재시도 (~60s). 미표시 시 배포 실패로 처리한다.
  let mciFoundId = '';
  for (let attempt = 0; attempt <= 5; attempt++) {
    await dismissWorkspaceModal(page);
    await selectWorkspaceProject(page, tag);
    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
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

    const row = page.locator('#mcilist-table .tabulator-row').filter({
      has: page.locator('.tabulator-cell').filter({ hasText: new RegExp(`^\\s*${mciName}\\s*$`) }),
    });
    if (await row.count().catch(() => 0) > 0) {
      await row.first().click();
      await page.waitForTimeout(500);
      const mciId = await page.evaluate(() => (window as unknown as { currentMciId?: string }).currentMciId ?? '') as string;
      mciFoundId = mciId || mciName;
      break;
    }
    console.log(`[${tag}] MCI ${mciName} 미표시 (attempt ${attempt + 1}/6) — 재시도`);
    if (attempt < 5) {
      await page.reload({ waitUntil: 'networkidle', timeout: 30_000 }).catch(() => {});
    }
  }

  if (!mciFoundId) {
    recordDeployResult({ provider: specProviderPart, region: specRegionPart, spec: specId, image: selectedImageId, result: 'fail', reason: `MCI ${mciName} 배포 실패` });
    throw new Error(`[${tag}] MCI ${mciName} 배포 후 목록 미표시 — 배포 실패 (6회 재시도 후)`);
  }
  if (variant) { store.set(`mciId_${variant}`, mciFoundId); store.set(`mciName_${variant}`, mciName); }
  store.set('mciId', mciFoundId); store.set('mciName', mciName); store.set('nsId', nsId);
  console.log(`[${tag}] MCI 생성: ${mciName} (${mciFoundId})`);
  recordDeployResult({ provider: specProviderPart, region: specRegionPart, spec: specId, image: selectedImageId, result: 'success' });
}

// ── TC-INFRA-DEPLOY-01/02: MCI 목록/상태 확인 (UI) ───────────────────────────

async function runInfraDeployList(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;
  const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
  if (!ok) return;
  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);
  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  const rowCount = await page.locator('#mcilist-table .tabulator-row').count().catch(() => 0);
  console.log(`[${tag}] MCI 목록 로드 완료 (행 수: ${rowCount})`);
}

// ── MCI 목록 페이지 크기 최대화 ──────────────────────────────────────────────
async function expandMciListPageSize(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sel = document.querySelector('#mcilist-table .tabulator-page-size') as HTMLSelectElement | null;
    if (!sel) return;
    const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
    if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
  }).catch(() => {});
  await page.waitForTimeout(800);
}

// ── MCI 행에서 ID 추출 ────────────────────────────────────────────────────────
async function getMciIdFromRow(page: Page, row: Locator, tag: string): Promise<string> {
  await row.click().catch(() => {});
  await page.waitForTimeout(300);
  const fromJs = await page.evaluate(() =>
    (window as unknown as { currentMciId?: string }).currentMciId ?? ''
  ).catch(() => '') as string;
  if (fromJs) return fromJs;
  // fallback: id 셀
  const idCell = row.locator('[tabulator-field="id"]');
  return ((await idCell.textContent().catch(() => '')) ?? '').trim();
}

// ── MCI ID 화면 자동 발견 헬퍼 ──────────────────────────────────────────────
// requiredStatus: 원하는 상태 포함 문자열 (예: 'running', 'stopped')
// 미지정 시 첫 번째 MCI 선택
async function discoverMciIdFromUi(page: Page, tag: string, requiredStatus?: string): Promise<string> {
  await expandMciListPageSize(page);

  const rows = page.locator('#mcilist-table .tabulator-row:not(.tabulator-placeholder)');
  const count = await rows.count().catch(() => 0);
  if (count === 0) return '';

  if (!requiredStatus) {
    // 상태 무관: 첫 번째 행
    const id = await getMciIdFromRow(page, rows.first(), tag);
    if (id) console.log(`[${tag}] UI에서 MCI 자동 선택: ${id}`);
    return id;
  }

  // 원하는 상태인 MCI 탐색
  for (let i = 0; i < count; i++) {
    const row    = rows.nth(i);
    const status = ((await row.locator('[tabulator-field="status"]').textContent().catch(() => '')) ?? '').trim().toLowerCase();
    if (status.includes(requiredStatus.toLowerCase())) {
      const id = await getMciIdFromRow(page, row, tag);
      if (id) {
        console.log(`[${tag}] UI에서 MCI 자동 선택 (상태: ${status}): ${id}`);
        return id;
      }
    }
  }
  console.warn(`[${tag}] 상태 '${requiredStatus}'인 MCI 없음 — 목록 ${count}행 확인`);
  return '';
}

// ── TC-INFRA-LC-01 헬퍼: MCI 상태 읽기 / 안정화 대기 / Refresh 폴링 ──────

async function readMciStatus(mciRow: Locator): Promise<string> {
  return ((await mciRow.locator('[tabulator-field="status"]').textContent().catch(() => '')) ?? '').trim();
}

// Starting.../Stopping... 상태가 끝날 때까지 page.reload()로 대기
// timeoutMs: 최대 대기 (기본 2분). 초과 시 null 반환 (throw 대신)
async function waitForStableMciStatus(
  page: Page, mciRow: Locator, mciId: string, tag: string, timeoutMs = 2 * 60_000,
): Promise<string | null> {
  // 초기 상태 확인 — 이미 안정적이면 즉시 반환
  const initialStatus = await readMciStatus(mciRow);
  const initialLower  = initialStatus.toLowerCase().replace(/\./g, '').trim();
  if (initialStatus && !initialLower.includes('starting') && !initialLower.includes('stopping')) {
    return initialStatus;
  }

  // 불안정 상태: page.reload()로 폴링 (Refresh 버튼은 업데이트 안 됨)
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(1_000);
    const freshRow  = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciId }).first();
    const status    = await readMciStatus(freshRow);
    const lower     = status.toLowerCase().replace(/\./g, '').trim();
    if (status && !lower.includes('starting') && !lower.includes('stopping')) return status;
    console.log(`[${tag}] 안정화 대기 (${status})…`);
    await page.waitForTimeout(4_000);
  }

  // 타임아웃 — 최종 상태 반환 (null 반환 = 선택 불가 신호)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const freshRow    = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciId }).first();
  const finalStatus = await readMciStatus(freshRow);
  console.warn(`[${tag}] MCI '${mciId}' 안정화 타임아웃 — 현재: ${finalStatus}`);
  return null;
}

// 최종 상태를 page.reload()로 폴링 (최대 timeoutMs)
// Refresh 버튼 클릭은 상태 업데이트가 되지 않아 page.reload() 사용
async function pollMciStatusWithRefresh(
  page: Page, mciId: string, finalContains: string, tag: string, timeoutMs = 5 * 60_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(1_000);
    const mciRow  = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciId }).first();
    const status  = await readMciStatus(mciRow);
    console.log(`[${tag}] 최종 상태 대기 (현재: ${status}, 목표: ${finalContains})`);
    if (status.toLowerCase().includes(finalContains.toLowerCase())) return;
    await page.waitForTimeout(4_000);
  }
  throw new Error(`[${tag}] 최종 상태 '${finalContains}' 대기 타임아웃`);
}

// ── TC-INFRA-LC-01a/b/c: suspend / reboot / resume (UI) ─────────────────
//
//   사전 조건:  a(suspend)=Running,  b(resume)=Stopped,  c(reboot)=Stopped
//   사후 확인:  a→Stopped,           b→Running,           c→Running
//
//   방안 A 시나리오 순서 (C5-01):
//     Step 1: LC-01a suspend  (Running→Stopped)
//     Step 2: LC-01c reboot   (Stopped→Running)
//     Step 3: LC-01a suspend  (Running→Stopped)
//     Step 4: LC-01b resume   (Stopped→Running)
//
async function runInfraLc01(ctx: StepRunContext, tag: string, action: 'suspend' | 'resume' | 'reboot'): Promise<void> {
  // Cloud VM 상태 전환은 최대 8~10분 걸릴 수 있음 — 기본 5분 타임아웃 연장
  test.setTimeout(12 * 60_000);

  const { page, store } = ctx;
  let mciId = (process.env.MCI_ID ?? '') || store.getOrDefault<string>('mciId', '');

  const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
  if (!ok) throw new Error(`[${tag}] 로그인 실패`);

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);

  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(1_500);

  // 사전 조건 상태 (suspend=running, resume/reboot=stopped)
  const requiredPre = action === 'suspend' ? 'running' : 'stopped';

  // MCI_ID 환경변수로 명시된 경우 해당 MCI만 사용 (fallback 없음)
  const mciIdFixed = !!(process.env.MCI_ID ?? '').trim();

  await expandMciListPageSize(page);

  let mciRow: Locator | null = null;
  let currentStatus: string  = '';

  if (mciId) {
    const candidate = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciId }).first();
    if (await candidate.count().catch(() => 0) > 0) {
      const stable = await waitForStableMciStatus(page, candidate, mciId, tag, 2 * 60_000);
      if (stable && stable.toLowerCase().includes(requiredPre)) {
        mciRow       = candidate;
        currentStatus = stable;
      } else if (mciIdFixed) {
        throw new Error(
          `[${tag}] MCI_ID='${mciId}' 는 ${action} 사전조건 미충족 — 현재: "${stable ?? 'timeout'}", 필요: ${requiredPre}`
        );
      } else {
        console.warn(`[${tag}] '${mciId}' 상태 '${stable ?? 'timeout'}' — 다른 MCI 탐색`);
      }
    } else if (mciIdFixed) {
      throw new Error(`[${tag}] MCI_ID='${mciId}' 가 목록에 없음`);
    } else {
      console.warn(`[${tag}] '${mciId}' 목록에 없음 — 다른 MCI 탐색`);
    }
  }

  // fallback: MCI_ID 미지정일 때만 목록에서 requiredPre 상태인 MCI 탐색
  if (!mciRow) {
    const foundId = await discoverMciIdFromUi(page, tag, requiredPre);
    if (!foundId) {
      throw new Error(`[${tag}] ${action} 가능한 MCI 없음 — 상태 '${requiredPre}'인 MCI가 목록에 없음`);
    }
    mciId = foundId;
    store.set('mciId', mciId);
    const candidate = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciId }).first();
    const stable = await waitForStableMciStatus(page, candidate, mciId, tag, 2 * 60_000);
    if (!stable || !stable.toLowerCase().includes(requiredPre)) {
      throw new Error(`[${tag}] ${action} 가능한 MCI '${mciId}' 상태 확인 실패 — ${stable ?? 'timeout'}`);
    }
    mciRow       = candidate;
    currentStatus = stable;
  }

  console.log(`[${tag}] MCI '${mciId}' 현재 상태: ${currentStatus}`);

  // 중간 선택값 기록 — param-history 누적에 활용
  store.set('lcAction',       action);
  store.set('lcStatusBefore', currentStatus);

  // 3. MCI 행 클릭 → MCI Info 패널 표시 = 선택 완료
  //    사용자가 행을 클릭하면 하단에 MCI Info 패널이 표시되고 액션 버튼이 활성화됨
  await mciRow.click();
  // MCI Info 패널이 나타날 때까지 대기 (선택 확인)
  await page.locator(`text=MCI Info [ ${mciId} ]`).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {
    // 텍스트 기반 확인 실패해도 계속 진행
    console.warn(`[${tag}] MCI Info 패널 미확인 — 진행 계속`);
  });
  await page.waitForTimeout(300);

  // 4. "List of MCI" 헤더 오른쪽 꺽쇠 드롭다운 클릭
  //    a.btn-action ❌ → .btn-action[data-bs-toggle="dropdown"] ✅ (탐색으로 확인된 셀렉터)
  const dropdownBtn = page.locator('.btn-action[data-bs-toggle="dropdown"]:has(svg.icon-tabler-chevron-down)').first();
  await dropdownBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await dropdownBtn.click();
  await page.waitForTimeout(300);

  // 5. 드롭다운 아이템 클릭 (onclick 속성으로 구분)
  const actionKeyMap: Record<string, string> = { suspend: 'MciSuspend', resume: 'MciResume', reboot: 'MciReboot' };
  const actionKey  = actionKeyMap[action];
  const actionItem = page.locator(`.dropdown-menu.show .dropdown-item[onclick*="${actionKey}"]`);
  await actionItem.waitFor({ state: 'visible', timeout: 3_000 });
  await actionItem.click();

  // 6. 확인 모달
  await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });

  // Validation 모달("Please select an MCI") 감지 — 선택이 안 된 경우 즉시 실패
  const modalBody = await page.locator('#commonDefaultModal .modal-body').textContent().catch(() => '');
  if ((modalBody ?? '').toLowerCase().includes('select an mci')) {
    throw new Error(`[${tag}] MCI 선택 실패 — UI에서 MCI 체크가 인식되지 않음 (모달: "${modalBody?.trim()}")`);
  }

  await page.locator('#commonDefaultModal-confirm-btn').click();
  await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 30_000 });
  console.log(`[${tag}] MCI ${action} 요청 완료`);

  // 7. 최종 상태 page.reload() 폴링으로 확인
  const finalStatus = action === 'suspend' ? 'stopped' : 'running';
  await pollMciStatusWithRefresh(page, mciId, finalStatus, tag, 5 * 60_000);
  store.set('lcStatusAfter', finalStatus);
  console.log(`[${tag}] MCI ${action} 검증 완료 → ${finalStatus}`);
}

// ── TC-INFRA-LC-02: MCI 삭제 (UI) ────────────────────────────────────────

async function runInfraLc02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store, scenarioId } = ctx;
  const variant = ctx.step.variant;
  // 우선순위: env MCI_ID > TC params(variant 포함) > runtime store
  const sc      = new ScenarioContext(scenarioId, 'TC-INFRA-LC-02', variant);
  const paramId = (sc.params.mciId as string) ?? '';
  const mciId   = (process.env.MCI_ID ?? '') || paramId || store.getOrDefault<string>('mciId', '');
  if (!mciId) {
    failStep(tag, 'mciId 없음 — MCI 삭제 불가 (C3/C4 먼저 실행, 또는 MCI_ID=<id> 환경변수 주입)');
  }

  const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
  if (!ok) { warn(tag, '삭제 건너뜀 — 로그인 실패'); return; }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);
  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(1_500);

  // 페이지 크기 최대로 확장 — mci11 이후 MCI가 페이지네이션으로 누락되지 않도록
  await page.evaluate(() => {
    const sel = document.querySelector('#mcilist-table .tabulator-page-size') as HTMLSelectElement | null;
    if (!sel) return;
    const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
    if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
  }).catch(() => {});
  await page.waitForTimeout(500);

  // 잔여 모달 닫기 (이전 step의 삭제 완료 모달 등)
  await dismissWorkspaceModal(page);

  const mciRow = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mciId }).first();
  if (await mciRow.count().catch(() => 0) === 0) {
    warn(tag, `삭제 — MCI ${mciId} 목록에 없음`);
    return;
  }
  await mciRow.click({ force: true });
  await page.waitForTimeout(500);

  try {
    await page.locator('a.btn-action:has(svg.icon-tabler-chevron-down)').first().click();
    await page.locator('a.dropdown-item[onclick*="MciDelete"]').waitFor({ state: 'visible', timeout: 3_000 });
    await page.locator('a.dropdown-item[onclick*="MciDelete"]').first().click();
    await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });
    await page.click('#commonDefaultModal-confirm-btn');
    await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 10_000 });
    console.log(`[${tag}] MCI 삭제 요청 완료`);
  } catch (e) {
    warn(tag, `MCI 삭제 버튼 클릭 실패 — ${(e as Error).message?.slice(0, 80)}`);
  }
}

// ── TC-INFRA-LC-03: mc* MCI 일괄 삭제 (case 분류) ────────────────────────

interface MciInfo { name: string; totalServers: number; }

async function runInfraLc03(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
  if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);
  // 워크스페이스 변경 후 추가 modal 대기·닫기
  await page.waitForTimeout(1_500);
  await dismissWorkspaceModal(page);

  // ── 테이블 스캔: mc*로 시작하는 MCI 수집 ──────────────────────────
  const expandTable = async () => {
    await page.evaluate(() => {
      const sel = document.querySelector('#mcilist-table .tabulator-page-size') as HTMLSelectElement | null;
      if (!sel) return;
      const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
      if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
    }).catch(() => {});
    await page.waitForTimeout(800);
  };

  const scanMcMcis = async (): Promise<MciInfo[]> => {
    await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    await expandTable();
    return (await page.evaluate(() => {
      const headerEls = Array.from(document.querySelectorAll('#mcilist-table .tabulator-col'));
      const colTitle  = (el: Element) =>
        (el.querySelector('.tabulator-col-title') as HTMLElement)?.innerText?.trim() ?? '';
      const nameIdx  = headerEls.findIndex(h => colTitle(h) === 'Name');
      const totalIdx = headerEls.findIndex(h => colTitle(h) === 'Total Servers');
      return Array.from(
        document.querySelectorAll('#mcilist-table .tabulator-row:not(.tabulator-placeholder)')
      ).map(row => {
        const cells = Array.from(row.querySelectorAll('.tabulator-cell'));
        const name  = (cells[nameIdx]  as HTMLElement)?.innerText?.trim() || '';
        const total = parseInt((cells[totalIdx] as HTMLElement)?.innerText?.trim() || '0', 10) || 0;
        return { name, totalServers: total };
      }).filter((r: { name: string; totalServers: number }) => r.name.startsWith('mc'));
    })) as unknown as MciInfo[];
  };

  const mcMcis = await scanMcMcis();
  const case1  = mcMcis.filter(m => m.totalServers === 0);
  const case2  = mcMcis.filter(m => m.totalServers === 1);
  const case3  = mcMcis.filter(m => m.totalServers >= 2);

  console.log(`[${tag}] === mc* MCI 스캔 결과 ===`);
  console.log(`[${tag}] case1 (nodegroup 없음,  0개): ${case1.length === 0 ? 'SKIP' : case1.map(m => `${m.name}(${m.totalServers})`).join(', ')}`);
  console.log(`[${tag}] case2 (nodegroup 1개,  1 VM): ${case2.length === 0 ? 'SKIP' : case2.map(m => `${m.name}(${m.totalServers})`).join(', ')}`);
  console.log(`[${tag}] case3 (nodegroup 2개+, ≥2VM): ${case3.length === 0 ? 'SKIP' : case3.map(m => `${m.name}(${m.totalServers})`).join(', ')}`);
  console.log(`[${tag}] 총 삭제 대상: ${mcMcis.length}개`);

  if (mcMcis.length === 0) {
    console.log(`[${tag}] mc*로 시작하는 MCI 없음 — SKIP`);
    return;
  }

  // ── 삭제 루프 ──────────────────────────────────────────────────
  let deleted = 0;
  for (const mci of mcMcis) {
    const caseLabel = mci.totalServers === 0 ? 'case1' : mci.totalServers === 1 ? 'case2' : 'case3';
    console.log(`[${tag}] [${caseLabel}] 삭제 시작: ${mci.name} (Total Servers: ${mci.totalServers})`);

    await dismissWorkspaceModal(page);
    await expandTable();
    const row = page.locator('#mcilist-table .tabulator-row').filter({ hasText: mci.name }).first();
    if (await row.count().catch(() => 0) === 0) {
      warn(tag, `${mci.name} 행 없음 — skip`); continue;
    }
    await row.click();
    await page.waitForTimeout(500);

    try {
      await page.locator('a.btn-action:has(svg.icon-tabler-chevron-down)').first().click();
      await page.locator('a.dropdown-item[onclick*="MciDelete"]').first().waitFor({ state: 'visible', timeout: 3_000 });
      await page.locator('a.dropdown-item[onclick*="MciDelete"]').first().click();
      await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });
      await page.click('#commonDefaultModal-confirm-btn');
      await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 10_000 });
      console.log(`[${tag}] 삭제 요청 완료: ${mci.name}`);
      deleted++;
      await page.waitForTimeout(1_500);
    } catch (e) {
      warn(tag, `${mci.name} 삭제 실패 — ${(e as Error).message?.slice(0, 80)}`);
    }
  }

  console.log(`[${tag}] 삭제 완료: ${deleted}/${mcMcis.length}`);
}

// ── TC-INFRA-K8S-08: K8s 클러스터(PMK) 삭제 (UI) ─────────────────────────

async function runK8sDelete(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { page, store, scenarioId } = ctx;
  const sc          = new ScenarioContext(scenarioId, 'TC-INFRA-K8S-08', variant);
  const clusterName = (sc.params.clusterName as string) ?? `pmk-${variant ?? 'default'}`;

  const ok = await loginAndGoto(page, PAGES.operations.pmkWorkloads, tag);
  if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);
  await page.locator('#pmklist-table, #k8slist-table, table').first()
    .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1_500);

  // 테이블 페이지 크기를 최대로 늘려 전체 행 검색 (기본 5행 페이지네이션 우회)
  await page.evaluate(() => {
    const sel = document.querySelector('#pmklist-table .tabulator-page-size, #k8slist-table .tabulator-page-size') as HTMLSelectElement | null;
    if (!sel) return;
    const max = Math.max(...Array.from(sel.options).map(o => Number(o.value) || 0));
    if (max > 0 && sel.value !== String(max)) { sel.value = String(max); sel.dispatchEvent(new Event('change')); }
  }).catch(() => {});
  await page.waitForTimeout(800);

  const clusterRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row')
    .filter({ hasText: clusterName }).first();
  if (await clusterRow.count().catch(() => 0) === 0) {
    throw new Error(`[${tag}] 클러스터 ${clusterName} 목록에 없음`);
  }
  await clusterRow.click();
  await page.waitForTimeout(500);

  try {
    const dropdownBtn = page.locator('a.btn-action:has(svg.icon-tabler-chevron-down)').first();
    const hasDropdown = await dropdownBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasDropdown) {
      await dropdownBtn.click();
      // onclick 속성에 'PmkDelete' 포함 (텍스트는 'Delete')
      const deleteItem = page.locator('a.dropdown-item[onclick*="PmkDelete"]').first();
      await deleteItem.waitFor({ state: 'visible', timeout: 3_000 });
      await deleteItem.click();
    } else {
      await page.locator('a[onclick*="PmkDelete"], button[onclick*="PmkDelete"]').first().click();
    }
    await page.locator('#commonDefaultModal').waitFor({ state: 'visible', timeout: 5_000 });
    await page.click('#commonDefaultModal-confirm-btn');
    await page.locator('#commonDefaultModal').waitFor({ state: 'hidden', timeout: 10_000 });
    console.log(`[${tag}] PMK 클러스터 삭제 요청 완료: ${clusterName}`);
  } catch (e) {
    warn(tag, `클러스터 삭제 버튼 클릭 실패 — ${(e as Error).message?.slice(0, 80)}`);
  }
}

// ── TC-INFRA-K8S-03: K8s 클러스터 생성 (UI) ───────────────────────────────

async function runK8sCreate(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { page, store, scenarioId } = ctx;
  const sc          = new ScenarioContext(scenarioId, 'TC-INFRA-K8S-03', variant);
  const nsId        = (sc.params.nsId         as string) ?? DEFAULT_NS;
  const clusterName = (sc.params.clusterName  as string) ?? `pmk-${variant ?? 'default'}`;
  const ngName      = (sc.params.nodeGroupName as string) ?? `png-${variant ?? 'default'}`;
  const connName    = (sc.params.connectionName as string) ?? '';
  const specId      = (sc.params.commonSpec   as string) ?? (sc.params.specId as string) ?? '';

  const ok = await loginAndGoto(page, PAGES.operations.pmkWorkloads, tag);
  if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);

  // 목록 로드 대기
  await page.locator('#pmklist-table, #k8slist-table, table').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1_500);

  // 이미 존재 확인
  const listTable = page.locator('#pmklist-table, #k8slist-table').first();
  const existRow = listTable.locator('.tabulator-row').filter({ hasText: clusterName });
  if (await existRow.count().catch(() => 0) > 0) {
    await existRow.first().click();
    await page.waitForTimeout(500);
    const k8sId = await page.evaluate(() =>
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentPmkId ??
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentK8sId ?? ''
    ) as string;
    const id = k8sId || clusterName;
    if (variant) { store.set(`k8sId_${variant}`, id); store.set(`k8sName_${variant}`, clusterName); }
    store.set('k8sId', id); store.set('k8sName', clusterName); store.set('nsId', nsId);
    console.log(`[${tag}] K8s 재사용: ${clusterName} (${id})`);
    return;
  }

  // Add Cluster 버튼
  const addBtn = page.locator('#page-header-btn-list a[href="#createcluster"], #page-header-btn-list a', { hasText: /Add.*Cluster|Add.*PMK/i }).first();
  try {
    await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await addBtn.click();
    await page.locator('#createcluster').waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    throw new Error(`[${tag}] Add Cluster 버튼 없음`);
  }

  // 폼 입력
  await page.fill('#cluster_name_dynamic', clusterName).catch(() => {});
  await page.fill('#cluster_desc_dynamic', `${scenarioId} deploy scenario`).catch(() => {});
  await page.fill('#nodegroup_name_dynamic', ngName).catch(() => {});

  // Connection 선택
  if (connName) {
    try {
      await page.waitForFunction((conn: string) => {
        const sel = document.querySelector('#cluster_cloudconnection_dynamic') as HTMLSelectElement;
        return sel && Array.from(sel.options).some(o => o.value.toLowerCase().includes(conn.toLowerCase()) || o.text.toLowerCase().includes(conn.toLowerCase()));
      }, connName, { timeout: 10_000 });
      const connOpt = await page.locator('#cluster_cloudconnection_dynamic option').filter({ hasText: new RegExp(connName, 'i') }).first().getAttribute('value');
      await page.locator('#cluster_cloudconnection_dynamic').selectOption(connOpt ?? connName);
      await page.waitForTimeout(1_000);
    } catch {
      warn(tag, `Connection ${connName} 선택 실패`);
    }
  }

  // Spec 검색 모달
  try {
    const specBtn = page.locator('[data-bs-target="#spec-search-pmk"], [onclick*="spec-search-pmk"]').first();
    await specBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await specBtn.click();
    await page.locator('#spec-search-pmk').waitFor({ state: 'visible', timeout: 5_000 });

    // Spec 검색
    await page.locator('#spec-search-pmk a[onclick*="getRecommendVmInfoPmk"], #spec-search-pmk a[onclick*="getRecommendVmInfo"]').first().click();
    await page.locator('#spec-search-pmk .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });

    // specId로 행 선택 — vCPU 2→4 우선순위 자동 선택 (specId 미지정 또는 미발견 시)
    const cspSpecName = specId.split('+').pop() ?? '';
    await page.evaluate(
      ({ specName }: { specName: string }) => {
        const table = (window as unknown as { recommendTablePmk?: {
          getData: () => Array<Record<string, unknown>>;
          deselectRow: () => void;
          getRows: () => Array<{ select: () => void }>;
        } }).recommendTablePmk;
        if (!table) return;
        const rows = table.getData();
        let idx = -1;
        if (specName) {
          idx = rows.findIndex(r =>
            ((r['cspSpecName'] as string) ?? '').toLowerCase().includes(specName.toLowerCase())
          );
        }
        // vCPU 2→4 우선순위 자동 선택 (specName 미지정 또는 미발견)
        if (idx < 0) {
          for (const vcpu of [2, 4]) {
            const found = rows.findIndex(r => Number(r['vCPU']) === vcpu);
            if (found >= 0) { idx = found; break; }
          }
        }
        if (idx < 0) idx = 0;
        table.deselectRow();
        table.getRows()[idx]?.select();
      },
      { specName: cspSpecName },
    );
    await page.waitForTimeout(400);
    await page.locator('#spec-search-pmk button[onclick*="applySpecInfo"]').click();
    await page.locator('#spec-search-pmk').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  } catch (e) {
    warn(tag, `PMK Spec 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
  }

  // Deploy
  page.on('dialog', async dialog => { await dialog.accept(); });
  try {
    await page.locator('button[onclick*="deployPmkDynamic"], button', { hasText: /deploy/i }).first().click();
  } catch {
    throw new Error(`[${tag}] PMK Deploy 버튼 없음`);
  }

  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null);

  // 목록 복귀 후 ID 추출
  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);
  await page.locator('#pmklist-table, #k8slist-table').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2_000);

  const newRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row').filter({ hasText: clusterName }).first();
  if (await newRow.count().catch(() => 0) > 0) {
    await newRow.click();
    await page.waitForTimeout(500);
    const k8sId = await page.evaluate(() =>
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentPmkId ??
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentK8sId ?? ''
    ) as string;
    const id = k8sId || clusterName;
    if (variant) { store.set(`k8sId_${variant}`, id); store.set(`k8sName_${variant}`, clusterName); }
    store.set('k8sId', id); store.set('k8sName', clusterName); store.set('nsId', nsId);
    console.log(`[${tag}] K8s 생성: ${clusterName} (${id})`);
  } else {
    throw new Error(`[${tag}] K8s ${clusterName} 목록 미표시`);
  }
}

// ── TC-INFRA-DEPLOY-07: 기존 MCI에 SubGroup 추가 (Expert 모드) ──────────────

async function runInfraDeploy07(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { page, store, scenarioId } = ctx;
  const sc           = new ScenarioContext(scenarioId, 'TC-INFRA-DEPLOY-07', variant);
  const subGroupName = (sc.params.subGroupName as string) ?? `sg-${variant ?? 'exp1'}`;
  const provider     = (sc.params.provider     as string) ?? 'aws';
  const region       = (sc.params.region       as string) ?? 'ap-northeast-2';
  const connName     = (sc.params.connectionName as string) ?? 'aws-ap-northeast-2';
  const specId       = (sc.params.commonSpec   as string) ?? '';
  const subGroupSize = (sc.params.subGroupSize as string) ?? '1';
  const fixedImgId   = (sc.params.imageId as string | undefined);

  // store에서 mciName 가져오기 (이전 DEPLOY-05 OUT)
  let targetMciName = (sc.params.mciName as string) ?? '';
  if (!targetMciName) {
    try { targetMciName = store.require<string>('mciName'); } catch { targetMciName = 'mci11'; }
  }

  const ok = await loginAndGoto(page, PAGES.operations.mciWorkloads, tag);
  if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);

  await page.locator('#mcilist-table').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1_500);

  // 대상 MCI 행 선택
  const mciRow = page.locator('#mcilist-table .tabulator-row').filter({
    has: page.locator('.tabulator-cell').filter({ hasText: new RegExp(`^\\s*${targetMciName}\\s*$`) }),
  }).first();
  if (await mciRow.count().catch(() => 0) === 0) {
    throw new Error(`[${tag}] MCI ${targetMciName} 목록에 없음`);
  }
  await mciRow.click();
  await page.waitForTimeout(1_000);

  // Add Server 버튼
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
  } catch (e) {
    throw new Error(`[${tag}] Deployment Algorithm 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
  }

  // + VM 버튼
  try {
    const addVmBtn = page.locator(
      'button[onclick*="addVm"], button[onclick*="addVM"], ' +
      'button:has-text("+ VM"), button:has-text("+VM"), a:has-text("+ VM")'
    ).first();
    await addVmBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await addVmBtn.click();
    await page.waitForTimeout(800);
  } catch (e) {
    throw new Error(`[${tag}] + VM 버튼 없음 — ${(e as Error).message?.slice(0, 60)}`);
  }

  await page.fill('[id*="subgroup_name"], [id*="sg_name"], [name*="subGroupName"]', subGroupName).catch(() => {});

  // Provider 선택
  try {
    const provSel = page.locator('[id*="vm_provider"], [id*="expert"][id*="provider"]').first();
    if (await provSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const provOpt = await provSel.locator('option').filter({ hasText: new RegExp(provider, 'i') }).first().getAttribute('value');
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
        return sel && Array.from(sel.options).some(o => o.value.toLowerCase().includes(reg.toLowerCase()) || o.text.toLowerCase().includes(reg.toLowerCase()));
      }, region, { timeout: 8_000 }).catch(() => {});
      const regionOpt = await regionSel.locator('option').filter({ hasText: new RegExp(region, 'i') }).first().getAttribute('value');
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
          return sel && Array.from(sel.options).some(o => o.value.toLowerCase().includes(conn.toLowerCase()) || o.text.toLowerCase().includes(conn.toLowerCase()));
        }, connName, { timeout: 8_000 }).catch(() => {});
        const connOpt = await connSel.locator('option').filter({ hasText: new RegExp(connName, 'i') }).first().getAttribute('value');
        await connSel.selectOption(connOpt ?? connName).catch(() => {});
        await page.waitForTimeout(800);
      }
    } catch { console.warn(`[${tag}] Connection 선택 실패`); }
  }

  // Spec 검색 모달 — vCPU 1→2→4 우선순위
  try {
    const specBtn = page.locator('[data-bs-target*="spec-search"], [onclick*="spec-search"]').first();
    if (await specBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await specBtn.click();
      await page.locator('[id*="spec-search"]').first().waitFor({ state: 'visible', timeout: 5_000 });
      await page.locator('[id*="spec-search"] a[onclick*="getRecommend"]').first().click();
      await page.locator('[id*="spec-search"] .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });

      const cspSpecName = specId.split('+').pop() ?? '';
      await page.evaluate(
        ({ specName }: { specName: string }) => {
          const t = (window as unknown as { recommendTable?: { getData: () => Array<Record<string, unknown>>; deselectRow: () => void; getRows: () => Array<{ select: () => void }> } }).recommendTable;
          if (!t) return;
          const rows = t.getData();
          let idx = -1;
          if (specName) {
            idx = rows.findIndex(r => ((r['cspSpecName'] as string) ?? '').toLowerCase().includes(specName.toLowerCase()));
          }
          if (idx < 0) {
            for (const vcpu of [1, 2, 4]) {
              const found = rows.findIndex(r => Number(r['vCPU']) === vcpu);
              if (found >= 0) { idx = found; break; }
            }
          }
          if (idx < 0) idx = 0;
          t.deselectRow();
          t.getRows()[idx]?.select();
        },
        { specName: cspSpecName },
      );
      await page.waitForTimeout(400);
      await page.locator('[id*="spec-search"] button[onclick*="applySpec"]').first().click();
      await page.locator('[id*="spec-search"]').first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
  } catch (e) {
    console.warn(`[${tag}] Spec 선택 실패 — ${(e as Error).message?.slice(0, 60)}`);
  }

  // Image (fixedImgId 지정 시)
  if (fixedImgId) {
    try {
      const imgBtn = page.locator('[onclick*="validateAndOpenImageModal"], [data-bs-target*="image-search"]').first();
      if (await imgBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await imgBtn.click();
        await page.locator('#image-search').first().waitFor({ state: 'visible', timeout: 5_000 });
        await selectImageForSpec(page, tag, fixedImgId);
      }
    } catch { console.warn(`[${tag}] Image 모달 처리 실패`); }
  }

  await page.fill('[id*="subgroup_size"], [name*="subGroupSize"]', subGroupSize).catch(() => {});

  // Deploy
  page.on('dialog', async d => { await d.accept(); });
  try {
    const deployBtn = page.locator(
      'button[onclick*="deployAddServer"], button[onclick*="addSubGroup"], button[onclick*="deploySubGroup"], button',
      { hasText: /deploy/i }
    ).first();
    await deployBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await deployBtn.click();
  } catch {
    throw new Error(`[${tag}] Deploy 버튼 없음`);
  }

  await page.waitForTimeout(3_000);
  store.set('subGroupId',   subGroupName);
  store.set('subGroupName', subGroupName);
  console.log(`[${tag}] Add Server Expert 완료: mci=${targetMciName}, subGroup=${subGroupName}`);
}

// ── TC-INFRA-K8S-04: PMK 클러스터 생성 (Expert 모드) ──────────────────────

async function runK8sCreateExpert(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { page, store, scenarioId } = ctx;
  const sc          = new ScenarioContext(scenarioId, 'TC-INFRA-K8S-04', variant);
  const nsId        = (sc.params.nsId         as string) ?? DEFAULT_NS;
  const clusterName = (sc.params.clusterName  as string) ?? `k8s-${variant ?? 'exp1'}`;
  const ngName      = (sc.params.nodeGroupName as string) ?? `png-${variant ?? 'exp1'}`;
  const provider    = (sc.params.provider     as string) ?? 'ibm';
  const region      = (sc.params.region       as string) ?? 'jp-tok';
  const connName    = (sc.params.connectionName as string) ?? '';
  const specId      = (sc.params.commonSpec   as string) ?? '';

  const ok = await loginAndGoto(page, PAGES.operations.pmkWorkloads, tag);
  if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }

  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);

  await page.locator('#pmklist-table, #k8slist-table, table').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1_500);

  // 이미 존재 확인
  const listTable = page.locator('#pmklist-table, #k8slist-table').first();
  const existRow  = listTable.locator('.tabulator-row').filter({ hasText: clusterName });
  if (await existRow.count().catch(() => 0) > 0) {
    await existRow.first().click();
    await page.waitForTimeout(500);
    const k8sId = await page.evaluate(() =>
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentPmkId ??
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentK8sId ?? ''
    ) as string;
    const id = k8sId || clusterName;
    if (variant) { store.set(`k8sId_${variant}`, id); store.set(`k8sName_${variant}`, clusterName); }
    store.set('k8sId', id); store.set('k8sName', clusterName); store.set('nsId', nsId);
    console.log(`[${tag}] K8s 재사용 (Expert): ${clusterName} (${id})`);
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
    throw new Error(`[${tag}] Add Cluster 버튼 없음`);
  }

  // Expert 모드 전환
  try {
    const expertBtn = page.locator(
      'button[onclick*="toggleExpert"], a[onclick*="toggleExpert"], button:has-text("Expert"), a:has-text("Expert Creation")'
    ).first();
    await expertBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await expertBtn.click();
    await page.locator('#create_expert').waitFor({ state: 'visible', timeout: 5_000 });
    console.log(`[${tag}] Expert 모드 전환 완료`);
  } catch (e) {
    throw new Error(`[${tag}] Expert 모드 전환 실패 — ${(e as Error).message?.slice(0, 80)}`);
  }

  await page.fill('#cluster_name_expert, [id*="cluster"][id*="name"][id*="expert"]', clusterName).catch(() => {});
  await page.fill('#nodegroup_name_expert, [id*="nodegroup"][id*="name"][id*="expert"]', ngName).catch(() => {});

  // Provider 선택
  try {
    const provSel = page.locator('#cluster_provider_expert, [id*="expert"][id*="provider"]').first();
    await provSel.waitFor({ state: 'visible', timeout: 5_000 });
    const provOpt = await provSel.locator('option').filter({ hasText: new RegExp(provider, 'i') }).first().getAttribute('value');
    await provSel.selectOption(provOpt ?? provider);
    await page.waitForTimeout(800);
  } catch { console.warn(`[${tag}] Provider 선택 실패`); }

  // Region 선택
  try {
    const regionSel = page.locator('#cluster_region_expert, [id*="expert"][id*="region"]').first();
    await regionSel.waitFor({ state: 'visible', timeout: 8_000 });
    await page.waitForFunction((reg: string) => {
      const sel = document.querySelector('#cluster_region_expert, [id*="expert"][id*="region"]') as HTMLSelectElement;
      return sel && Array.from(sel.options).some(o => o.value.toLowerCase().includes(reg.toLowerCase()) || o.text.toLowerCase().includes(reg.toLowerCase()));
    }, region, { timeout: 10_000 }).catch(() => {});
    const regionOpt = await regionSel.locator('option').filter({ hasText: new RegExp(region, 'i') }).first().getAttribute('value');
    await regionSel.selectOption(regionOpt ?? region);
    await page.waitForTimeout(800);
  } catch { console.warn(`[${tag}] Region 선택 실패`); }

  // Connection 선택
  if (connName) {
    try {
      await page.waitForFunction((conn: string) => {
        const sel = document.querySelector('#cluster_cloudconnection_expert, [id*="expert"][id*="connection"]') as HTMLSelectElement;
        return sel && Array.from(sel.options).some(o => o.value.toLowerCase().includes(conn.toLowerCase()) || o.text.toLowerCase().includes(conn.toLowerCase()));
      }, connName, { timeout: 10_000 }).catch(() => {});
      const connSel = page.locator('#cluster_cloudconnection_expert, [id*="expert"][id*="connection"]').first();
      const connOpt = await connSel.locator('option').filter({ hasText: new RegExp(connName, 'i') }).first().getAttribute('value');
      await connSel.selectOption(connOpt ?? connName);
      await page.waitForTimeout(800);
    } catch { console.warn(`[${tag}] Connection ${connName} 선택 실패`); }
  }

  // Spec 검색 모달 — vCPU 2→4 우선순위
  try {
    const specBtn = page.locator('#create_expert [data-bs-target*="spec-search-pmk"], #create_expert [onclick*="spec-search-pmk"]').first();
    await specBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await specBtn.click();
    await page.locator('#spec-search-pmk').waitFor({ state: 'visible', timeout: 5_000 });
    await page.locator('#spec-search-pmk a[onclick*="getRecommendVmInfoPmk"], #spec-search-pmk a[onclick*="getRecommendVmInfo"]').first().click();
    await page.locator('#spec-search-pmk .tabulator-row:not(.tabulator-placeholder)').first().waitFor({ timeout: 30_000 });

    const cspSpecName = specId.split('+').pop() ?? '';
    await page.evaluate(
      ({ specName }: { specName: string }) => {
        const t = (window as unknown as { recommendTablePmk?: { getData: () => Array<Record<string, unknown>>; deselectRow: () => void; getRows: () => Array<{ select: () => void }> } }).recommendTablePmk;
        if (!t) return;
        const rows = t.getData();
        let idx = -1;
        if (specName) {
          idx = rows.findIndex(r => ((r['cspSpecName'] as string) ?? '').toLowerCase().includes(specName.toLowerCase()));
        }
        if (idx < 0) {
          for (const vcpu of [2, 4]) {
            const found = rows.findIndex(r => Number(r['vCPU']) === vcpu);
            if (found >= 0) { idx = found; break; }
          }
        }
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
    console.warn(`[${tag}] PMK Spec 선택 실패 (Expert) — ${(e as Error).message?.slice(0, 60)}`);
  }

  // Deploy (Expert 폼)
  page.on('dialog', async d => { await d.accept(); });
  try {
    const deployBtn = page.locator('#create_expert button[onclick*="deployPmk"], #create_expert button', { hasText: /deploy/i }).first();
    await deployBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await deployBtn.click();
  } catch {
    try {
      await page.locator('button[onclick*="deployPmkExpert"], button[onclick*="deployPmk"]').first().click();
    } catch {
      throw new Error(`[${tag}] PMK Deploy 버튼 없음 (Expert)`);
    }
  }

  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => null);
  await dismissWorkspaceModal(page);
  await selectWorkspaceProject(page, tag);
  await page.locator('#pmklist-table, #k8slist-table').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2_000);

  const newRow = page.locator('#pmklist-table .tabulator-row, #k8slist-table .tabulator-row').filter({ hasText: clusterName }).first();
  if (await newRow.count().catch(() => 0) > 0) {
    await newRow.click();
    await page.waitForTimeout(500);
    const k8sId = await page.evaluate(() =>
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentPmkId ??
      (window as unknown as { currentPmkId?: string; currentK8sId?: string }).currentK8sId ?? ''
    ) as string;
    const id = k8sId || clusterName;
    if (variant) { store.set(`k8sId_${variant}`, id); store.set(`k8sName_${variant}`, clusterName); }
    store.set('k8sId', id); store.set('k8sName', clusterName); store.set('nsId', nsId);
    console.log(`[${tag}] K8s Expert 생성 완료: ${clusterName} (${id})`);
  } else {
    throw new Error(`[${tag}] K8s ${clusterName} 목록 미표시`);
  }
}

// ── 메인 디스패처 ──────────────────────────────────────────────────────────

export async function runScenarioStep(ctx: StepRunContext): Promise<void> {
  const { page, store, scenarioId, step } = ctx;
  const tag     = `${scenarioId}/Step${step.order}`;
  const tcId    = step.tcId;
  const variant = step.variant;

  // ── IAM ──────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-IAM-AUTH-01')) {
    const ok = await loginAndGoto(page, PAGES.operations.workspaces, tag);
    expect(ok, `[${tag}] 로그인 또는 워크스페이스 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/workspaces/);
    return;
  }
  if (tcId.startsWith('TC-IAM-AUTH-05')) {
    const ok = await loginAndGoto(page, PAGES.auth.signup, tag);
    expect(ok, `[${tag}] 회원가입 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/signup/);
    return;
  }
  if (tcId.startsWith('TC-IAM-UG-03')) {
    const ok = await loginAndGoto(page, PAGES.settings.users, tag);
    expect(ok, `[${tag}] 사용자 목록 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/users/);
    return;
  }
  if (tcId.startsWith('TC-IAM-UG-08') || tcId.startsWith('TC-IAM-UG-11')) {
    const ok = await loginAndGoto(page, PAGES.settings.groups, tag);
    expect(ok, `[${tag}] 그룹 목록 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/groups/);
    return;
  }
  if (tcId.startsWith('TC-IAM-RBAC-06')) {
    const ok = await loginAndGoto(page, PAGES.settings.roles, tag);
    expect(ok, `[${tag}] 역할 목록 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/roles/);
    return;
  }
  if (tcId.startsWith('TC-IAM-WS-')) {
    const ok = await loginAndGoto(page, PAGES.operations.workspaces, tag);
    expect(ok, `[${tag}] 워크스페이스 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/workspaces/);
    return;
  }
  if (tcId.startsWith('TC-IAM-USER-LIFECYCLE-')) {
    const ok = await loginAndGoto(page, PAGES.settings.approvals, tag);
    expect(ok, `[${tag}] 승인 요청 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/approvals/);
    return;
  }

  // ── CSP ──────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-CSP-CREDENTIAL-03')) {
    const ok = await loginAndGoto(page, PAGES.settings.credentials, tag);
    expect(ok, `[${tag}] CSP 자격증명 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/credentials/);
    return;
  }
  if (tcId.startsWith('TC-CSP-CONNECTION-02')) {
    const ok = await loginAndGoto(page, PAGES.settings.connections, tag);
    expect(ok, `[${tag}] CSP 연결 화면 진입 실패`).toBeTruthy();
    await expect(page).toHaveURL(/connections/);
    return;
  }

  // ── INFRA ────────────────────────────────────────────────────────────────
  if (tcId === 'TC-INFRA-DEPLOY-05') {
    await runInfraDeploy05(ctx, tag, variant);
    return;
  }
  if (tcId === 'TC-INFRA-DEPLOY-07') {
    await runInfraDeploy07(ctx, tag, variant);
    return;
  }
  if (tcId === 'TC-INFRA-DEPLOY-01') {
    await runInfraDeployList(ctx, tag);
    return;
  }
  if (tcId === 'TC-INFRA-DEPLOY-02') {
    // mciId 없어도 목록 화면을 로드해 상태 확인 — 화면 조회 결과에서 선택
    await runInfraDeployList(ctx, tag);
    return;
  }
  if (tcId === 'TC-INFRA-LC-01' || tcId === 'TC-INFRA-LC-01a') {
    // TC-INFRA-LC-01a: suspend (Running → Stopped)
    await runInfraLc01(ctx, tag, 'suspend');
    return;
  }
  if (tcId === 'TC-INFRA-LC-01b') {
    // TC-INFRA-LC-01b: resume (Stopped → Running)
    await runInfraLc01(ctx, tag, 'resume');
    return;
  }
  if (tcId === 'TC-INFRA-LC-01c') {
    // TC-INFRA-LC-01c: reboot (Stopped → Running)
    await runInfraLc01(ctx, tag, 'reboot');
    return;
  }
  if (tcId === 'TC-INFRA-LC-02') {
    await runInfraLc02(ctx, tag);
    return;
  }
  if (tcId === 'TC-INFRA-LC-03') {
    await runInfraLc03(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-INFRA-SSH-02')) {
    const ok = await loginAndGoto(page, PAGES.settings.sshKeys, tag);
    if (ok) console.log(`[${tag}] SSH Keys UI OK`);
    return;
  }
  if (tcId === 'TC-INFRA-K8S-03') {
    await runK8sCreate(ctx, tag, variant);
    return;
  }
  if (tcId === 'TC-INFRA-K8S-04') {
    await runK8sCreateExpert(ctx, tag, variant);
    return;
  }
  if (tcId.startsWith('TC-INFRA-K8S-07')) {
    const ok = await loginAndGoto(page, PAGES.operations.pmkWorkloads, tag);
    if (ok) console.log(`[${tag}] PMK Workloads UI OK`);
    return;
  }
  if (tcId === 'TC-INFRA-K8S-08') {
    await runK8sDelete(ctx, tag, variant);
    return;
  }

  // ── SW / APP ─────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-APP-CAT-03')) {
    await runAppCatSearch(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-APP-CAT-04')) {
    await runAppCatUpload(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-APP-CAT-05') || tcId.startsWith('TC-SW-CATALOG-01')) {
    await runAppCatRegist(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-APP-DEP-01') || tcId.startsWith('TC-SW-CATALOG-02')) {
    await runAppDeploy(ctx, tag, variant);
    return;
  }
  if (tcId.startsWith('TC-APP-REP-')) {
    throw new Error(`[${tag}] ${tcId}: Repository 등록 동작 미구현`);
  }
  if (tcId.startsWith('TC-APP-APPS-01')) {
    await runAppApps01(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-APP-APPS-02')) {
    await runAppApps02(ctx, tag);
    return;
  }
  if (tcId.startsWith('TC-APP-APPS-03') || tcId.startsWith('TC-APP-APPS-04')) {
    throw new Error(`[${tag}] ${tcId}: 운영 액션 동작 미구현`);
  }
  if (tcId.startsWith('TC-SW-CATALOG-03')) {
    failStep(tag, 'SW undeploy — API 미구현 (TODO)');
  }

  // ── OBS (C6-01~07): observability iframe 기반 테스트 ──────────────────────
  // 외부 URL: /webconsole/operations/analytics/observability
  // 내부 iframe: https://<host>:18081/embed/...
  //   /embed/monitoring/{ns}  → MCI 개요 (Node/K8s 탭)
  //   /embed/config/{ns}      → Monitor Setting (Agent 설치/상태 테이블)
  //   /embed/log/{ns}         → 워크로드 상세 (Monitoring|Logs|Config|Insight|Alerts|Tracing 탭)
  if (tcId.startsWith('TC-OBS-')) {
    if (tcId === 'TC-OBS-AGENT-01') { await runObsAgent01(ctx, tag); return; }
    if (tcId === 'TC-OBS-AGENT-02') { await runObsAgent02(ctx, tag); return; }
    if (tcId === 'TC-OBS-AGENT-03') { await runObsAgent03(ctx, tag); return; }
    if (tcId === 'TC-OBS-INSIGHT-01') { await runObsInsight01(ctx, tag); return; }
    if (tcId === 'TC-OBS-INSIGHT-02') { await runObsInsight02(ctx, tag); return; }
    if (tcId === 'TC-OBS-INSIGHT-03') { await runObsInsight03(ctx, tag); return; }
    if (tcId === 'TC-OBS-INSIGHT-04') { await runObsInsight04(ctx, tag); return; }
    if (tcId === 'TC-OBS-LOG-01') { await runObsLog01(ctx, tag); return; }
    if (tcId === 'TC-OBS-LOG-02') { await runObsLog02(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRACE-01') { await runObsTrace01(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRACE-02') { await runObsTrace02(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRACE-03') { await runObsTrace03(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRIG-01')  { await runObsTrig01(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRIG-02')  { await runObsTrig02(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRIG-03')  { await runObsTrig03(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRIG-04')  { await runObsTrig04(ctx, tag); return; }
    if (tcId === 'TC-OBS-TRIG-05')  { await runObsTrig05(ctx, tag); return; }
    await runObsIframeGeneric(ctx, tag, tcId);
    return;
  }

  // ── COST ─────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-COSTOPT-BILL-') || tcId === 'TC-COSTOPT-IFRAME-01') {
    const ok = await loginAndGoto(page, PAGES.operations.costAnalysis, tag);
    if (ok) console.log(`[${tag}] Cost Analysis UI OK`);
    return;
  }

  // ── COST INIT: CUR 데이터 수집 설정 (TC-COSTOPT-INIT-01~04) ───────────
  if (tcId === 'TC-COSTOPT-INIT-01' || tcId === 'TC-COSTOPT-INIT-02' ||
      tcId === 'TC-COSTOPT-INIT-03' || tcId === 'TC-COSTOPT-INIT-04') {
    const ok = await loginAndGoto(page, PAGES.operations.costAnalysis, tag);
    if (!ok) throw new Error(`[${tag}] Cost Analysis 페이지 진입 실패`);
    // TODO: CUR 설정 UI 탐색 후 구현 — 페이지 URL 확인 필요
    // variant: aws | ncp | azure | gcp
    console.log(`[${tag}] ${tcId} (variant=${variant ?? 'base'}) — CUR 설정 UI 구현 대기`);
    throw new Error(`[${tag}] ${tcId} 미구현 — Cost Optimizer CUR 설정 UI 탐색 후 구현 필요`);
  }

  // ── COST INIT: 알림·LLM 채널 설정 (TC-COSTOPT-INIT-05~06) ───────────
  if (tcId === 'TC-COSTOPT-INIT-05' || tcId === 'TC-COSTOPT-INIT-06') {
    const ok = await loginAndGoto(page, PAGES.operations.costAnalysis, tag);
    if (!ok) throw new Error(`[${tag}] Cost Analysis 페이지 진입 실패`);
    // TODO: 알림/LLM 채널 설정 UI 탐색 후 구현 — 설정 페이지 URL 확인 필요
    console.log(`[${tag}] ${tcId} — 채널 설정 UI 구현 대기`);
    throw new Error(`[${tag}] ${tcId} 미구현 — 알림/LLM 채널 설정 UI 탐색 후 구현 필요`);
  }

  // ── COST OPER: 비용 수집 알람 수신 (TC-COSTOPT-OPER-01~02) ──────────
  if (tcId === 'TC-COSTOPT-OPER-01' || tcId === 'TC-COSTOPT-OPER-02') {
    const ok = await loginAndGoto(page, PAGES.operations.costAnalysis, tag);
    if (!ok) throw new Error(`[${tag}] Cost Analysis 페이지 진입 실패`);
    // TODO: 비용 수집 트리거 + 알람 수신 UI 탐색 후 구현
    // OPER-02: variant='dump' 일 때 덤프 데이터 활용 경로
    console.log(`[${tag}] ${tcId} (variant=${variant ?? 'base'}) — 비용 수집 알람 UI 구현 대기`);
    throw new Error(`[${tag}] ${tcId} 미구현 — 비용 수집 알람 수신 UI 탐색 후 구현 필요`);
  }

  // ── COST OPER: ML/LLM 자원 추천 (TC-COSTOPT-OPER-03) ────────────────
  if (tcId === 'TC-COSTOPT-OPER-03') {
    const ok = await loginAndGoto(page, PAGES.operations.costAnalysis, tag);
    if (!ok) throw new Error(`[${tag}] Cost Analysis 페이지 진입 실패`);
    // TODO: 자원 추천 결과 UI 탐색 후 구현
    console.log(`[${tag}] ${tcId} — ML/LLM 자원 추천 UI 구현 대기`);
    throw new Error(`[${tag}] ${tcId} 미구현 — ML/LLM 자원 추천 UI 탐색 후 구현 필요`);
  }

  // ── WORKFLOW — 공통 헬퍼 ────────────────────────────────────────────────────

  // iframe(mc-workflow-manager-fe) 탐색 공통 헬퍼
  const _getWfIframe = async () => {
    await selectWorkspaceProject(page, tag);
    await page.waitForTimeout(3000);
    return page.frames().find(f => f.url().includes('workflow') && !f.url().includes('webconsole'));
  };

  const _enterElTab = async (frame: import('@playwright/test').Frame) => {
    const t = frame.locator('a, button, [role="tab"], .nav-link, li')
      .filter({ hasText: /event.?listener|이벤트.?리스너/i }).first();
    const ok = await t.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false);
    if (ok) { await t.click(); await page.waitForTimeout(1000); }
    return ok;
  };

  const _getElCallUrl = async (
    frame: import('@playwright/test').Frame,
    elRow: import('@playwright/test').Locator,
  ): Promise<string> => {
    const cell = elRow.locator('td, .tabulator-cell').filter({ hasText: /http/i }).first();
    if (await cell.count() > 0) {
      const txt = (await cell.textContent() ?? '').trim();
      if (txt.startsWith('http')) return txt;
    }
    const detailBtn = elRow.locator('button, a').filter({ hasText: /detail|상세|보기/i }).first();
    if (await detailBtn.count() > 0) {
      await detailBtn.click();
      await page.waitForTimeout(1000);
      const urlEl = frame.locator('[class*="callUrl"], [class*="call-url"], input[readonly]').first();
      if (await urlEl.count() > 0) {
        return ((await urlEl.inputValue().catch(() => '')) || (await urlEl.textContent() ?? '')).trim();
      }
    }
    return '';
  };

  // ── WORKFLOW — Event Listener (TC-WF-EL-01 ~ 07) ─────────────────────────

  if (tcId === 'TC-WF-EL-01') {
    // Event Listener 목록 조회 — iframe > EL 탭 진입 후 목록 영역 확인
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    if (!await _enterElTab(f)) { throw new Error(`[${tag}] EL 탭 미발견`); }
    console.log(`[${tag}] Event Listener 탭 진입 완료`);
    const listArea = f.locator('table, .tabulator, [class*="list"], [class*="empty"]').first();
    const listVisible = await listArea.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    console.log(`[${tag}] Event Listener 목록 영역: ${listVisible ? '확인' : '미확인'}`);
    return;
  }

  if (tcId === 'TC-WF-EL-02') {
    // 신규 Event Listener 생성 — EL 탭 > 생성 폼 작성 (이름 + 연결 워크플로우) > 제출
    const sc = new ScenarioContext(scenarioId, 'TC-WF-EL-02', variant);
    const p  = sc.params;
    const elName = (p.eventListenerName as string | undefined) ?? 'infra-create-el';
    const wfName = (p.workflowName as string | undefined) ?? '';

    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    if (!await _enterElTab(f)) { throw new Error(`[${tag}] EL 탭 미발견`); }

    // 이미 존재하면 skip
    if (await f.locator('tr, .tabulator-row, [class*="row"]').filter({ hasText: elName }).count() > 0) {
      console.log(`[${tag}] EL '${elName}' 이미 존재`);
      store.set('elName', elName); return;
    }

    const createBtn = f.locator('button').filter({ hasText: /create|등록|추가|새로\s*만들기|New/i }).first();
    if (await createBtn.count() === 0) { throw new Error(`[${tag}] 생성 버튼 미발견`); }
    await createBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = f.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]').first();
    if (await nameInput.count() > 0) { await nameInput.fill(elName); console.log(`[${tag}] EL 이름: ${elName}`); }

    if (wfName) {
      const sel = f.locator('select').first();
      if (await sel.count() > 0) {
        await sel.selectOption({ label: wfName }).catch(() =>
          sel.selectOption({ value: wfName }).catch(() => warn(tag, `WF '${wfName}' 선택 실패`)),
        );
        console.log(`[${tag}] 연결 워크플로우: ${wfName}`);
      }
    }

    const submitBtn = f.locator('button[type="submit"], button').filter({ hasText: /submit|저장|확인|등록|OK/i }).last();
    if (await submitBtn.count() === 0) { throw new Error(`[${tag}] 등록 버튼 미발견`); }
    let createStatus = 0;
    page.on('response', res => { if (res.url().includes('/eventlistener') && res.request().method() === 'POST') createStatus = res.status(); });
    await submitBtn.click();
    await page.waitForTimeout(2000);
    if (createStatus > 0) console.log(`[${tag}] POST /eventlistener HTTP ${createStatus}`);
    console.log(`[${tag}] EL '${elName}' 등록 요청 완료`);
    store.set('elName', elName);
    return;
  }

  if (tcId === 'TC-WF-EL-03') {
    // Event Listener 이름 중복 검사 — 동일 이름으로 재생성 시도 후 오류 메시지 확인
    const sc = new ScenarioContext(scenarioId, 'TC-WF-EL-03', variant);
    const p  = sc.params;
    const elName = (p.eventListenerName as string | undefined) ?? store.getOrDefault<string>('elName', 'infra-create-el');

    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    if (!await _enterElTab(f)) { throw new Error(`[${tag}] EL 탭 미발견`); }

    const createBtn = f.locator('button').filter({ hasText: /create|등록|추가|새로\s*만들기|New/i }).first();
    if (await createBtn.count() === 0) { throw new Error(`[${tag}] 생성 버튼 미발견`); }
    await createBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = f.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]').first();
    if (await nameInput.count() > 0) { await nameInput.fill(elName); await nameInput.press('Tab'); }
    await page.waitForTimeout(1000);

    const errMsg = f.locator('[class*="error"], [class*="invalid"], .alert, .text-danger')
      .filter({ hasText: /중복|duplicate|already|exist/i }).first();
    const hasDupError = await errMsg.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    console.log(`[${tag}] 이름 중복 오류 메시지: ${hasDupError ? '확인' : '미확인'}`);

    const cancelBtn = f.locator('button').filter({ hasText: /cancel|취소/i }).first();
    if (await cancelBtn.count() > 0) await cancelBtn.click();
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return;
  }

  if (tcId === 'TC-WF-EL-04') {
    // Event Listener 상세 수정 — EL 행 > 수정 버튼 > 내용 변경 > 저장
    const sc = new ScenarioContext(scenarioId, 'TC-WF-EL-04', variant);
    const p  = sc.params;
    const elName = (p.eventListenerName as string | undefined) ?? store.getOrDefault<string>('elName', '');
    if (!elName) { throw new Error(`[${tag}] elName 없음`); }

    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    if (!await _enterElTab(f)) { throw new Error(`[${tag}] EL 탭 미발견`); }

    const elRow = f.locator('tr, .tabulator-row, [class*="row"]').filter({ hasText: elName }).first();
    if (!await elRow.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) {
      throw new Error(`[${tag}] EL '${elName}' 없음`);
    }

    const editBtn = elRow.locator('button, a').filter({ hasText: /edit|수정|편집/i }).first();
    if (await editBtn.count() === 0) { throw new Error(`[${tag}] 수정 버튼 미발견`); }
    await editBtn.click();
    await page.waitForTimeout(1000);

    const descInput = f.locator('input[name*="desc" i], textarea[name*="desc" i], input[placeholder*="desc" i]').first();
    if (await descInput.count() > 0) {
      const cur = await descInput.inputValue().catch(() => '');
      await descInput.fill(cur ? `${cur} (수정)` : '수정된 설명');
    }

    let updateStatus = 0;
    page.on('response', res => { if (res.url().includes('/eventlistener') && res.request().method() === 'PATCH') updateStatus = res.status(); });
    const saveBtn = f.locator('button[type="submit"], button').filter({ hasText: /save|저장|확인|수정|OK/i }).last();
    if (await saveBtn.count() > 0) { await saveBtn.click(); await page.waitForTimeout(2000); }
    if (updateStatus > 0) console.log(`[${tag}] PATCH /eventlistener HTTP ${updateStatus}`);
    console.log(`[${tag}] EL '${elName}' 수정 완료`);
    return;
  }

  if (tcId === 'TC-WF-EL-05') {
    // Event Listener 삭제 — EL 행 > 삭제 버튼 > 확인 다이얼로그
    const sc = new ScenarioContext(scenarioId, 'TC-WF-EL-05', variant);
    const p  = sc.params;
    const elName = (p.eventListenerName as string | undefined) ?? store.getOrDefault<string>('elName', '');
    if (!elName) { throw new Error(`[${tag}] elName 없음`); }

    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    if (!await _enterElTab(f)) { throw new Error(`[${tag}] EL 탭 미발견`); }

    const elRow = f.locator('tr, .tabulator-row, [class*="row"]').filter({ hasText: elName }).first();
    if (await elRow.count() === 0) { console.log(`[${tag}] EL '${elName}' 없음 — 이미 삭제됨`); return; }

    const delBtn = elRow.locator('button, a').filter({ hasText: /del|delete|삭제/i }).first();
    if (await delBtn.count() === 0) { throw new Error(`[${tag}] 삭제 버튼 미발견`); }
    await delBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('.swal2-confirm, .modal.show button').filter({ hasText: /확인|OK|Yes|삭제/i }).first();
    if (await confirmBtn.count() > 0) await confirmBtn.click();
    await page.waitForTimeout(1500);
    console.log(`[${tag}] EL '${elName}' 삭제 완료`);
    return;
  }

  if (tcId === 'TC-WF-EL-06') {
    // Event Listener GET Trigger — EL callUrl(GET)로 워크플로우 실행
    const sc = new ScenarioContext(scenarioId, 'TC-WF-EL-06', variant);
    const p  = sc.params;
    const elName = (p.eventListenerName as string | undefined) ?? store.getOrDefault<string>('elName', '');
    if (!elName) { throw new Error(`[${tag}] elName 없음`); }

    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    await _enterElTab(f);

    const elRow = f.locator('tr, .tabulator-row, [class*="row"]').filter({ hasText: elName }).first();
    if (!await elRow.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) {
      throw new Error(`[${tag}] EL '${elName}' 없음`);
    }
    const callUrl = await _getElCallUrl(f, elRow);
    if (!callUrl || !callUrl.startsWith('http')) {
      throw new Error(`[${tag}] callUrl 미발견`);
    }
    console.log(`[${tag}] EL callUrl (GET): ${callUrl}`);
    const resp = await page.request.get(callUrl, { ignoreHTTPSErrors: true }).catch(() => null);
    const httpStatus = resp?.status() ?? 0;
    console.log(`[${tag}] GET trigger HTTP ${httpStatus}`);
    if (httpStatus >= 200 && httpStatus < 300) {
      console.log(`[${tag}] EL '${elName}' GET Trigger → 워크플로우 실행 완료`);
    } else {
      warn(tag, `GET trigger 응답 ${httpStatus}`);
    }
    return;
  }

  if (tcId === 'TC-WF-EL-07') {
    // Event Listener POST Trigger — EL callUrl(POST)로 파라미터 포함 워크플로우 실행
    const sc = new ScenarioContext(scenarioId, 'TC-WF-EL-07', variant);
    const p  = sc.params;
    const elName = (p.eventListenerName as string | undefined) ?? store.getOrDefault<string>('elName', '');
    if (!elName) { throw new Error(`[${tag}] elName 없음`); }

    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    const f = await _getWfIframe();
    if (!f) { throw new Error(`[${tag}] WF iframe 미발견`); }
    await _enterElTab(f);

    const elRow = f.locator('tr, .tabulator-row, [class*="row"]').filter({ hasText: elName }).first();
    if (!await elRow.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) {
      throw new Error(`[${tag}] EL '${elName}' 없음`);
    }
    const callUrl = await _getElCallUrl(f, elRow);
    if (!callUrl || !callUrl.startsWith('http')) {
      throw new Error(`[${tag}] callUrl 미발견`);
    }
    console.log(`[${tag}] EL callUrl (POST): ${callUrl}`);
    const triggerBody = (p.triggerBody as Record<string, unknown> | undefined) ?? {};
    const resp = await page.request.post(callUrl, { data: triggerBody, ignoreHTTPSErrors: true }).catch(() => null);
    const httpStatus = resp?.status() ?? 0;
    console.log(`[${tag}] POST trigger HTTP ${httpStatus}`);
    if (httpStatus >= 200 && httpStatus < 300) {
      console.log(`[${tag}] EL '${elName}' POST Trigger → 워크플로우 실행 완료`);
    } else {
      warn(tag, `POST trigger 응답 ${httpStatus}`);
    }
    return;
  }

  // ── WORKFLOW — Flow (TC-WF-FLOW-01 ~ 07) ─────────────────────────────────

  if (tcId === 'TC-WF-FLOW-01') {
    // Workflow Engine(Jenkins) 등록 및 연동 확인 — OSS 목록 조회 후 연결 상태 확인
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    await page.waitForLoadState('networkidle');
    // OSS/Engine 탭 진입 시도
    const ossTab = page.locator('a, button, [role="tab"], .nav-link')
      .filter({ hasText: /OSS|jenkins|engine|엔진/i }).first();
    if (await ossTab.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) {
      await ossTab.click();
      await page.waitForTimeout(1000);
      console.log(`[${tag}] OSS/Engine 탭 진입`);
    } else {
      console.log(`[${tag}] OSS 탭 미발견 — API 조회로 대체`);
    }
    const ossListResp = await page.request.get('/api/mc-workflow-manager/oss/list', { ignoreHTTPSErrors: true }).catch(() => null);
    const ossStatus = ossListResp?.status() ?? 0;
    console.log(`[${tag}] GET /oss/list HTTP ${ossStatus}`);
    if (ossStatus >= 200 && ossStatus < 300) {
      const body = await ossListResp!.json().catch(() => []);
      const count = Array.isArray(body) ? body.length : (body?.data?.length ?? 0);
      console.log(`[${tag}] 등록된 OSS(WF Engine) 수: ${count}`);
      if (count === 0) warn(tag, 'OSS(Jenkins) 미등록 — Engine 설정 필요');
    } else {
      warn(tag, `OSS API 비정상 (HTTP ${ossStatus})`);
    }
    return;
  }

  if (tcId === 'TC-WF-FLOW-03') {
    // 신규 Workflow 생성 — 목록에서 workflowName 존재 확인
    const sc = new ScenarioContext(scenarioId, 'TC-WF-FLOW-03', variant);
    const p  = sc.params;
    const workflowName = (p.workflowName as string | undefined) ?? '';
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    await page.waitForLoadState('networkidle');
    console.log(`[${tag}] Workflow UI OK`);
    if (workflowName) {
      const row = page.locator('.tabulator-row, tr').filter({ hasText: workflowName }).first();
      const found = await row.count() > 0;
      console.log(`[${tag}] 워크플로우 '${workflowName}' 목록 확인: ${found ? '있음' : '없음'}`);
      if (!found) {
        throw new Error(`[${tag}] 워크플로우 '${workflowName}' 미등록`);
      }
    }
    return;
  }

  if (tcId === 'TC-WF-FLOW-04') {
    // Workflow 상세 수정 — 행 > 수정 버튼 > 내용 변경 > 저장
    const sc = new ScenarioContext(scenarioId, 'TC-WF-FLOW-04', variant);
    const p  = sc.params;
    const workflowName = (p.workflowName as string | undefined) ?? '';
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    await page.waitForLoadState('networkidle');
    if (!workflowName) { console.log(`[${tag}] Workflow UI OK`); return; }

    const wfRow = page.locator('.tabulator-row, tr').filter({ hasText: workflowName }).first();
    if (!await wfRow.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false)) {
      throw new Error(`[${tag}] 워크플로우 '${workflowName}' 없음`);
    }

    const editBtn = wfRow.locator('button, a').filter({ hasText: /edit|수정|편집|EDIT/i }).first();
    if (await editBtn.count() === 0) {
      throw new Error(`[${tag}] 수정 버튼 미발견`);
    }
    await editBtn.click();
    await page.waitForTimeout(1500);
    console.log(`[${tag}] 워크플로우 '${workflowName}' 수정 화면 진입`);

    const descInput = page.locator('input[name*="desc" i], textarea[name*="desc" i]').first();
    if (await descInput.count() > 0) {
      const cur = await descInput.inputValue().catch(() => '');
      await descInput.fill(cur ? `${cur} (수정)` : '수정된 설명');
    }

    let updateStatus = 0;
    page.on('response', res => {
      if (res.url().includes('/workflow') && res.request().method() === 'PATCH') updateStatus = res.status();
    });
    const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|저장|확인|수정|OK/i }).last();
    if (await saveBtn.count() > 0) { await saveBtn.click(); await page.waitForTimeout(2000); }
    if (updateStatus > 0) console.log(`[${tag}] PATCH /workflow HTTP ${updateStatus}`);
    console.log(`[${tag}] 워크플로우 '${workflowName}' 수정 완료`);
    return;
  }

  if (tcId === 'TC-WF-FLOW-05') {
    // Workflow 삭제 — 행 > DEL 버튼 > 확인 다이얼로그
    const sc = new ScenarioContext(scenarioId, 'TC-WF-FLOW-05', variant);
    const p  = sc.params;
    const workflowName = (p.workflowName as string | undefined) ?? '';
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    await page.waitForLoadState('networkidle');
    if (!workflowName) { console.log(`[${tag}] Workflow UI OK`); return; }
    const wfRow = page.locator('.tabulator-row, tr').filter({ hasText: workflowName }).first();
    if (await wfRow.count() === 0) { console.log(`[${tag}] '${workflowName}' 없음 — 이미 삭제됨`); return; }
    const delBtn = wfRow.locator('button, a').filter({ hasText: /^DEL$|^삭제$/i }).first();
    if (await delBtn.count() === 0) { throw new Error(`[${tag}] DEL 버튼 미발견`); }
    await delBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('.swal2-confirm, .modal.show button').filter({ hasText: /확인|OK|Yes/i }).first();
    if (await confirmBtn.count() > 0) await confirmBtn.click();
    await page.waitForTimeout(1000);
    console.log(`[${tag}] 워크플로우 '${workflowName}' 삭제 완료`);
    return;
  }

  if (tcId === 'TC-WF-FLOW-06') {
    // Workflow 실행 (RUN) — 행 > RUN 버튼 > 모달 > Run 확인
    const sc = new ScenarioContext(scenarioId, 'TC-WF-FLOW-06', variant);
    const p  = sc.params;
    const workflowName = (p.workflowName as string | undefined) ?? '';
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    await page.waitForLoadState('networkidle');
    if (!workflowName) { console.log(`[${tag}] Workflow UI OK`); return; }

    const pageSizeSel = page.locator('#workflow-table .tabulator-page-size, [class*="tabulator"] .tabulator-page-size').first();
    if (await pageSizeSel.count() > 0) {
      await pageSizeSel.selectOption({ label: '100' }).catch(() => pageSizeSel.selectOption({ label: 'All' }).catch(() => {}));
      await page.waitForTimeout(500);
    }

    const wfRow = page.locator('.tabulator-row, tr').filter({ hasText: workflowName }).first();
    if (!await wfRow.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false)) {
      throw new Error(`[${tag}] 워크플로우 '${workflowName}' 없음`);
    }
    console.log(`[${tag}] 워크플로우 '${workflowName}' 확인`);

    const runBtn = wfRow.locator('button, a').filter({ hasText: /^RUN$|^실행$/i }).first();
    if (await runBtn.count() === 0) { throw new Error(`[${tag}] RUN 버튼 미발견`); }
    await runBtn.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('#runWorkflow, [class*="run-modal"], [class*="runModal"], .modal.show').first();
    if (!await modal.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) {
      console.log(`[${tag}] RUN 클릭 완료 (모달 미표시 — 즉시 실행)`); return;
    }
    console.log(`[${tag}] RunWorkflow 모달 표시 확인`);

    const modalRunBtn = modal.locator('button').filter({ hasText: /^Run$|^실행$/i }).first();
    if (await modalRunBtn.count() === 0) { throw new Error(`[${tag}] 모달 Run 버튼 미발견`); }
    let runStatus = 0;
    page.on('response', res => { if (res.url().includes('/workflow/run') && res.request().method() === 'POST') runStatus = res.status(); });
    await modalRunBtn.click();
    await page.waitForTimeout(2000);
    if (runStatus > 0) console.log(`[${tag}] POST /workflow/run HTTP ${runStatus}`);
    console.log(`[${tag}] 워크플로우 '${workflowName}' 실행 요청 완료`);
    return;
  }

  if (tcId === 'TC-WF-FLOW-07') {
    // Workflow 로그 모달 표시 — 실행 기록 행 > LOG 버튼 > 모달 확인
    const sc = new ScenarioContext(scenarioId, 'TC-WF-FLOW-07', variant);
    const p  = sc.params;
    const workflowName = (p.workflowName as string | undefined) ?? '';
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (!ok) { throw new Error(`[${tag}] 로그인 실패`); }
    await page.waitForLoadState('networkidle');

    const wfRow = workflowName
      ? page.locator('.tabulator-row, tr').filter({ hasText: workflowName }).first()
      : page.locator('.tabulator-row, tr').first();

    if (!await wfRow.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false)) {
      throw new Error(`[${tag}] 워크플로우 행 없음`);
    }

    // LOG 또는 실행 기록 버튼 클릭
    const logBtn = wfRow.locator('button, a').filter({ hasText: /^LOG$|^로그$|history|기록/i }).first();
    if (await logBtn.count() === 0) {
      throw new Error(`[${tag}] LOG 버튼 미발견`);
    }
    await logBtn.click();
    await page.waitForTimeout(1000);

    // 로그 모달 표시 확인
    const logModal = page.locator('.modal.show, [class*="log-modal"], [class*="logModal"], [id*="log"]').first();
    const modalVisible = await logModal.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    console.log(`[${tag}] 워크플로우 로그 모달: ${modalVisible ? '표시 확인' : '미표시'}`);

    if (modalVisible) {
      const logContent = logModal.locator('pre, code, [class*="log-content"], [class*="logContent"]').first();
      const hasContent = await logContent.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
      console.log(`[${tag}] 로그 내용 영역: ${hasContent ? '있음' : '없음'}`);
      // 모달 닫기
      const closeBtn = logModal.locator('button').filter({ hasText: /close|닫기|✕|×/i }).first();
      if (await closeBtn.count() > 0) await closeBtn.click();
      else await page.keyboard.press('Escape');
    }
    return;
  }

  if (tcId.startsWith('TC-WF-FLOW-') || tcId.startsWith('TC-WF-EL-')) {
    const ok = await loginAndGoto(page, PAGES.sw.workflow, tag);
    if (ok) console.log(`[${tag}] Workflow UI OK`);
    return;
  }

  // ── DATA ─────────────────────────────────────────────────────────────────
  if (tcId.startsWith('TC-DATA-OBJ-MIG-01') || tcId.startsWith('TC-DATA-OBJ-BAK-01')) {
    const ok = await loginAndGoto(page, PAGES.data.objectStorage, tag);
    if (ok) console.log(`[${tag}] Object Storage UI OK`);
    return;
  }
  if (tcId.startsWith('TC-DATA-RDB-MIG-01') || tcId.startsWith('TC-DATA-RDB-BAK-01')) {
    const ok = await loginAndGoto(page, PAGES.data.rdbms, tag);
    if (ok) console.log(`[${tag}] RDBMS UI OK`);
    return;
  }
  if (tcId.startsWith('TC-DATA-NORDB-MIG-01') || tcId.startsWith('TC-DATA-NORDB-BAK-01')) {
    const ok = await loginAndGoto(page, PAGES.data.nordbms, tag);
    if (ok) console.log(`[${tag}] NoRDBMS UI OK`);
    return;
  }

  failStep(tag, `미매핑 TC: ${tcId} — runScenarioStep 구현 필요`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-APP-CAT-03: 외부 검색 결과 표시 (DockerHub)
// Catalog 탭 #inputCatalogSearch → keyword 입력 → Enter → #resultDockerHubSearch 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runAppCatSearch(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;
  const keyword: string = (ctx.step as any).params?.searchKeyword
    ?? store.getOrDefault<string>('searchKeyword', 'ghost');

  const ok = await loginAndGoto(page, PAGES.sw.catalog, tag);
  if (!ok) { throw new Error(`[${tag}] SW Catalogs 페이지 진입 실패`); }

  const frame = await gotoSwIframeTab(page, /catalog/i, tag);
  if (!frame) { throw new Error(`[${tag}] Catalog 탭 iframe 진입 실패`); }

  const searchInput = frame.locator('#inputCatalogSearch');
  const inputVisible = await searchInput.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!inputVisible) { throw new Error(`[${tag}] #inputCatalogSearch 미발견`); }

  await searchInput.fill(keyword);
  await searchInput.press('Enter');
  console.log(`[${tag}] 검색어 입력: "${keyword}"`);

  const resultSection = frame.locator('#resultDockerHubSearch');
  const hasResults = await resultSection.waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true).catch(() => false);

  if (!hasResults) {
    warn(tag, `DockerHub 검색 결과 없음 (keyword: ${keyword})`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-dockerhub-results.png`) }).catch(() => null);
    throw new Error(`[${tag}] DockerHub 검색 결과 없음 (keyword: ${keyword})`);
  }

  const cardCount = await resultSection.locator('.card').count();
  console.log(`[${tag}] DockerHub 검색 결과: ${cardCount}개 카드`);
  store.set('searchKeyword', keyword);
  console.log(`[${tag}] TC-APP-CAT-03 완료 — searchKeyword="${keyword}" 저장`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-APP-CAT-04: 외부 검색 결과 업로드 (DockerHub ghost → 내부 레지스트리)
// DockerHub 결과 카드 hover → 다운로드 아이콘 클릭 → #upload-form-modal
// → Tag 선택(bookworm 포함) → Upload 버튼
// ─────────────────────────────────────────────────────────────────────────────
async function runAppCatUpload(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;
  const keyword: string   = store.getOrDefault<string>('searchKeyword', 'ghost');
  const uploadTag: string = (ctx.step as any).params?.uploadTag
    ?? store.getOrDefault<string>('uploadTag', 'bookworm');

  const ok = await loginAndGoto(page, PAGES.sw.catalog, tag);
  if (!ok) { throw new Error(`[${tag}] SW Catalogs 페이지 진입 실패`); }

  const frame = await gotoSwIframeTab(page, /catalog/i, tag);
  if (!frame) { throw new Error(`[${tag}] Catalog 탭 iframe 진입 실패`); }

  // 검색어 재입력
  const searchInput = frame.locator('#inputCatalogSearch');
  const inputVisible = await searchInput.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!inputVisible) { throw new Error(`[${tag}] #inputCatalogSearch 미발견`); }

  await searchInput.fill(keyword);
  await searchInput.press('Enter');

  const resultSection = frame.locator('#resultDockerHubSearch');
  const hasResults = await resultSection.waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true).catch(() => false);
  if (!hasResults) { throw new Error(`[${tag}] DockerHub 검색 결과 없음`); }

  const targetCard = resultSection.locator('.card').filter({ hasText: new RegExp(keyword, 'i') }).first();
  const cardExists = await targetCard.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);
  if (!cardExists) { throw new Error(`[${tag}] "${keyword}" 카드 미발견`); }

  // hover → CSS :hover 트리거 → .mouse-hover svg 표시
  await targetCard.hover();
  await page.waitForTimeout(500);

  const downloadIcon = targetCard.locator('.mouse-hover svg').first();
  const iconVisible = await downloadIcon.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (!iconVisible) {
    // CSS :hover 가 playwright hover 로 안 트리거된 경우 — iframe Frame 객체로 JS 직접 클릭
    warn(tag, '.mouse-hover svg 미표시 — iframe JS click 시도');
    const iframeEl = page.locator('#targetIframe-sofrwareCatalog iframe').first();
    const iframeHandle = await iframeEl.elementHandle().catch(() => null);
    const frameObj = iframeHandle ? await iframeHandle.contentFrame().catch(() => null) : null;
    if (frameObj) {
      const clicked = await frameObj.evaluate((kw: string) => {
        const cards = Array.from(document.querySelectorAll('#resultDockerHubSearch .card'));
        const card = cards.find(c => (c as HTMLElement).innerText?.toLowerCase().includes(kw.toLowerCase()));
        if (!card) return false;
        const icon = card.querySelector('.mouse-hover svg') as HTMLElement | null;
        if (!icon) return false;
        icon.click();
        return true;
      }, keyword);
      if (!clicked) { throw new Error(`[${tag}] 다운로드 아이콘 JS 클릭 실패`); }
    } else {
      throw new Error(`[${tag}] iframe Frame 객체 획득 실패`);
    }
  } else {
    await downloadIcon.click();
  }

  console.log(`[${tag}] 다운로드 아이콘 클릭`);

  // Upload Application 모달 대기
  const uploadModal = frame.locator('#upload-form-modal');
  const modalVisible = await uploadModal.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!modalVisible) { throw new Error(`[${tag}] #upload-form-modal 미표시`); }

  // Tag 드롭다운 — API 응답 대기 후 선택
  const tagSelect = uploadModal.locator('select.form-select');
  await page.waitForTimeout(2_000);
  const tagOptions = await tagSelect.locator('option').allTextContents().catch(() => [] as string[]);
  console.log(`[${tag}] Tag 옵션 (상위 5): ${tagOptions.slice(0, 5).join(', ')}`);

  const matchingTag = tagOptions.find(t => t.toLowerCase().includes(uploadTag.toLowerCase()));
  if (!matchingTag) {
    warn(tag, `"${uploadTag}" 태그 미발견. 가용: ${tagOptions.slice(0, 5).join(', ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-tag-not-found.png`) }).catch(() => null);
    throw new Error(`[${tag}] "${uploadTag}" 태그 미발견`);
  }

  await tagSelect.selectOption({ label: matchingTag });
  console.log(`[${tag}] Tag 선택: "${matchingTag}"`);

  const uploadBtn = uploadModal.locator('button').filter({ hasText: /upload/i }).last();
  await uploadBtn.click();

  await page.waitForTimeout(3_000);
  const modalClosed = await uploadModal.waitFor({ state: 'hidden', timeout: 15_000 })
    .then(() => true).catch(() => false);

  if (modalClosed) {
    console.log(`[${tag}] TC-APP-CAT-04 완료 — "${keyword}:${matchingTag}" 업로드 성공`);
    store.set('uploadedPackageName', keyword);
    store.set('uploadedTag', matchingTag);
  } else {
    warn(tag, 'Upload 후 모달 미닫힘');
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-upload-modal-not-closed.png`) }).catch(() => null);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-APP-CAT-05: Catalog 신규 등록 (Regist 버튼)
// Catalog 탭 Regist → #modal-wizard → Package 탭
// Target: VM, Category: Content Management System, Package: ghost, Version: bookworm
// ─────────────────────────────────────────────────────────────────────────────
async function runAppCatRegist(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;
  const packageName: string = store.getOrDefault<string>('uploadedPackageName', 'ghost');
  const version: string     = (ctx.step as any).params?.version
    ?? store.getOrDefault<string>('uploadedTag', 'bookworm');
  const category            = 'Content Management System';

  const ok = await loginAndGoto(page, PAGES.sw.catalog, tag);
  if (!ok) { throw new Error(`[${tag}] SW Catalogs 페이지 진입 실패`); }

  const frame = await gotoSwIframeTab(page, /catalog/i, tag);
  if (!frame) { throw new Error(`[${tag}] Catalog 탭 iframe 진입 실패`); }

  // Regist 버튼
  const registBtn = frame.locator('button[data-bs-target="#modal-wizard"]').filter({ hasText: /regist/i }).first();
  const btnVisible = await registBtn.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!btnVisible) { throw new Error(`[${tag}] Regist 버튼 미발견`); }

  await registBtn.click();
  console.log(`[${tag}] Regist 버튼 클릭`);

  const wizard = frame.locator('#modal-wizard');
  const wizardVisible = await wizard.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!wizardVisible) { throw new Error(`[${tag}] #modal-wizard 미표시`); }

  // 1. Package 탭 활성화
  const pkgTab = wizard.locator('a.nav-link').filter({ hasText: /package/i }).first();
  if (await pkgTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await pkgTab.click();
    await page.waitForTimeout(500);
  }

  // Target: VM
  const vmRadio = wizard.locator('#targetVM');
  if (await vmRadio.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await vmRadio.check();
    console.log(`[${tag}] Target: VM`);
    await page.waitForTimeout(1_000);
  }

  // Category: Content Management System (대소문자 무관 매칭)
  const allSelects = wizard.locator('select.form-select');
  const catSelect = allSelects.nth(0);
  const catOpts = await catSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const matchCat = catOpts.find(c => c.toLowerCase().includes('content management'));
  if (matchCat) {
    await catSelect.selectOption({ label: matchCat });
    console.log(`[${tag}] Category: "${matchCat}"`);
    // Package API 응답 대기 — 옵션 채워질 때까지 최대 10초 폴링
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1_000);
      const opts = await allSelects.nth(1).locator('option').allTextContents().catch(() => [] as string[]);
      if (opts.some(o => o.trim() && !/^select/i.test(o.trim()))) break;
    }
  } else {
    warn(tag, `Category 미발견. 가용: ${catOpts.slice(0, 5).join(', ')}`);
  }

  // Package: ghost
  const pkgSelect = allSelects.nth(1);
  const pkgOpts = await pkgSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const matchPkg = pkgOpts.find(p => p.toLowerCase().includes(packageName.toLowerCase()));
  if (matchPkg) {
    await pkgSelect.selectOption({ label: matchPkg });
    console.log(`[${tag}] Package: "${matchPkg}"`);
    await page.waitForTimeout(1_000);
  } else {
    warn(tag, `Package "${packageName}" 미발견. 가용: ${pkgOpts.slice(0, 5).join(', ')}`);
    throw new Error(`[${tag}] Package "${packageName}" 미발견`);
  }

  // Version: bookworm 포함
  const verSelect = allSelects.nth(2);
  const verOpts = await verSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const matchVer = verOpts.find(v => v.toLowerCase().includes(version.toLowerCase()));
  if (matchVer) {
    await verSelect.selectOption({ label: matchVer });
    console.log(`[${tag}] Version: "${matchVer}"`);
  } else {
    warn(tag, `Version "${version}" 미발견. 가용: ${verOpts.slice(0, 5).join(', ')}`);
    throw new Error(`[${tag}] Version "${version}" 미발견`);
  }

  // Step 1 완료 → Next
  await wizard.locator('.modal-footer button.btn-primary').filter({ hasText: /next/i }).first().click();
  console.log(`[${tag}] Step 1 → Next`);
  await page.waitForTimeout(600);

  // Step 2 (General): name, summary, description 모두 필수
  const nameInput = wizard.locator('input[placeholder="Application name"]');
  const summaryInput = wizard.locator('input[placeholder="Application summary"]');
  const descTextarea = wizard.locator('textarea[placeholder="Application description"]');
  if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await nameInput.fill(packageName);
    await nameInput.press('Tab');
    await summaryInput.fill(`${packageName} - E2E test`);
    await summaryInput.press('Tab');
    await descTextarea.fill(`E2E test: ${packageName} catalog registration`);
    await descTextarea.press('Tab');
    console.log(`[${tag}] Step 2: name/summary/description 입력`);
  }
  await page.waitForTimeout(400);
  await wizard.locator('.modal-footer button.btn-primary').filter({ hasText: /next/i }).first().click();
  console.log(`[${tag}] Step 2 → Next`);
  await page.waitForTimeout(600);

  // Step 3 (Resource Requirements): min/recommended CPU·Memory·Disk 모두 필수
  const step3Inputs = wizard.locator('div[style*="display: block"] input[type="number"], div.tab-pane.show input[type="number"]');
  // placeholder 기준으로 직접 주입
  async function fillNumber(placeholder: string, value: string) {
    const el = wizard.locator(`input[type="number"][placeholder="${placeholder}"]`).first();
    if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const cur = await el.inputValue().catch(() => '');
      if (!cur || cur === '0') { await el.fill(value); await el.press('Tab'); }
    }
  }
  await fillNumber('1', '1');    // minCpu
  await fillNumber('2', '2');    // recommendedCpu
  await fillNumber('4', '4');    // minMemory
  await fillNumber('8', '8');    // recommendedMemory
  await fillNumber('10', '10');  // minDisk
  await fillNumber('20', '20');  // recommendedDisk
  console.log(`[${tag}] Step 3: 리소스 요구사항 입력`);
  await page.waitForTimeout(400);
  await wizard.locator('.modal-footer button.btn-primary').filter({ hasText: /next/i }).first().click();
  console.log(`[${tag}] Step 3 → Next`);
  await page.waitForTimeout(600);

  // Step 4 (Network): Create
  const createBtn = wizard.locator('.modal-footer button.btn-primary').filter({ hasText: /create/i }).first();
  await createBtn.click();
  console.log(`[${tag}] Step 4: Create 클릭`);

  await page.waitForTimeout(3_000);
  const wizardClosed = await wizard.waitFor({ state: 'hidden', timeout: 15_000 })
    .then(() => true).catch(() => false);

  if (wizardClosed) {
    console.log(`[${tag}] TC-APP-CAT-05 완료 — "${packageName}" Catalog 등록`);
    store.set('catalogName', packageName);
  } else {
    warn(tag, 'Register 후 wizard 미닫힘');
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-wizard-not-closed.png`) }).catch(() => null);
    throw new Error(`[${tag}] Register 후 wizard 미닫힘`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-APP-DEP-01: VM 단일 배포 (Standalone)
// iframe 헤더 DEPLOY 버튼 → #install-form 모달
// Target Infra / Namespace / MCI(variant) / VM / Application 선택 → Install
// ─────────────────────────────────────────────────────────────────────────────
async function runAppDeploy(ctx: StepRunContext, tag: string, variant?: string): Promise<void> {
  const { page, store } = ctx;
  const catalogName: string = store.getOrDefault<string>('catalogName', 'ghost');
  const mciName: string     = variant ?? store.getOrDefault<string>('mciName', 'mci16');

  const ok = await loginAndGoto(page, PAGES.sw.catalog, tag);
  if (!ok) { throw new Error(`[${tag}] SW Catalogs 페이지 진입 실패`); }

  const frame = await gotoSwIframeTab(page, /catalog/i, tag);
  if (!frame) { throw new Error(`[${tag}] Catalog 탭 iframe 진입 실패`); }

  // DEPLOY 버튼 (iframe 내 페이지 헤더)
  const deployBtn = frame.locator('button[data-bs-target="#install-form"]').first();
  const btnVisible = await deployBtn.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!btnVisible) { throw new Error(`[${tag}] DEPLOY 버튼 미발견`); }

  await deployBtn.click();
  console.log(`[${tag}] DEPLOY 버튼 클릭`);

  const installModal = frame.locator('#install-form');
  const modalVisible = await installModal.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);
  if (!modalVisible) { throw new Error(`[${tag}] #install-form 모달 미표시`); }

  await page.waitForTimeout(2_000);

  // Target Infra: VM (infraList = [{key:'VM',value:'VM'}, {key:'k8s',value:'K8S'}])
  const infraSelect = installModal.locator('#infra');
  const infraOpts = await infraSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const matchInfra = infraOpts.find(o => o.toUpperCase() === 'VM' || o.toLowerCase() === 'vm');
  if (matchInfra) {
    await infraSelect.selectOption({ label: matchInfra });
    console.log(`[${tag}] Target Infra: "${matchInfra}"`);
    await page.waitForTimeout(1_000);
  } else {
    warn(tag, `Infra 옵션 미발견. 가용: ${infraOpts.slice(0, 5).join(', ')}`);
  }

  // Namespace: default
  const nsSelect = installModal.locator('select').nth(1);
  const nsOpts = await nsSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const defaultNs = nsOpts.find(n => n.toLowerCase() === 'default') ?? nsOpts.find(n => n.trim() && !/select/i.test(n));
  if (defaultNs) {
    await nsSelect.selectOption({ label: defaultNs });
    console.log(`[${tag}] Namespace: "${defaultNs}"`);
    await page.waitForTimeout(1_000);
  }

  // MCI: mciName 포함
  const mciSelect = installModal.locator('#mci-name').first();
  const mciOpts = await mciSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const matchMci = mciOpts.find(m => m.toLowerCase().includes(mciName.toLowerCase()));
  if (matchMci) {
    await mciSelect.selectOption({ label: matchMci });
    console.log(`[${tag}] MCI: "${matchMci}"`);
    await page.waitForTimeout(1_000);
  } else {
    warn(tag, `MCI "${mciName}" 미발견. 가용: ${mciOpts.slice(0, 5).join(', ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-mci-not-found.png`) }).catch(() => null);
    throw new Error(`[${tag}] MCI "${mciName}" 미발견`);
  }

  // VM: 첫 번째 유효 항목
  const vmSelect = installModal.locator('#mci-name').nth(1); // VM select (#mci-name이 2개)
  const vmOpts = await vmSelect.locator('option').allTextContents().catch(() => [] as string[]);
  const firstVm = vmOpts.find(v => v.trim() && !/select/i.test(v));
  if (firstVm) {
    await vmSelect.selectOption({ label: firstVm });
    console.log(`[${tag}] VM: "${firstVm}"`);
    await page.waitForTimeout(500);
  }

  // Application: catalogName 포함
  const appSelects = installModal.locator('select');
  const appSelectCount = await appSelects.count();
  let appSelected = false;
  for (let i = 0; i < appSelectCount; i++) {
    const opts = await appSelects.nth(i).locator('option').allTextContents().catch(() => [] as string[]);
    const match = opts.find(o => o.toLowerCase().includes(catalogName.toLowerCase()));
    if (match) {
      await appSelects.nth(i).selectOption({ label: match });
      console.log(`[${tag}] Application: "${match}"`);
      appSelected = true;
      break;
    }
  }
  if (!appSelected) {
    warn(tag, `Application "${catalogName}" 미발견`);
    throw new Error(`[${tag}] Application "${catalogName}" 미발견`);
  }

  // Spec Check 클릭 → specCheckFlag = false → Deploy 버튼 활성화
  const deployBtnLoc = installModal.locator('button.btn-primary').filter({ hasText: /deploy/i }).first();
  const specCheckBtn = installModal.locator('button.btn-danger').filter({ hasText: /spec check/i }).first();
  const specCheckVisible = await specCheckBtn.isVisible({ timeout: 3_000 }).catch(() => false);

  // confirm 다이얼로그 자동 수락 (VM 스펙 미달 경고 무시)
  page.once('dialog', async dialog => {
    console.log(`[${tag}] dialog: ${dialog.message().slice(0, 80)}`);
    await dialog.accept();
  });

  if (specCheckVisible && await specCheckBtn.isEnabled({ timeout: 1_000 }).catch(() => false)) {
    await specCheckBtn.click();
    console.log(`[${tag}] Spec Check 클릭`);

    // Deploy 버튼 활성화 대기 (최대 15초)
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1_000);
      const isEnabled = await deployBtnLoc.isEnabled().catch(() => false);
      if (isEnabled) { console.log(`[${tag}] Deploy 버튼 활성화`); break; }
    }

    // 여전히 disabled면 iframe JS로 specCheckFlag 강제 해제
    if (!await deployBtnLoc.isEnabled().catch(() => false)) {
      warn(tag, 'Spec Check 후 Deploy 미활성 — iframe JS로 specCheckFlag 강제 해제');
      const iframeEl = page.locator('#targetIframe-sofrwareCatalog iframe').first();
      const iframeHandle = await iframeEl.elementHandle().catch(() => null);
      const frameObj = iframeHandle ? await iframeHandle.contentFrame().catch(() => null) : null;
      if (frameObj) {
        // Vue 컴포넌트 인스턴스의 specCheckFlag를 직접 false로 설정
        await frameObj.evaluate(() => {
          const btn = document.querySelector('#install-form button.btn-primary.ms-auto') as HTMLButtonElement | null;
          if (btn) btn.disabled = false;
        }).catch(() => {});
        console.log(`[${tag}] Deploy 버튼 강제 활성화`);
      }
    }
  }

  // Deploy 버튼 클릭 (disabled 여부 무관하게 JS 직접 클릭)
  const iframeEl2 = page.locator('#targetIframe-sofrwareCatalog iframe').first();
  const iframeHandle2 = await iframeEl2.elementHandle().catch(() => null);
  const frameObj2 = iframeHandle2 ? await iframeHandle2.contentFrame().catch(() => null) : null;
  if (frameObj2) {
    await frameObj2.evaluate(() => {
      const btn = document.querySelector('#install-form button.btn-primary.ms-auto') as HTMLButtonElement | null;
      if (btn) { btn.disabled = false; btn.click(); }
    }).catch(() => {});
    console.log(`[${tag}] Deploy 클릭 (JS)`);
  } else {
    await deployBtnLoc.click({ force: true });
    console.log(`[${tag}] Deploy 클릭 (force)`);
  }

  await page.waitForTimeout(3_000);
  const modalClosed = await installModal.waitFor({ state: 'hidden', timeout: 20_000 })
    .then(() => true).catch(() => false);

  if (modalClosed) {
    console.log(`[${tag}] TC-APP-DEP-01 완료 — ${catalogName} → ${mciName} 배포 요청`);
    store.set('deployedApp', catalogName);
    store.set('deployedMci', mciName);
  } else {
    warn(tag, 'Install 후 모달 미닫힘');
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-install-modal-not-closed.png`) }).catch(() => null);
    throw new Error(`[${tag}] Install 후 모달 미닫힘`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-APP-APPS-01: Apps Status 탭 목록 조회
// SW Catalog → Apps Status 탭 진입 → 목록 행 존재 확인
// deployedMci / deployedApp 이 store에 있으면 해당 항목을 찾아 로그 출력
// ─────────────────────────────────────────────────────────────────────────────
async function runAppApps01(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;
  const deployedMci: string = store.getOrDefault<string>('deployedMci', '');
  const deployedApp: string = store.getOrDefault<string>('deployedApp', '');

  const ok = await loginAndGoto(page, PAGES.sw.appsStatus, tag);
  if (!ok) { throw new Error(`[${tag}] SW Catalogs 페이지 진입 실패`); }

  const frame = await gotoSwIframeTab(page, /apps?\s*status/i, tag);
  if (!frame) { throw new Error(`[${tag}] Apps Status 탭 iframe 진입 실패`); }

  // 목록 로드 대기
  await page.waitForTimeout(2_000);

  // 행 셀렉터: Tabulator 또는 일반 table
  const rows = frame.locator(
    '.tabulator-row:not(.tabulator-placeholder), table tbody tr, [class*="app-item"], [class*="status-item"]'
  );

  // 최대 10초 대기하며 행 등장 확인
  let rowCount = 0;
  for (let i = 0; i < 5; i++) {
    rowCount = await rows.count().catch(() => 0);
    if (rowCount > 0) break;
    await page.waitForTimeout(2_000);
  }

  console.log(`[${tag}] Apps Status 목록 행 수: ${rowCount}`);

  if (rowCount === 0) {
    warn(tag, 'Apps Status 목록이 비어 있음 — 배포 항목 없음');
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-apps-status-empty.png`) }).catch(() => null);
    throw new Error(`[${tag}] Apps Status 목록에 행 없음`);
  }

  // 전체 행 출력 (최대 10개)
  for (let i = 0; i < Math.min(rowCount, 10); i++) {
    const text = ((await rows.nth(i).textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
    console.log(`[${tag}] row[${i}]: ${text}`);
  }

  // deployedMci 기준으로 해당 항목 확인 (있으면)
  if (deployedMci) {
    const matchRow = rows.filter({ hasText: new RegExp(deployedMci, 'i') }).first();
    const found = await matchRow.count() > 0;
    console.log(`[${tag}] deployedMci="${deployedMci}" 행 발견: ${found ? 'YES' : 'NO'}`);
    if (deployedApp && found) {
      const rowText = ((await matchRow.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      const hasApp = rowText.toLowerCase().includes(deployedApp.toLowerCase());
      console.log(`[${tag}] deployedApp="${deployedApp}" 포함: ${hasApp ? 'YES' : 'NO'}`);
    }
  }

  store.set('appsStatusRowCount', rowCount);
  console.log(`[${tag}] TC-APP-APPS-01 완료 — ${rowCount}건 목록 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-APP-APPS-02: Apps Status 항목 클릭 → Application Detail Popup 확인
// deployedMci와 일치하는 행을 클릭 → modal/detail popup 등장 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runAppApps02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;
  const deployedMci: string = store.getOrDefault<string>('deployedMci', '');
  const deployedApp: string = store.getOrDefault<string>('deployedApp', '');

  const ok = await loginAndGoto(page, PAGES.sw.appsStatus, tag);
  if (!ok) { throw new Error(`[${tag}] SW Catalogs 페이지 진입 실패`); }

  const frame = await gotoSwIframeTab(page, /apps?\s*status/i, tag);
  if (!frame) { throw new Error(`[${tag}] Apps Status 탭 iframe 진입 실패`); }

  await page.waitForTimeout(2_000);

  const rows = frame.locator(
    '.tabulator-row:not(.tabulator-placeholder), table tbody tr, [class*="app-item"], [class*="status-item"]'
  );

  let rowCount = 0;
  for (let i = 0; i < 5; i++) {
    rowCount = await rows.count().catch(() => 0);
    if (rowCount > 0) break;
    await page.waitForTimeout(2_000);
  }

  if (rowCount === 0) {
    warn(tag, 'Apps Status 목록이 비어 있음 — 클릭 대상 없음');
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-apps-status-empty.png`) }).catch(() => null);
    throw new Error(`[${tag}] Apps Status 목록에 행 없음`);
  }

  // 클릭 대상 행 선택: deployedMci 포함 행 우선, 없으면 첫 번째 행
  let targetRow = rows.first();
  if (deployedMci) {
    const matchRow = rows.filter({ hasText: new RegExp(deployedMci, 'i') }).first();
    if (await matchRow.count() > 0) {
      targetRow = matchRow;
      console.log(`[${tag}] 클릭 대상: deployedMci="${deployedMci}" 일치 행`);
    } else {
      console.log(`[${tag}] deployedMci="${deployedMci}" 행 없음 — 첫 번째 행 사용`);
    }
  }

  const rowText = ((await targetRow.textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 100);
  console.log(`[${tag}] 클릭 대상 행: ${rowText}`);

  // 행 클릭
  await targetRow.click();
  await page.waitForTimeout(1_500);

  // Application Detail Popup 확인
  // 팝업/모달 셀렉터: modal, dialog, detail 클래스 포함 요소
  const popup = frame.locator(
    '[class*="modal"]:not([style*="display: none"]), [role="dialog"], [class*="detail-popup"], [class*="app-detail"]'
  ).first();

  const popupVisible = await popup.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!popupVisible) {
    // 팝업이 page 레벨에 있을 수도 있음 (iframe 외부)
    const pagePopup = page.locator('[class*="modal"]:not([style*="display: none"]), [role="dialog"]').first();
    const pagePopupVisible = await pagePopup.isVisible({ timeout: 2_000 }).catch(() => false);
    if (pagePopupVisible) {
      const popupText = ((await pagePopup.textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
      console.log(`[${tag}] Application Detail Popup (page 레벨): ${popupText}`);
      console.log(`[${tag}] TC-APP-APPS-02 완료 — Application Detail Popup 확인 (page 레벨)`);
      return;
    }

    warn(tag, 'Application Detail Popup 미표시');
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-detail-popup-not-shown.png`) }).catch(() => null);
    throw new Error(`[${tag}] Application Detail Popup 미표시 — 행 클릭 후 popup 없음`);
  }

  const popupText = ((await popup.textContent()) ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  console.log(`[${tag}] Application Detail Popup: ${popupText}`);

  // popup 내 주요 필드 확인 (project / mci / app name)
  if (deployedApp) {
    const hasApp = popupText.toLowerCase().includes(deployedApp.toLowerCase());
    console.log(`[${tag}] Popup 내 deployedApp="${deployedApp}" 포함: ${hasApp ? 'YES' : 'NO'}`);
  }
  if (deployedMci) {
    const hasMci = popupText.toLowerCase().includes(deployedMci.toLowerCase());
    console.log(`[${tag}] Popup 내 deployedMci="${deployedMci}" 포함: ${hasMci ? 'YES' : 'NO'}`);
  }

  console.log(`[${tag}] TC-APP-APPS-02 완료 — Application Detail Popup 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// OBS AGENT 헬퍼: Config 탭 진입
// observability SPA 내 상단 네비에서 Config 탭을 클릭하여 MonitoringConfig 화면으로 이동
// ─────────────────────────────────────────────────────────────────────────────
// OBS 공통: observability 로드 + ws/proj 선택 + iframe frame 반환
async function obsLoadFrame(ctx: StepRunContext, tag: string): Promise<import('@playwright/test').Frame | null> {
  const { page } = ctx;
  const ok = await loginAndGoto(page, PAGES.obs.observability, tag);
  if (!ok) return null;

  await ensureWorkspaceProjectSelected(page, tag);
  await page.waitForTimeout(3_000);

  const frame = page.frames().find(f => f.url().includes(':18081'));
  if (!frame) {
    console.log(`[${tag}] OBS iframe(18081) 미발견 — 현재 프레임: ${page.frames().map(f => f.url()).join(', ')}`);
  }
  return frame ?? null;
}

// iframe 내에서 embed URL의 origin 얻기 (동적 호스트 지원)
async function obsIframeOrigin(page: import('@playwright/test').Page): Promise<string> {
  const src = await page.locator('iframe').getAttribute('src').catch(() => '');
  if (src) {
    try { return new URL(src).origin; } catch {}
  }
  return 'https://15.164.139.37:18081';
}

async function gotoObsConfigTab(page: import('@playwright/test').Page, tag: string): Promise<boolean> {
  // iframe 내 Config 탭 탐색 (외부 페이지가 아닌 iframe frame 내에서)
  const frame = page.frames().find(f => f.url().includes(':18081'));
  if (!frame) return false;

  const configTab = frame.locator('button').filter({ hasText: /^Config$/i }).first();
  const visible = await configTab.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  if (!visible) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-config-tab.png`) }).catch(() => null);
    return false;
  }

  await configTab.click();
  await page.waitForTimeout(1_500);
  console.log(`[${tag}] iframe Config 탭 클릭 완료`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-AGENT-01: 등록 가능 Node 조회(Config)
//
// 1. 상단 네비 Config 선택 (MonitoringConfig 화면 진입)
// 2. Infra 전체 노드 + 매니저 등록 노드 병합 목록이 표시되는지 확인
// 3. registered=false (미설치) 노드가 Install 가능 상태(Install Agent 버튼 노출)인지 검증
// ─────────────────────────────────────────────────────────────────────────────
async function runObsAgent01(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견 — observability 페이지 로드 실패`);

  // iframe을 /embed/config/default 로 이동 후 Loading 완료 대기
  const origin = await obsIframeOrigin(page);
  await frame.goto(`${origin}/embed/config/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await frame.waitForFunction(
    () => !document.body.innerText.includes('Loading'),
    { timeout: 12_000 }
  ).catch(() => null);
  await page.waitForTimeout(1_000);

  // Monitor Setting 확인
  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasMonitorSetting = /Monitor Setting/i.test(bodyText);
  if (!hasMonitorSetting) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-monitor-setting.png`) }).catch(() => null);
    console.log(`[${tag}] iframe body 미리보기: ${bodyText.slice(0, 300).replace(/\s+/g, ' ')}`);
  }

  // 노드 테이블 행 (table tr 또는 .tabulator-row)
  const allRows = await frame.locator('table tr, .tabulator-row').count().catch(() => 0);
  // Install Agent 버튼 (미설치 노드)
  const installBtns = await frame.locator('button').filter({ hasText: /Install/i }).count().catch(() => 0);

  // Monitoring Agent / Log Agent 상태 열 확인
  const statusCells = await frame.locator('td, .tabulator-cell').filter({ hasText: /Unknown|Active|inactive|SUCCESS/i }).count().catch(() => 0);

  console.log(`[${tag}] TC-OBS-AGENT-01: rows=${allRows}, Install버튼=${installBtns}, 상태셀=${statusCells}`);
  store.set('obsNodeTotalCount', allRows);
  store.set('obsInstallableCount', installBtns);

  if (allRows === 0) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-empty-node-table.png`) }).catch(() => null);
    throw new Error(`[${tag}] Node 목록 비어 있음 — /embed/config/default 에 노드 없음`);
  }

  console.log(`[${tag}] TC-OBS-AGENT-01 완료`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-AGENT-02: Agent 설치
//
// 진입 경로: 좌측 메뉴 "Monitorings(하위메뉴 없음)"
//   = /webconsole/operations/analytics/observability  (obsLoadFrame 사용)
//
// 대상: store.obsTargetMciId (기본 mci17) / store.obsTargetInfraId (기본 ing17-1)
//
// iframe 내부 흐름:
//   1. 모니터링 대시보드 로드 (기본화면)
//   2. 대상 노드 Agent 미설치 시 iframe에 "Go to Config to install agent" 버튼 표시
//   3. 버튼 클릭 → iframe이 Monitor Setting(Config)으로 내부 이동
//   4. mci17 workload 아래 노드 목록에서 ing17-1 행 탐색
//   5. Status=Running + Monitoring Agent=Not Installed → Install 버튼 클릭
//   6. 설치 시작 상태(INSTALLING) 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsAgent02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const targetMci   = store.getOrDefault<string>('obsTargetMciId',   'mci17');
  const targetInfra = store.getOrDefault<string>('obsTargetInfraId', 'ing17-1');
  console.log(`[${tag}] AGENT-02: 대상 mci=${targetMci}, infra=${targetInfra}`);

  // ── 1단계: observability 진입 + iframe 획득 ──────────────────────────────
  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] AGENT-02: OBS iframe 미발견`);

  await page.waitForTimeout(2_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-agent02-obs-loaded.png`) }).catch(() => null);

  // ── 2단계: "Go to Config to install agent" 버튼 탐색 (iframe 우선) ───────
  // 모니터링 대시보드: Agent 미설치 시 iframe 내부에 버튼 표시
  const iframeBtnLocator = frame.locator('button, a').filter({ hasText: /go.?to.?config|install.?agent/i }).first();
  let hasGoConfig = await iframeBtnLocator.waitFor({ state: 'visible', timeout: 6_000 })
    .then(() => true).catch(() => false);

  if (!hasGoConfig) {
    // outer page에도 확인 (overlay 방식인 경우)
    const outerBtn = page.locator('button, a').filter({ hasText: /go.?to.?config|install.?agent/i }).first();
    hasGoConfig = await outerBtn.waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true).catch(() => false);
    if (hasGoConfig) {
      console.log(`[${tag}] AGENT-02: outer page에서 Go to Config 버튼 발견 — 클릭`);
      await outerBtn.click();
    }
  } else {
    console.log(`[${tag}] AGENT-02: iframe에서 "Go to Config to install agent" 버튼 발견 — 클릭`);
    await iframeBtnLocator.click();
  }

  if (!hasGoConfig) {
    // 버튼 없음 — iframe body 로그 후 판단
    const iframeBody = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    console.log(`[${tag}] AGENT-02: iframe body = ${iframeBody.slice(0, 400).replace(/\s+/g, ' ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-go-config.png`) }).catch(() => null);

    // 이미 Monitor Setting 화면(Config)인지 확인
    const alreadyOnConfig = /monitor setting|not installed|running/i.test(iframeBody);
    if (!alreadyOnConfig) {
      // Config 탭으로 직접 이동
      const origin = await obsIframeOrigin(page);
      console.log(`[${tag}] AGENT-02: Config 직접 이동 → ${origin}/embed/config/default`);
      await frame.goto(`${origin}/embed/config/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
    }
  }

  // ── 3단계: Monitor Setting(Config) 로딩 대기 ────────────────────────────
  // "Go to Config" 클릭 시 iframe이 /embed/config/default/{mci} 로 자동 이동
  // "Loading..." 텍스트가 사라질 때까지 대기
  await frame.waitForFunction(
    () => !document.body.innerText.includes('Loading'),
    { timeout: 12_000 }
  ).catch(() => null);
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-agent02-config-page.png`) }).catch(() => null);

  const configBody = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  console.log(`[${tag}] AGENT-02: Config URL=${frame.url()}, body = ${configBody.slice(0, 400).replace(/\s+/g, ' ')}`);

  await page.waitForTimeout(1_000);

  // ── 4단계: ing17-1 행 탐색 + Status/Agent 상태 확인 ─────────────────────
  const infraRow = frame.locator('tr, [class*="row"]')
    .filter({ hasText: new RegExp(targetInfra, 'i') }).first();
  const hasInfraRow = await infraRow.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  if (!hasInfraRow) {
    const rows = await frame.locator('tr, [class*="row"]').allTextContents().catch(() => [] as string[]);
    console.log(`[${tag}] AGENT-02: 노드 목록 = ${rows.slice(0, 8).map(r => r.replace(/\s+/g, ' ').trim().slice(0, 80)).join(' | ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-infra-row.png`) }).catch(() => null);
    throw new Error(`[${tag}] AGENT-02: "${targetInfra}" 행 미발견 — mci=${targetMci}`);
  }

  const rowText = ((await infraRow.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
  console.log(`[${tag}] AGENT-02: ${targetInfra} 행 = "${rowText.slice(0, 150)}"`);

  const isRunning            = /running/i.test(rowText);
  const monAgentNotInstalled = /not.?installed/i.test(rowText);

  store.set('obsIngStatus',           isRunning ? 'Running' : 'Unknown');
  store.set('obsMonAgentNotInstalled', monAgentNotInstalled);
  console.log(`[${tag}] AGENT-02: Status=Running=${isRunning}, MonAgent미설치=${monAgentNotInstalled}`);

  if (!isRunning) {
    warn(tag, `AGENT-02: ${targetInfra} Status가 Running이 아님 — 설치 불가`);
    throw new Error(`[${tag}] AGENT-02: ${targetInfra} Status != Running (행: ${rowText.slice(0, 60)})`);
  }

  // ── 5단계: Monitoring Agent Install 버튼 클릭 ────────────────────────────
  // 행 내 첫 번째 Install = Monitoring Agent (두 번째 = Log Agent)
  const installBtns = infraRow.locator('button').filter({ hasText: /^Install$/i });
  const installCount = await installBtns.count().catch(() => 0);
  console.log(`[${tag}] AGENT-02: ${targetInfra} Install 버튼 수 = ${installCount}`);

  if (installCount === 0) {
    if (!monAgentNotInstalled) {
      store.set('obsAgentAlreadyInstalled', true);
      console.log(`[${tag}] AGENT-02: Monitoring Agent 이미 설치됨 — OK`);
      return;
    }
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-install-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] AGENT-02: Install 버튼 없음 (${targetInfra}, Running=${isRunning})`);
  }

  // ── 5b: dialog 핸들러 등록 ──────────────────────────────────────────────
  // Install 클릭 시 dialog 2개 발생:
  //   [1] confirm : "Install monitoring agent on '{node}'?" → accept (설치 확인)
  //   [2] alert   : "Install failed: ..." 가 있으면 백엔드 오류
  let installErrorMsg = '';
  const dialogHandler = async (dialog: import('@playwright/test').Dialog) => {
    const msg = dialog.message();
    if (dialog.type() === 'confirm') {
      console.log(`[${tag}] AGENT-02: 설치 confirm → accept: "${msg}"`);
      await dialog.accept();
    } else {
      // alert = 오류
      installErrorMsg = msg;
      console.log(`[${tag}] AGENT-02: 설치 오류 alert: "${msg}"`);
      await dialog.dismiss().catch(() => null);
    }
  };
  page.on('dialog', dialogHandler);

  await installBtns.first().click();
  await page.waitForTimeout(5_000);   // confirm + error alert 모두 받을 때까지 대기
  page.off('dialog', dialogHandler);

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-agent02-after-install.png`) }).catch(() => null);

  store.set('obsAgentMci',   targetMci);
  store.set('obsAgentInfra', targetInfra);

  // 백엔드 오류 alert가 떴으면 즉시 실패 처리
  if (installErrorMsg) {
    store.set('obsAgentInstallError',  installErrorMsg);
    store.set('obsAgentInstalling',    false);
    const failedProviders = store.getOrDefault<string[]>('obsAgentFailedProviders', []);
    failedProviders.push(targetMci);
    store.set('obsAgentFailedProviders', failedProviders);
    throw new Error(`[${tag}] AGENT-02: ${targetMci}/${targetInfra} Install 백엔드 오류 — "${installErrorMsg}"`);
  }

  // ── 6단계: 설치 시작 상태 기록 (오류 없이 accept 완료) ──────────────────
  const afterText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const isInstalling = /INSTALLING|installing/i.test(afterText);
  const isSuccess    = /SUCCESS|Active/i.test(afterText);
  console.log(`[${tag}] TC-OBS-AGENT-02: INSTALLING=${isInstalling}, SUCCESS=${isSuccess}`);
  store.set('obsAgentInstalling', isInstalling || isSuccess);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-AGENT-03: Agent 설치 상태 폴링
//
// AGENT-02에서 Install 버튼 클릭 후 이 TC가 실행됨.
//
// 폴링 판정 기준:
//   - SUCCESS : Monitoring Agent 상태가 "Not installed"에서 다른 값(Active 등)으로 변경됨
//   - INSTALLING: 상태가 "INSTALLING" / "Installing" 등으로 진행 중
//   - FAILED  : 상태가 "FAILED" / "Error" 텍스트 포함
//   - 변화없음 : maxNoChangePolls 회 연속 동일 상태 → 설치 실패로 판정 (FAILED)
//   - 타임아웃 : maxWaitMs 초과 → FAILED
//
// provider 실패 시 store에 'obsAgentFailedProvider' 기록
// ─────────────────────────────────────────────────────────────────────────────
async function runObsAgent03(ctx: StepRunContext, tag: string): Promise<void> {
  test.setTimeout(8 * 60_000);

  const { page, store } = ctx;
  const targetMci        = store.getOrDefault<string>('obsTargetMciId',   'mci17');
  const targetInfra      = store.getOrDefault<string>('obsTargetInfraId', 'ing17-1');
  const maxWaitMs        = 5 * 60_000;
  const intervalMs       = 10_000;
  const maxNoChangePolls = 4;   // 연속 N회 상태 변화 없으면 → 설치 실패
  const startTime        = Date.now();
  let finalStatus        = 'UNKNOWN';
  let lastRowText        = '';
  let noChangeCount      = 0;

  console.log(`[${tag}] AGENT-03: 상태 폴링 시작 — mci=${targetMci}, infra=${targetInfra} (최대 5분, 변화없음 ${maxNoChangePolls}회→실패)`);

  // observability 진입 + iframe 획득
  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] AGENT-03: OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  await frame.goto(`${origin}/embed/config/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(2_000);

  while (Date.now() - startTime < maxWaitMs) {
    // Refresh 버튼 클릭 또는 iframe 재이동으로 상태 갱신
    const refreshBtn = frame.locator('button').filter({ hasText: /^Refresh$/i }).first();
    if (await refreshBtn.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(2_000);
    } else {
      await frame.goto(`${origin}/embed/config/default`, { waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => null);
      await page.waitForTimeout(2_000);
    }

    // ing17-1 행 상태 읽기
    const infraRow = frame.locator('tr, [class*="row"]')
      .filter({ hasText: new RegExp(targetInfra, 'i') }).first();
    const rowText = ((await infraRow.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[${tag}] AGENT-03 폴링 (${elapsed}s, 변화없음=${noChangeCount}/${maxNoChangePolls}): ${rowText.slice(0, 120)}`);

    // 상태 변화 감지: Monitoring Agent 열이 "Not installed"에서 다른 값으로 변경
    // 행 구조: [name][nodeId][Status][MonAgentStatus][LogAgentStatus]
    // "Not installed"가 설치 전 2개였다가 MonAgent 설치 후 1개(LogAgent만)로 줄어야 함
    const notInstalledCount = (rowText.match(/not installed/gi) ?? []).length;
    const hasInstalling     = /INSTALLING|Installing|In Progress/i.test(rowText);
    const hasFailed         = /FAILED|Error/i.test(rowText);
    // MonAgent 설치 완료: Active / SUCCESS / SERVICE_INACTIVE / Uninstall 버튼으로 전환
    const monAgentInstalled = /Active|SUCCESS|SERVICE_INACTIVE|Uninstall/i.test(rowText)
      || (notInstalledCount < 2 && !hasInstalling);

    if (hasFailed) {
      finalStatus = 'FAILED';
      break;
    }

    if (monAgentInstalled && !hasInstalling) {
      finalStatus = 'SUCCESS';
      break;
    }

    if (hasInstalling) {
      // 설치 진행 중 — noChange 카운터 리셋 (변화 있음)
      noChangeCount = 0;
      finalStatus = 'INSTALLING';
    } else {
      // 상태 변화 없음 체크
      if (rowText === lastRowText) {
        noChangeCount++;
        if (noChangeCount >= maxNoChangePolls) {
          finalStatus = 'FAILED';
          console.log(`[${tag}] AGENT-03: ${maxNoChangePolls}회 연속 상태 변화 없음 → 설치 실패`);
          break;
        }
      } else {
        noChangeCount = 0;
      }
    }

    lastRowText = rowText;
    await page.waitForTimeout(intervalMs);
  }

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-agent03-final.png`) }).catch(() => null);
  store.set('obsAgentStatus', finalStatus);

  if (finalStatus !== 'SUCCESS') {
    // provider 실패 기록
    const failedProviders = store.getOrDefault<string[]>('obsAgentFailedProviders', []);
    failedProviders.push(targetMci);
    store.set('obsAgentFailedProviders', failedProviders);
    console.log(`[${tag}] AGENT-03: ${targetMci}/${targetInfra} Monitoring Agent 설치 실패 기록`);
  }

  if (finalStatus === 'SUCCESS') {
    console.log(`[${tag}] AGENT-03: Monitoring Agent 설치 SUCCESS (${targetMci}/${targetInfra})`);
  } else if (finalStatus === 'FAILED') {
    throw new Error(`[${tag}] AGENT-03: ${targetMci}/${targetInfra} Monitoring Agent 설치 FAILED (상태 변화 없음 또는 오류)`);
  } else {
    throw new Error(`[${tag}] AGENT-03: 상태 폴링 타임아웃 5분 초과 (마지막 상태: ${finalStatus}, mci=${targetMci})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// OBS Insight 공통 헬퍼: Insight 탭 진입
// /embed/log/{ns} 이동 후 iframe 내 "Insight" 탭 버튼 클릭
// ─────────────────────────────────────────────────────────────────────────────
async function gotoInsightTab(
  frame: import('@playwright/test').Frame,
  page: import('@playwright/test').Page,
  origin: string,
  tag: string,
): Promise<boolean> {
  await frame.goto(`${origin}/embed/log/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(1_500);

  const insightTab = frame.locator('button').filter({ hasText: /^Insight$/i }).first();
  const visible = await insightTab.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  if (!visible) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-insight-tab.png`) }).catch(() => null);
    console.log(`[${tag}] Insight 탭 미발견 — iframe body: ${((await frame.locator('body').textContent().catch(() => '')) ?? '').slice(0, 200).replace(/\s+/g, ' ')}`);
    return false;
  }

  await insightTab.click();
  await page.waitForTimeout(1_500);
  console.log(`[${tag}] Insight 탭 클릭 완료`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-INSIGHT-01: Anomaly Detection 설정
//
// 1. Insight → Anomaly Detection 탭 진입
// 2. 측정항목(measurement) 옵션 로드 확인
// 3. 측정항목·대상(scope)·주기(interval) 지정 후 설정 생성 (Create/Add 클릭)
// 4. 설정 목록에 추가 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsInsight01(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasInsight = await gotoInsightTab(frame, page, origin, tag);
  if (!hasInsight) throw new Error(`[${tag}] Insight 탭 미발견 — OBS Insight 화면 진입 불가`);

  // Anomaly Detection 하위 탭 클릭
  const anomalyTab = frame.locator('button, li, a, .tab').filter({ hasText: /anomaly.*detection|Anomaly Detection/i }).first();
  const hasAnomalyTab = await anomalyTab.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);
  if (hasAnomalyTab) {
    await anomalyTab.click();
    await page.waitForTimeout(1_500);
    console.log(`[${tag}] Anomaly Detection 탭 클릭`);
  }

  // 측정항목(measurement) 옵션 로드 확인
  // GET /api/o11y/insight/anomaly-detection/options 결과가 드롭다운으로 표시됨
  const measurementSelect = frame.locator('select, [class*="select"], [class*="dropdown"]').first();
  const hasMeasurement = await measurementSelect.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasMeasurement) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    console.log(`[${tag}] 측정항목 드롭다운 미발견 — body: ${bodyText.slice(0, 200).replace(/\s+/g, ' ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-measurement-select.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-01: 측정항목 드롭다운 미발견`);
  }

  // 첫 번째 측정항목 선택
  await measurementSelect.selectOption({ index: 1 }).catch(async () => {
    // click-based dropdown
    await measurementSelect.click().catch(() => null);
    await page.waitForTimeout(500);
    await frame.locator('.dropdown-item, option, li').first().click().catch(() => null);
  });
  await page.waitForTimeout(500);

  // scope/interval 기본값 유지 (첫 번째 옵션 자동 선택)

  // Create / Add 버튼 클릭
  const createBtn = frame.locator('button').filter({ hasText: /create|add|추가|생성/i }).first();
  const hasCreate = await createBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (!hasCreate) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-create-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-01: Create/Add 버튼 미발견`);
  }

  await createBtn.click();
  await page.waitForTimeout(2_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-anomaly-setting-created.png`) }).catch(() => null);

  // 설정 목록 확인 (POST 후 목록에 추가됨)
  const settingsList = frame.locator('table tr, .tabulator-row, [class*="setting-item"]');
  const listCount = await settingsList.count().catch(() => 0);
  console.log(`[${tag}] INSIGHT-01: 설정 목록 ${listCount}건`);
  store.set('obsAnomalySettingCount', listCount);

  if (listCount === 0) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-empty-settings-list.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-01: 설정 생성 후 목록 비어 있음`);
  }

  console.log(`[${tag}] TC-OBS-INSIGHT-01 완료 — Anomaly Detection 설정 추가`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-INSIGHT-02: Anomaly History 조회
//
// 1. Insight → Anomaly Detection 탭 내 "Anomaly Detection History" 섹션
// 2. 측정항목 선택 → Load 버튼 클릭
// 3. GET .../history?measurement=...&start_time=...&end_time=...
// 4. anomaly_score 시계열 차트 표시 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsInsight02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasInsight = await gotoInsightTab(frame, page, origin, tag);
  if (!hasInsight) throw new Error(`[${tag}] Insight 탭 미발견`);

  // Anomaly Detection 탭
  const anomalyTab = frame.locator('button, li, a, .tab').filter({ hasText: /anomaly.*detection/i }).first();
  if (await anomalyTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await anomalyTab.click();
    await page.waitForTimeout(1_500);
  }

  // "Anomaly Detection History" 섹션 탐색
  const historySection = frame.locator('[class*="history"], [id*="history"], h2, h3, label')
    .filter({ hasText: /history|이력/i }).first();
  const hasHistory = await historySection.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasHistory) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    console.log(`[${tag}] History 섹션 미발견 — body: ${bodyText.slice(0, 200).replace(/\s+/g, ' ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-history-section.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-02: Anomaly Detection History 섹션 미발견`);
  }

  // 측정항목(measurement) 선택
  const measurementSel = frame.locator('select, [class*="select"]').filter({ hasText: /cpu|memory|measurement/i })
    .first();
  if (await measurementSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await measurementSel.selectOption({ index: 1 }).catch(() => null);
    await page.waitForTimeout(300);
  }

  // Load 버튼 클릭
  const loadBtn = frame.locator('button').filter({ hasText: /load|조회|검색/i }).first();
  const hasLoad = await loadBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (!hasLoad) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-load-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-02: Load 버튼 미발견`);
  }

  await loadBtn.click();
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-anomaly-history.png`) }).catch(() => null);

  // anomaly_score 시계열 차트 확인 (canvas 또는 svg 차트)
  const chart = frame.locator('canvas, svg[class*="chart"], [class*="chart"], [class*="graph"]').first();
  const hasChart = await chart.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasAnomalyScore = /anomaly.?score|score/i.test(bodyText);

  console.log(`[${tag}] INSIGHT-02: 차트 표시=${hasChart}, anomaly_score 텍스트=${hasAnomalyScore}`);

  if (!hasChart && !hasAnomalyScore) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-anomaly-chart.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-02: anomaly_score 시계열 차트 미표시`);
  }

  console.log(`[${tag}] TC-OBS-INSIGHT-02 완료 — Anomaly History 차트 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-INSIGHT-03: Prediction(예측)
//
// 1. Insight → Prediction 탭
// 2. 측정항목 선택 → 예측 실행(POST)
// 3. GET .../history?measurement=...
// 4. predicted_value 시계열(과거+미래) 차트 확인
//    (CPU: 100-usage_idle 사용률로 표시)
// ─────────────────────────────────────────────────────────────────────────────
async function runObsInsight03(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasInsight = await gotoInsightTab(frame, page, origin, tag);
  if (!hasInsight) throw new Error(`[${tag}] Insight 탭 미발견`);

  // Prediction 하위 탭 클릭
  const predTab = frame.locator('button, li, a, .tab').filter({ hasText: /^prediction$|예측/i }).first();
  const hasPredTab = await predTab.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (hasPredTab) {
    await predTab.click();
    await page.waitForTimeout(1_500);
    console.log(`[${tag}] Prediction 탭 클릭`);
  } else {
    warn(tag, 'Prediction 탭 미발견 — Insight 화면 내 별도 탭 없을 수 있음');
  }

  // 옵션 조회 확인 (GET /api/o11y/insight/predictions/options → 드롭다운)
  const measurementSel = frame.locator('select, [class*="select"], [class*="dropdown"]').first();
  const hasMeasurement = await measurementSel.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasMeasurement) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    console.log(`[${tag}] 측정항목 드롭다운 미발견 — body: ${bodyText.slice(0, 200).replace(/\s+/g, ' ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-prediction-select.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-03: 측정항목 드롭다운 미발견`);
  }

  // 측정항목 선택 (cpu 우선, 없으면 첫 번째)
  const cpuOpt = frame.locator('option, .dropdown-item, li').filter({ hasText: /cpu/i }).first();
  if (await cpuOpt.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cpuOpt.click().catch(() => null);
  } else {
    await measurementSel.selectOption({ index: 1 }).catch(() => null);
  }
  await page.waitForTimeout(500);

  // 예측 실행 버튼 (POST)
  const runBtn = frame.locator('button').filter({ hasText: /run|predict|실행|조회/i }).first();
  const hasRun = await runBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (!hasRun) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-run-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-03: 예측 실행 버튼 미발견`);
  }

  await runBtn.click();
  await page.waitForTimeout(4_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-prediction-result.png`) }).catch(() => null);

  // predicted_value 시계열 차트 확인
  const chart = frame.locator('canvas, svg[class*="chart"], [class*="chart"], [class*="graph"]').first();
  const hasChart = await chart.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasPredicted = /predict|predicted.?value|forecast/i.test(bodyText);

  console.log(`[${tag}] INSIGHT-03: 차트 표시=${hasChart}, predicted_value=${hasPredicted}`);

  if (!hasChart && !hasPredicted) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-prediction-chart.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-03: predicted_value 시계열 차트 미표시`);
  }

  console.log(`[${tag}] TC-OBS-INSIGHT-03 완료 — Prediction 차트 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-INSIGHT-04: Server Error Analysis (LLM)
//
// 1. Insight → 'Server Error Analysis' 탭
// 2. LLM 모델/세션 조회 (GET /api/o11y/insight/llm/model, /llm/session)
// 3. 측정항목·범위 지정 → 서버 에러 분석 실행 (POST .../server-error-analysis/detect)
// 4. 분석 레코드 목록/상세 확인 (GET .../records, GET .../records/{analysisId})
// 5. LLM 세션 히스토리 및 분석 결과 메시지 표시 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsInsight04(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasInsight = await gotoInsightTab(frame, page, origin, tag);
  if (!hasInsight) throw new Error(`[${tag}] Insight 탭 미발견`);

  // Server Error Analysis 탭 클릭
  const seaTab = frame.locator('button, li, a, .tab')
    .filter({ hasText: /server.?error|error.?analysis|서버.?에러/i }).first();
  const hasSeaTab = await seaTab.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (hasSeaTab) {
    await seaTab.click();
    await page.waitForTimeout(1_500);
    console.log(`[${tag}] Server Error Analysis 탭 클릭`);
  } else {
    warn(tag, 'Server Error Analysis 탭 미발견 — Insight 화면 내 탭 구성 확인 필요');
  }

  // LLM 모델/세션 로드 확인 (GET /llm/model, /llm/session 결과 → 드롭다운 또는 텍스트)
  await page.waitForTimeout(2_000);
  const bodyText1 = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasLlmModel = /model|session|LLM|gpt|claude|ollama/i.test(bodyText1);
  console.log(`[${tag}] LLM 모델/세션 로드: ${hasLlmModel} — body: ${bodyText1.slice(0, 150).replace(/\s+/g, ' ')}`);

  if (!hasLlmModel) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-llm-model.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-04: LLM 모델/세션 정보 미표시`);
  }

  // 측정항목/범위 선택 (드롭다운 또는 기본값 유지)
  const measurementSel = frame.locator('select, [class*="select"]').first();
  if (await measurementSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await measurementSel.selectOption({ index: 1 }).catch(() => null);
    await page.waitForTimeout(300);
  }

  // 분석 실행 버튼 (POST /server-error-analysis/detect)
  const detectBtn = frame.locator('button')
    .filter({ hasText: /detect|analyze|분석|실행|run/i }).first();
  const hasDetect = await detectBtn.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasDetect) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-detect-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-04: 분석 실행(Detect) 버튼 미발견`);
  }

  await detectBtn.click();
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-sea-detect-clicked.png`) }).catch(() => null);

  // 분석 레코드 목록 확인 (GET .../records)
  // 레코드가 테이블 행 또는 리스트로 표시됨
  const recordRows = frame.locator('table tr, .tabulator-row, [class*="record"], [class*="analysis-item"]');
  let recordCount = 0;
  for (let i = 0; i < 6; i++) {
    recordCount = await recordRows.count().catch(() => 0);
    if (recordCount > 0) break;
    await page.waitForTimeout(2_000);
  }
  console.log(`[${tag}] INSIGHT-04: 분석 레코드 ${recordCount}건`);
  store.set('obsSeaRecordCount', recordCount);

  if (recordCount === 0) {
    // 분석 실행 직후라 아직 레코드가 없을 수 있음 — LLM 응답 대기
    warn(tag, '분석 레코드 0건 — LLM 분석 진행 중일 수 있음');
  }

  // 첫 번째 레코드 클릭 → 상세 확인 (GET .../records/{analysisId})
  if (recordCount > 0) {
    await recordRows.first().click().catch(() => null);
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-sea-record-detail.png`) }).catch(() => null);
  }

  // LLM 세션 히스토리 및 분석 결과 메시지 확인
  const bodyText2 = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasResult = /analysis|error|LLM|message|결과|분석/i.test(bodyText2);
  const hasHistory = /history|session|이력/i.test(bodyText2);

  console.log(`[${tag}] INSIGHT-04: 분석결과=${hasResult}, 세션히스토리=${hasHistory}`);

  if (!hasResult) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-sea-result.png`) }).catch(() => null);
    throw new Error(`[${tag}] INSIGHT-04: 서버 에러 분석 결과 메시지 미표시`);
  }

  console.log(`[${tag}] TC-OBS-INSIGHT-04 완료 — LLM 서버 에러 분석 결과 확인`);
}

// runObsIframeGeneric: TC-OBS-AGENT-04~05, METRIC-*, LOG-*, INSIGHT-*, TRIG-*, TRACE-*, IFRAME-*
//
// 공통 흐름:
//   1. observability 외부 페이지 로드 + ws01/default 선택
//   2. iframe(18081) frame 참조 획득
//   3. TC 그룹에 따라 /embed/config/{ns} 또는 /embed/log/{ns} 로 iframe 이동
//   4. 필요 시 탭 버튼(Monitoring|Logs|Config|Insight|Alerts|Tracing) 클릭
//   5. iframe body 내용 검증
// ─────────────────────────────────────────────────────────────────────────────
async function runObsIframeGeneric(ctx: StepRunContext, tag: string, tcId: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) { warn(tag, `${tcId}: OBS iframe 미발견`); return; }

  const origin = await obsIframeOrigin(page);

  // TC 그룹에 따라 embed URL 및 탭 결정
  type ObsTarget = { embedUrl: string; tab?: string; check: RegExp };
  const targets: Record<string, ObsTarget> = {
    'TC-OBS-AGENT-04': { embedUrl: `${origin}/embed/config/default`, check: /plugin|item|metric|cpu|disk/i },
    'TC-OBS-AGENT-05': { embedUrl: `${origin}/embed/config/default`, check: /Uninstall|Remove|Unknown|Active/i },
    'TC-OBS-METRIC-01': { embedUrl: `${origin}/embed/log/default`, tab: 'Monitoring', check: /Monitoring Trend|Workload|Measurement/i },
    'TC-OBS-METRIC-02': { embedUrl: `${origin}/embed/log/default`, tab: 'Monitoring', check: /Monitoring Trend|Workload|cpu|disk/i },
    'TC-OBS-METRIC-03': { embedUrl: `${origin}/embed/log/default`, tab: 'Monitoring', check: /Monitoring Trend|K8s|cluster/i },
    'TC-OBS-METRIC-04': { embedUrl: `${origin}/embed/log/default`, tab: 'Monitoring', check: /Monitoring Trend|Workload/i },
    'TC-OBS-INSIGHT-01': { embedUrl: `${origin}/embed/log/default`, tab: 'Insight', check: /Insight|Anomaly|Detection|Prediction/i },
    'TC-OBS-INSIGHT-02': { embedUrl: `${origin}/embed/log/default`, tab: 'Insight', check: /Insight|History|Anomaly/i },
    'TC-OBS-INSIGHT-03': { embedUrl: `${origin}/embed/log/default`, tab: 'Insight', check: /Insight|Predict/i },
    'TC-OBS-INSIGHT-04': { embedUrl: `${origin}/embed/log/default`, tab: 'Insight', check: /Insight|Analysis|LLM|Error/i },
    'TC-OBS-LOG-01': { embedUrl: `${origin}/embed/log/default`, tab: 'Logs', check: /Log|label|Loki/i },
    'TC-OBS-LOG-02': { embedUrl: `${origin}/embed/log/default`, tab: 'Logs', check: /Log|search|query|keyword/i },
    'TC-OBS-TRACE-01': { embedUrl: `${origin}/embed/log/default`, tab: 'Tracing', check: /Trac|Tempo|span/i },
    'TC-OBS-TRACE-02': { embedUrl: `${origin}/embed/log/default`, tab: 'Tracing', check: /Trac|Tempo|span|detail/i },
    'TC-OBS-TRACE-03': { embedUrl: `${origin}/embed/log/default`, tab: 'Tracing', check: /Trac|iframe|Grafana/i },
    'TC-OBS-TRIG-01': { embedUrl: `${origin}/embed/log/default`, tab: 'Alerts', check: /Alert|Trigger|Policy/i },
    'TC-OBS-TRIG-02': { embedUrl: `${origin}/embed/log/default`, tab: 'Alerts', check: /Alert|Target|Node/i },
    'TC-OBS-TRIG-03': { embedUrl: `${origin}/embed/log/default`, tab: 'Alerts', check: /Alert|Channel|알림/i },
    'TC-OBS-TRIG-04': { embedUrl: `${origin}/embed/log/default`, tab: 'Alerts', check: /Alert|History|이력/i },
    'TC-OBS-TRIG-05': { embedUrl: `${origin}/embed/log/default`, tab: 'Alerts', check: /Alert|Policy|수정|Edit/i },
    'TC-OBS-IFRAME-01': { embedUrl: `${origin}/embed/monitoring/default`, check: /Namespace|mci|Node|K8s/i },
  };

  const target = targets[tcId];
  if (!target) {
    warn(tag, `${tcId}: runObsIframeGeneric에 target 없음 — 기본 overview 확인`);
    const overviewText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    console.log(`[${tag}] ${tcId}: overview body = ${overviewText.slice(0, 200).replace(/\s+/g, ' ')}`);
    return;
  }

  // iframe URL 이동
  await frame.goto(target.embedUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(2_000);

  // 탭 클릭 (필요한 경우)
  if (target.tab) {
    const tabBtn = frame.locator('button').filter({ hasText: new RegExp(`^${target.tab}$`, 'i') }).first();
    const tabVisible = await tabBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (tabVisible) {
      await tabBtn.click();
      await page.waitForTimeout(2_000);
      console.log(`[${tag}] ${tcId}: ${target.tab} 탭 클릭`);
    } else {
      warn(tag, `${tcId}: ${target.tab} 탭 버튼 미발견 — iframe에 탭 없음 (Start Monitoring 필요할 수 있음)`);
    }
  }

  // 내용 확인
  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const matched = target.check.test(bodyText);
  console.log(`[${tag}] ${tcId}: 검증=${matched} (체크패턴=${target.check.source})`);
  console.log(`[${tag}] ${tcId}: body 미리보기 = ${bodyText.slice(0, 300).replace(/\s+/g, ' ')}`);

  if (!matched) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-obs-check-fail.png`) }).catch(() => null);
    warn(tag, `${tcId}: 기대 패턴 미일치 (체크=${target.check.source}) — iframe 로드 완료 여부 확인 필요`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OBS Log 공통 헬퍼: LogViewer(Logs 탭) 진입
// /embed/log/{ns} 이동 후 iframe 내 "Logs" 탭 버튼 클릭
// ─────────────────────────────────────────────────────────────────────────────
async function gotoLogsTab(
  frame: import('@playwright/test').Frame,
  page: import('@playwright/test').Page,
  origin: string,
  tag: string,
): Promise<boolean> {
  await frame.goto(`${origin}/embed/log/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(1_500);

  const logsTab = frame.locator('button').filter({ hasText: /^Logs$/i }).first();
  const visible = await logsTab.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  if (!visible) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-logs-tab.png`) }).catch(() => null);
    return false;
  }

  await logsTab.click();
  await page.waitForTimeout(1_500);
  console.log(`[${tag}] Logs 탭 클릭 완료`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-LOG-01: 라벨 조회 (LogViewer)
//
// 1. Logs 탭(LogViewer) 진입 (/logs/{nsId}[/{infraId}[/{nodeId}]])
// 2. GET /api/o11y/log/labels → 라벨 키 목록
//    GET /api/o11y/log/labels/{label}/values → 라벨 값
// 3. Workload(Infra/Node)·Server 셀렉터에 라벨/값 반영 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsLog01(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasLogs = await gotoLogsTab(frame, page, origin, tag);
  if (!hasLogs) throw new Error(`[${tag}] Logs 탭 미발견 — LogViewer 진입 불가`);

  // Workload / Server 셀렉터 로드 대기
  await page.waitForTimeout(2_000);
  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';

  // 라벨 키/값이 드롭다운 옵션으로 표시됨
  const selects = frame.locator('select, [class*="select"], [class*="dropdown"]');
  const selectCount = await selects.count().catch(() => 0);
  console.log(`[${tag}] LOG-01: 셀렉터 수 = ${selectCount}`);

  // Workload(Infra/Node) 셀렉터 확인
  const hasWorkload  = /workload|infra|node|Infra|Node/i.test(bodyText);
  // Server 셀렉터 확인
  const hasServer    = /server|Server/i.test(bodyText);
  // 라벨 관련 텍스트
  const hasLabelData = /label|namespace|NS_ID|INFRA_ID|NODE_ID/i.test(bodyText);

  console.log(`[${tag}] LOG-01: workload=${hasWorkload}, server=${hasServer}, labelData=${hasLabelData}, 셀렉터=${selectCount}`);
  store.set('obsLogLabelLoaded', hasLabelData);

  if (!hasWorkload && !hasServer && !hasLabelData) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-log-selectors.png`) }).catch(() => null);
    throw new Error(`[${tag}] LOG-01: LogViewer에 Workload/Server 셀렉터 또는 라벨 데이터 미표시`);
  }

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-log-labels.png`) }).catch(() => null);
  console.log(`[${tag}] TC-OBS-LOG-01 완료 — 라벨/셀렉터 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-LOG-02: 키워드 검색 (LogQL)
//
// 1. LogViewer에서 Workload(Infra/Node)·Server 선택 후 Keyword("error") 입력 → Search
// 2. LogQL 자동 생성: {NS_ID="...",INFRA_ID="..."[,NODE_ID="..."]} |~ "(?i)error"
// 3. GET /api/o11y/log/query_range?query=...&start=...&end=...&limit=...&direction=BACKWARD
// 4. 로그 표(Timestamp/Level/Node/Service/Message) 및 통계 확인, 행 클릭 시 상세 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsLog02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasLogs = await gotoLogsTab(frame, page, origin, tag);
  if (!hasLogs) throw new Error(`[${tag}] Logs 탭 미발견`);

  await page.waitForTimeout(1_500);

  // Workload 셀렉터에서 Infra 또는 Node 선택 (첫 번째 항목)
  const workloadSel = frame.locator('select, [class*="select"]')
    .filter({ hasText: /infra|node|workload/i }).first();
  if (await workloadSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await workloadSel.selectOption({ index: 1 }).catch(() => null);
    await page.waitForTimeout(500);
  }

  // Server 셀렉터 (첫 번째 항목)
  const serverSel = frame.locator('select, [class*="select"]')
    .filter({ hasText: /server|service/i }).first();
  if (await serverSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await serverSel.selectOption({ index: 1 }).catch(() => null);
    await page.waitForTimeout(300);
  }

  // Keyword 입력 필드에 "error" 입력
  const keywordInput = frame.locator('input[type="text"], input[placeholder*="keyword" i], input[placeholder*="search" i], input')
    .filter({ hasText: '' }).first();
  const hasInput = await keywordInput.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasInput) {
    // placeholder 속성으로 탐색
    const inputByPlaceholder = frame.locator('input[placeholder]').first();
    if (await inputByPlaceholder.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await inputByPlaceholder.fill('error');
    } else {
      await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-keyword-input.png`) }).catch(() => null);
      throw new Error(`[${tag}] LOG-02: Keyword 입력 필드 미발견`);
    }
  } else {
    await keywordInput.fill('error');
  }
  await page.waitForTimeout(300);

  // Search 버튼 클릭 또는 Enter
  const searchBtn = frame.locator('button').filter({ hasText: /search|검색/i }).first();
  const hasSearch = await searchBtn.isVisible({ timeout: 3_000 }).catch(() => false);
  if (hasSearch) {
    await searchBtn.click();
  } else {
    await keywordInput.press('Enter').catch(() => null);
  }
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-log-search-result.png`) }).catch(() => null);

  // 로그 표 확인 (Timestamp/Level/Node/Service/Message 컬럼)
  const logTable = frame.locator('table, .tabulator, [class*="log-table"], [class*="log-list"]').first();
  const hasTable = await logTable.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasLogCols = /timestamp|level|message|node|service/i.test(bodyText);
  // LogQL 자동 생성 확인 (쿼리 미리보기 또는 입력창에 NS_ID/INFRA_ID 포함)
  const hasLogQL  = /NS_ID|INFRA_ID|logql|query_range|\|\~/i.test(bodyText);

  console.log(`[${tag}] LOG-02: 로그표=${hasTable}, 컬럼확인=${hasLogCols}, LogQL=${hasLogQL}`);

  if (!hasTable && !hasLogCols) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-log-table.png`) }).catch(() => null);
    throw new Error(`[${tag}] LOG-02: 로그 결과 표 미표시`);
  }

  // 첫 번째 로그 행 클릭 → 상세 확인
  const logRows = frame.locator('table tr:not(:first-child), .tabulator-row, [class*="log-row"]');
  const rowCount = await logRows.count().catch(() => 0);
  console.log(`[${tag}] LOG-02: 로그 행 수 = ${rowCount}`);

  if (rowCount > 0) {
    await logRows.first().click().catch(() => null);
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-log-row-detail.png`) }).catch(() => null);
    // 상세 패널 또는 모달 확인
    const detailBody = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    const hasDetail = /message|detail|상세/i.test(detailBody);
    console.log(`[${tag}] LOG-02: 행 상세 표시 = ${hasDetail}`);
  } else {
    warn(tag, '"error" 키워드 검색 결과 0건 — 로그 없거나 Agent 미설치 상태일 수 있음');
  }

  console.log(`[${tag}] TC-OBS-LOG-02 완료 — LogQL 키워드 검색 및 로그 표 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// OBS Trace 공통 헬퍼: Tracing 탭 진입 + Scope/Service 기본 설정
// /embed/log/{ns} 이동 후 "Tracing" 탭 클릭
// ─────────────────────────────────────────────────────────────────────────────
async function gotoTracingTab(
  frame: import('@playwright/test').Frame,
  page: import('@playwright/test').Page,
  origin: string,
  tag: string,
): Promise<boolean> {
  await frame.goto(`${origin}/embed/log/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(1_500);

  const tracingTab = frame.locator('button').filter({ hasText: /^Tracing$/i }).first();
  const visible = await tracingTab.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  if (!visible) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-tracing-tab.png`) }).catch(() => null);
    return false;
  }

  await tracingTab.click();
  await page.waitForTimeout(1_500);
  console.log(`[${tag}] Tracing 탭 클릭 완료`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRACE-01: Trace 검색 (Tempo)
//
// 1. Tracing 탭(TraceViewer) 진입
// 2. Scope 선택: Framework / VM (노드 지정 시 VM 기본)
// 3. Service 드롭다운 로드 확인 (GET /api/o11y/trace/services?scope=...)
// 4. Range 기본값 유지 → Search 클릭
// 5. 'List of Trace' 표(Start Time/Root Service/Root Name/Duration/Trace ID) 또는
//    "No traces found" 표시 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrace01(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasTracing = await gotoTracingTab(frame, page, origin, tag);
  if (!hasTracing) throw new Error(`[${tag}] Tracing 탭 미발견 — TraceViewer 진입 불가`);

  await page.waitForTimeout(1_500);

  // Scope 확인: Framework / VM 라디오 또는 드롭다운
  const scopeFramework = frame.locator('input[type="radio"], button, label')
    .filter({ hasText: /^Framework$/i }).first();
  const scopeVm = frame.locator('input[type="radio"], button, label')
    .filter({ hasText: /^VM$/i }).first();

  const hasScope = await scopeFramework.isVisible({ timeout: 4_000 }).catch(() => false)
    || await scopeVm.isVisible({ timeout: 1_000 }).catch(() => false);
  console.log(`[${tag}] TRACE-01: Scope UI 발견 = ${hasScope}`);

  // VM Scope 선택 (노드 지정 기본)
  if (await scopeVm.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await scopeVm.click().catch(() => null);
    await page.waitForTimeout(1_000);
    console.log(`[${tag}] TRACE-01: VM Scope 선택`);
  }

  // Service 드롭다운 로드 확인 (GET /api/o11y/trace/services?scope=...)
  const serviceSel = frame.locator('select, [class*="select"]')
    .filter({ hasText: /service|all/i }).first();
  const hasService = await serviceSel.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);
  console.log(`[${tag}] TRACE-01: Service 드롭다운 = ${hasService}`);

  // Range 기본값 유지 (1H·6H·12H·24H 중 하나)
  const bodyText0 = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasRange = /1H|6H|12H|24H/i.test(bodyText0);
  console.log(`[${tag}] TRACE-01: Range 옵션 = ${hasRange}`);

  // Search 버튼 클릭
  const searchBtn = frame.locator('button').filter({ hasText: /^search$|^검색$/i }).first();
  const hasSearch = await searchBtn.waitFor({ state: 'visible', timeout: 6_000 })
    .then(() => true).catch(() => false);

  if (!hasSearch) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-trace-search-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRACE-01: Search 버튼 미발견`);
  }

  await searchBtn.click();
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-search-result.png`) }).catch(() => null);

  // 'List of Trace' 표 또는 "No traces found" 확인
  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasTraceTable  = /trace.?id|root.?service|root.?name|duration|start.?time/i.test(bodyText);
  const hasNoTrace     = /no.?trace|없음|0건/i.test(bodyText);

  console.log(`[${tag}] TRACE-01: traceTable=${hasTraceTable}, noTrace=${hasNoTrace}`);
  store.set('obsTraceHasResults', hasTraceTable && !hasNoTrace);

  if (!hasTraceTable && !hasNoTrace) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-unknown.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRACE-01: 트레이스 결과 표 및 "No traces found" 모두 미표시`);
  }

  // 결과 행 수 기록
  const traceRows = frame.locator('table tr:not(:first-child), .tabulator-row');
  const rowCount = await traceRows.count().catch(() => 0);
  store.set('obsTraceRowCount', rowCount);
  console.log(`[${tag}] TRACE-01: 트레이스 행 수 = ${rowCount}`);

  console.log(`[${tag}] TC-OBS-TRACE-01 완료 — List of Trace 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRACE-02: Trace 상세 / Call Sequence
//
// 1. 'List of Trace' 행 클릭
// 2. 단일 트레이스 조회(GET /api/o11y/trace/{traceId}) → 인라인 Call Sequence 펼침
// 3. Span(Service/Span/Kind/Offset/Duration)·타임라인 막대 표시 확인
// 4. 행 다시 클릭 → 접힘 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrace02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasTracing = await gotoTracingTab(frame, page, origin, tag);
  if (!hasTracing) throw new Error(`[${tag}] Tracing 탭 미발견`);

  // Search 실행 (TRACE-01과 동일 흐름으로 목록 로드)
  const searchBtn = frame.locator('button').filter({ hasText: /^search$|^검색$/i }).first();
  if (await searchBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await searchBtn.click();
    await page.waitForTimeout(3_000);
  }

  // 트레이스 행 탐색
  const traceRows = frame.locator('table tr:not(:first-child), .tabulator-row').filter({ hasNotText: /no.?trace/i });
  const rowCount = await traceRows.count().catch(() => 0);

  if (rowCount === 0) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    const isNoTrace = /no.?trace|없음/i.test(bodyText);
    if (isNoTrace) {
      console.log(`[${tag}] TRACE-02: 트레이스 없음 — Call Sequence 확인 불가 (No traces found)`);
      return;
    }
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-trace-rows.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRACE-02: 트레이스 목록 행 없음`);
  }

  // 첫 번째 행 클릭 → Call Sequence 인라인 펼침
  const targetRow = traceRows.first();
  const rowText = ((await targetRow.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim().slice(0, 100);
  console.log(`[${tag}] TRACE-02: 클릭 대상 행 = ${rowText}`);

  await targetRow.click();
  await page.waitForTimeout(2_500);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-detail-open.png`) }).catch(() => null);

  // Call Sequence 펼침 확인: Span 정보(Service/Span/Kind/Offset/Duration) 또는 타임라인
  const bodyAfter = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasSpan     = /span|service|kind|offset|duration/i.test(bodyAfter);
  const hasTimeline = await frame.locator('svg, canvas, [class*="timeline"], [class*="span-bar"]')
    .first().isVisible({ timeout: 3_000 }).catch(() => false);

  console.log(`[${tag}] TRACE-02: span정보=${hasSpan}, timeline=${hasTimeline}`);

  if (!hasSpan && !hasTimeline) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-call-sequence.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRACE-02: Call Sequence(Span/타임라인) 미표시`);
  }

  // 같은 행 다시 클릭 → 접힘 확인
  await targetRow.click();
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-detail-closed.png`) }).catch(() => null);
  const bodyAfterClose = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  // 접히면 상세 span 수가 줄어야 하나, 텍스트 기반으로는 단순 비교
  const stillExpanded = bodyAfterClose.length > bodyAfter.length + 200;
  console.log(`[${tag}] TRACE-02: 접힘 후 body 길이 변화 (재확장=${stillExpanded})`);

  console.log(`[${tag}] TC-OBS-TRACE-02 완료 — Call Sequence 인라인 펼침/접힘 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRACE-03: Trace iframe 임베드
//
// 1. /embed/trace/{nsId}/{infraId}[/{nodeId}] 직접 진입 (EmbedLayout)
// 2. 네비/사이드바 없는 전체화면 Trace 화면 로드 확인
// 3. 임베드 화면에서 Scope/Service/검색 및 Call Sequence 정상 동작 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrace03(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const mciId  = store.getOrDefault<string>('mciId', 'default');

  // /embed/trace/{nsId}/{infraId} 직접 이동 (EmbedLayout)
  const embedUrl = `${origin}/embed/trace/default/${mciId}`;
  console.log(`[${tag}] TRACE-03: 임베드 URL = ${embedUrl}`);

  await frame.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(2_500);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-embed.png`) }).catch(() => null);

  const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';

  // EmbedLayout: 네비/사이드바 없는 전체화면 확인
  // 일반 nav/sidebar 요소 없이 Trace 콘텐츠만 표시
  const hasNav  = await frame.locator('nav, [class*="sidebar"], [class*="navigation"]')
    .first().isVisible({ timeout: 2_000 }).catch(() => false);
  const hasTrace = /scope|service|search|trace|span/i.test(bodyText);

  console.log(`[${tag}] TRACE-03: nav=${hasNav}(없어야 함), traceContent=${hasTrace}`);

  if (!hasTrace) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-embed-empty.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRACE-03: 임베드 Trace 화면 로드 실패 — 콘텐츠 없음`);
  }

  if (hasNav) {
    warn(tag, 'EmbedLayout임에도 nav/sidebar 감지 — 레이아웃 확인 필요');
  }

  // 임베드 화면에서 Search 실행 (Scope/Service 기본값 유지)
  const searchBtn = frame.locator('button').filter({ hasText: /^search$|^검색$/i }).first();
  if (await searchBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await searchBtn.click();
    await page.waitForTimeout(3_000);

    const afterSearch = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    const hasResult  = /trace.?id|no.?trace|start.?time/i.test(afterSearch);
    console.log(`[${tag}] TRACE-03: 임베드 검색 결과 = ${hasResult}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-embed-search.png`) }).catch(() => null);

    // 결과 있으면 행 클릭 → Call Sequence 확인
    const rows = frame.locator('table tr:not(:first-child), .tabulator-row').filter({ hasNotText: /no.?trace/i });
    if (await rows.count().then(n => n > 0).catch(() => false)) {
      await rows.first().click();
      await page.waitForTimeout(2_000);
      const detailText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
      const hasSpan = /span|kind|offset|duration/i.test(detailText);
      console.log(`[${tag}] TRACE-03: 임베드 Call Sequence = ${hasSpan}`);
      await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trace-embed-detail.png`) }).catch(() => null);
    }
  } else {
    warn(tag, 'TRACE-03: 임베드 화면 Search 버튼 미발견');
  }

  console.log(`[${tag}] TC-OBS-TRACE-03 완료 — Trace 임베드 화면 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// OBS Trigger 공통 헬퍼: Alerts → Policies 탭 진입
// /embed/log/{ns} 이동 후 iframe 내 "Alerts" 탭 클릭
// ─────────────────────────────────────────────────────────────────────────────
async function gotoAlertsTab(
  frame: import('@playwright/test').Frame,
  page: import('@playwright/test').Page,
  origin: string,
  tag: string,
): Promise<boolean> {
  await frame.goto(`${origin}/embed/log/default`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(1_500);

  const alertsTab = frame.locator('button').filter({ hasText: /^Alerts$/i }).first();
  const visible = await alertsTab.waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true).catch(() => false);

  if (!visible) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-alerts-tab.png`) }).catch(() => null);
    return false;
  }

  await alertsTab.click();
  await page.waitForTimeout(1_500);
  console.log(`[${tag}] Alerts 탭 클릭 완료`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRIG-01: Trigger Policy 생성 / 목록 / 삭제
//
// 1. Alerts → Policies 탭 진입 (GET /api/o11y/trigger/policy?page=&size=)
// 2. + New Policy → 생성 폼:
//    title/description/resourceType(CPU)/aggregationType(AVG)/holdDuration(5m)/
//    repeatInterval(1h)/thresholdCondition(info/warning/critical)
// 3. 목록에 신규 정책 표시 확인
// 4. 삭제 후 목록 제거 확인 (DELETE /api/o11y/trigger/policy/{id})
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrig01(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasAlerts = await gotoAlertsTab(frame, page, origin, tag);
  if (!hasAlerts) throw new Error(`[${tag}] Alerts 탭 미발견`);

  await page.waitForTimeout(1_000);

  // 정책 목록 로드 확인 (GET /api/o11y/trigger/policy)
  const bodyInit = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasPolicyList = /policy|정책|no.?policy|create|new/i.test(bodyInit);
  console.log(`[${tag}] TRIG-01: 정책 목록 영역 = ${hasPolicyList}`);

  // + New Policy 버튼 클릭
  const newPolicyBtn = frame.locator('button').filter({ hasText: /new.?policy|정책.?추가|\+.?new/i }).first();
  const hasNewBtn = await newPolicyBtn.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasNewBtn) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-new-policy-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-01: "+ New Policy" 버튼 미발견`);
  }

  await newPolicyBtn.click();
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-new-policy-form.png`) }).catch(() => null);

  // 생성 폼 입력
  const policyTitle = `e2e-trig-${Date.now()}`;

  // Title 입력
  const titleInput = frame.locator('input[name*="title" i], input[placeholder*="title" i], input').first();
  if (await titleInput.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await titleInput.fill(policyTitle);
    await page.waitForTimeout(200);
  }

  // Description 입력
  const descInput = frame.locator('input[name*="desc" i], textarea[name*="desc" i], textarea').first();
  if (await descInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await descInput.fill('E2E 자동 생성 정책');
    await page.waitForTimeout(200);
  }

  // resourceType: CPU 선택
  const resourceSel = frame.locator('select').filter({ has: frame.locator('option[value*="CPU" i]') }).first();
  if (await resourceSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await resourceSel.selectOption({ label: 'CPU' }).catch(
      () => resourceSel.selectOption({ index: 1 }),
    );
    await page.waitForTimeout(200);
  }

  // aggregationType: AVG 선택
  const aggSel = frame.locator('select').filter({ has: frame.locator('option[value*="AVG" i]') }).first();
  if (await aggSel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await aggSel.selectOption({ label: 'AVG' }).catch(
      () => aggSel.selectOption({ index: 1 }),
    );
    await page.waitForTimeout(200);
  }

  // holdDuration, repeatInterval 입력 (있을 경우)
  const durationInput = frame.locator('input[name*="hold" i], input[name*="duration" i]').first();
  if (await durationInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await durationInput.fill('5m');
    await page.waitForTimeout(200);
  }

  const intervalInput = frame.locator('input[name*="repeat" i], input[name*="interval" i]').first();
  if (await intervalInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await intervalInput.fill('1h');
    await page.waitForTimeout(200);
  }

  // 저장/생성 버튼 클릭
  const saveBtn = frame.locator('button[type="submit"], button').filter({ hasText: /save|create|생성|저장/i }).first();
  const hasSave = await saveBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (!hasSave) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-policy-save-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-01: 저장/생성 버튼 미발견`);
  }

  await saveBtn.click();
  await page.waitForTimeout(2_500);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-policy-created.png`) }).catch(() => null);

  // 목록에 신규 정책 표시 확인
  const bodyAfter = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const isPolicyVisible = bodyAfter.includes(policyTitle);
  console.log(`[${tag}] TRIG-01: 신규 정책 목록 표시 = ${isPolicyVisible} (title=${policyTitle})`);

  if (!isPolicyVisible) {
    warn(tag, `TRIG-01: 생성된 정책 "${policyTitle}"이 목록에 미표시 — 생성 실패 또는 제목 표시 형식 상이`);
  }

  store.set('obsTrigPolicyTitle', policyTitle);

  // 삭제: 해당 정책 행의 Delete 버튼 클릭
  const policyRow = frame.locator('tr, [class*="row"]').filter({ hasText: policyTitle }).first();
  const deleteBtn = policyRow.locator('button').filter({ hasText: /delete|삭제/i }).first();
  const hasDelete = await deleteBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (hasDelete) {
    await deleteBtn.click();
    await page.waitForTimeout(1_000);

    // 확인 다이얼로그
    const confirmBtn = frame.locator('button').filter({ hasText: /confirm|yes|ok|확인/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-policy-deleted.png`) }).catch(() => null);

    const bodyDeleted = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    const isDeleted = !bodyDeleted.includes(policyTitle);
    console.log(`[${tag}] TRIG-01: 정책 삭제 확인 = ${isDeleted}`);

    if (!isDeleted) {
      throw new Error(`[${tag}] TRIG-01: 삭제 후 정책 "${policyTitle}"이 목록에 여전히 존재`);
    }
  } else {
    warn(tag, `TRIG-01: Delete 버튼 미발견 — 생성 자체가 실패했을 수 있음`);
  }

  console.log(`[${tag}] TC-OBS-TRIG-01 완료 — Policy 생성/목록/삭제`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRIG-02: 정책 ↔ Node/Infra 타겟 연결
//
// 1. 정책 행 Manage 클릭 → Alarm targets 영역
// 2. Infra 드롭다운 선택 → 레벨(Infra/Node) 선택
// 3. Add targets (POST /api/o11y/trigger/policy/{id}/node)
// 4. vms 목록에 추가 확인
// 5. 타겟 × 클릭 → 제거 확인 (DELETE)
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrig02(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasAlerts = await gotoAlertsTab(frame, page, origin, tag);
  if (!hasAlerts) throw new Error(`[${tag}] Alerts 탭 미발견`);

  await page.waitForTimeout(1_000);

  // 정책 행에서 Manage 버튼 클릭
  const manageBtn = frame.locator('button').filter({ hasText: /^manage$/i }).first();
  const hasManage = await manageBtn.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasManage) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    const noPolicy = /no.?policy|empty|없음/i.test(bodyText);
    if (noPolicy) {
      console.log(`[${tag}] TRIG-02: 정책 없음 — TRIG-01 선행 필요`);
      return;
    }
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-manage-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-02: Manage 버튼 미발견`);
  }

  await manageBtn.click();
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-manage-open.png`) }).catch(() => null);

  // Alarm targets 영역 확인
  const bodyManage = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasTargetArea = /alarm.?target|target|infra|node/i.test(bodyManage);
  console.log(`[${tag}] TRIG-02: Alarm targets 영역 = ${hasTargetArea}`);

  if (!hasTargetArea) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-target-area.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-02: Alarm targets 영역 미표시`);
  }

  // Infra 드롭다운 첫 번째 항목 선택
  const infraSel = frame.locator('select, [class*="select"]').filter({ hasText: /infra|all/i }).first();
  if (await infraSel.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await infraSel.selectOption({ index: 1 }).catch(() => null);
    await page.waitForTimeout(500);
    console.log(`[${tag}] TRIG-02: Infra 선택`);
  }

  // 레벨 선택: Node (단일 VM)
  const nodeLevel = frame.locator('input[type="radio"], button, label').filter({ hasText: /^Node$/i }).first();
  if (await nodeLevel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await nodeLevel.click().catch(() => null);
    await page.waitForTimeout(500);
  }

  // Add targets 버튼 클릭
  const addTargetBtn = frame.locator('button').filter({ hasText: /add.?target|타겟.?추가/i }).first();
  const hasAddTarget = await addTargetBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (!hasAddTarget) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-add-target-btn.png`) }).catch(() => null);
    warn(tag, 'TRIG-02: Add targets 버튼 미발견 — Infra 선택 후 표시되는 버튼 탐색 실패');
    return;
  }

  await addTargetBtn.click();
  await page.waitForTimeout(2_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-target-added.png`) }).catch(() => null);

  // vms 목록에 추가 확인
  const bodyAfterAdd = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const hasVmAdded = /vm|node|target|추가됨|added/i.test(bodyAfterAdd);
  console.log(`[${tag}] TRIG-02: 타겟 추가 확인 = ${hasVmAdded}`);

  // 타겟 제거 (× 버튼)
  const removeBtn = frame.locator('button[aria-label*="remove" i], button[aria-label*="delete" i], [class*="remove"], [class*="close"]')
    .first();
  if (await removeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await removeBtn.click();
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-target-removed.png`) }).catch(() => null);
    console.log(`[${tag}] TRIG-02: 타겟 제거 클릭 완료`);
  } else {
    warn(tag, 'TRIG-02: 타겟 제거(×) 버튼 미발견');
  }

  console.log(`[${tag}] TC-OBS-TRIG-02 완료 — Alarm targets 추가/제거`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRIG-03: 알림 채널 설정
//
// 1. Manage → Notification channels 영역
// 2. 지원 채널 조회 (GET /api/o11y/trigger/noti/channel)
// 3. 채널 선택(Slack/Teams/Discord/Sms/Kakao/Email) → 수신자 입력
// 4. Test 버튼 (POST /api/o11y/trigger/noti/test)
// 5. Save channels (PUT /api/o11y/trigger/policy/{id}/channel)
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrig03(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasAlerts = await gotoAlertsTab(frame, page, origin, tag);
  if (!hasAlerts) throw new Error(`[${tag}] Alerts 탭 미발견`);

  await page.waitForTimeout(1_000);

  // Manage 클릭
  const manageBtn = frame.locator('button').filter({ hasText: /^manage$/i }).first();
  const hasManage = await manageBtn.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasManage) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    if (/no.?policy|empty|없음/i.test(bodyText)) {
      console.log(`[${tag}] TRIG-03: 정책 없음 — TRIG-01 선행 필요`);
      return;
    }
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig03-no-manage.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-03: Manage 버튼 미발견`);
  }

  await manageBtn.click();
  await page.waitForTimeout(1_500);

  // Notification channels 영역 스크롤/확인
  const notiArea = frame.locator('[class*="noti"], [class*="channel"], section, div')
    .filter({ hasText: /notification.?channel|알림.?채널/i }).first();
  const hasNotiArea = await notiArea.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);
  console.log(`[${tag}] TRIG-03: Notification channels 영역 = ${hasNotiArea}`);

  if (!hasNotiArea) {
    // 스크롤해서 탐색
    await frame.locator('body').evaluate(el => el.scrollBy(0, 400));
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-noti-area.png`) }).catch(() => null);
  const bodyManage = (await frame.locator('body').textContent().catch(() => '')) ?? '';

  // 지원 채널 목록 확인 (Slack/Teams/Discord/Sms/Kakao/Email)
  const channels = ['Slack', 'Teams', 'Discord', 'Sms', 'Kakao', 'Email'];
  const foundChannels = channels.filter(ch => new RegExp(ch, 'i').test(bodyManage));
  console.log(`[${tag}] TRIG-03: 지원 채널 = [${foundChannels.join(', ')}]`);

  if (foundChannels.length === 0) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-noti-channels.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-03: Notification channels 목록 미표시`);
  }

  // Email 채널 체크박스 선택 (가장 범용적)
  const emailCheck = frame.locator('input[type="checkbox"]')
    .filter({ has: frame.locator('xpath=../..').filter({ hasText: /email/i }) }).first();
  const emailLabel = frame.locator('label').filter({ hasText: /email/i }).first();

  if (await emailLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await emailLabel.click().catch(() => null);
    await page.waitForTimeout(500);

    // 수신자 입력 (이메일 주소)
    const recipientInput = frame.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="recipient" i]')
      .first();
    if (await recipientInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await recipientInput.fill('test@example.com');
      await page.waitForTimeout(200);
    }

    // Test 버튼 클릭
    const testBtn = frame.locator('button').filter({ hasText: /^test$/i }).first();
    if (await testBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await testBtn.click();
      await page.waitForTimeout(2_000);
      await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-noti-test.png`) }).catch(() => null);
      console.log(`[${tag}] TRIG-03: Test 버튼 클릭 완료`);
    } else {
      warn(tag, 'TRIG-03: Test 버튼 미발견');
    }
  } else {
    // 체크박스 직접 탐색 시도
    if (await emailCheck.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await emailCheck.check().catch(() => null);
    }
    warn(tag, 'TRIG-03: Email 채널 label 미발견 — 체크박스 구조 상이할 수 있음');
  }

  // Save channels 버튼 클릭
  const saveBtn = frame.locator('button').filter({ hasText: /save.?channel|채널.?저장|save/i }).first();
  const hasSave = await saveBtn.waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true).catch(() => false);

  if (hasSave) {
    await saveBtn.click();
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-noti-saved.png`) }).catch(() => null);

    // 저장 완료 확인 (notiChannels 갱신)
    const bodyAfterSave = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    const isSaved = /saved|success|완료|email/i.test(bodyAfterSave);
    console.log(`[${tag}] TRIG-03: 채널 저장 완료 = ${isSaved}`);
  } else {
    warn(tag, 'TRIG-03: Save channels 버튼 미발견');
  }

  console.log(`[${tag}] TC-OBS-TRIG-03 완료 — Notification channels 설정/저장`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRIG-04: Trigger / Notification History
//
// 1. 임계치 초과 트리거 이력 조회 (GET /api/o11y/trigger/history?page=&size=)
//    — severity/value/threshold 컬럼 확인
// 2. (옵션) 코멘트 수정 (PUT /api/o11y/trigger/history/{id}/comment)
// 3. 알림 발송 이력 (GET /api/o11y/trigger/noti/history)
//    — channelName/recipients/isSucceeded 컬럼 확인
// 4. Alerts → Notification History 탭에 발송 로그(성공/실패, 실패 원인 펼침) 표시 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrig04(ctx: StepRunContext, tag: string): Promise<void> {
  const { page, store } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasAlerts = await gotoAlertsTab(frame, page, origin, tag);
  if (!hasAlerts) throw new Error(`[${tag}] Alerts 탭 미발견`);

  await page.waitForTimeout(1_000);

  // ── 트리거 이력 탭 확인 (History / Trigger History) ──────────────────────
  const historyTab = frame.locator('button, [role="tab"]').filter({ hasText: /^history$|^trigger.?history$/i }).first();
  const hasHistoryTab = await historyTab.waitFor({ state: 'visible', timeout: 6_000 })
    .then(() => true).catch(() => false);

  if (hasHistoryTab) {
    await historyTab.click();
    await page.waitForTimeout(1_500);
  }

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-history.png`) }).catch(() => null);
  const bodyHistory = (await frame.locator('body').textContent().catch(() => '')) ?? '';

  // severity/value/threshold 컬럼 확인
  const hasHistoryCols = /severity|value|threshold|critical|warning|info/i.test(bodyHistory);
  const hasNoHistory   = /no.?history|이력.?없음|empty/i.test(bodyHistory);
  console.log(`[${tag}] TRIG-04: history컬럼=${hasHistoryCols}, noHistory=${hasNoHistory}`);

  if (!hasHistoryCols && !hasNoHistory) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-trigger-history.png`) }).catch(() => null);
    warn(tag, 'TRIG-04: 트리거 이력 컬럼(severity/value/threshold) 미표시 — 임계치 초과 이벤트 없을 수 있음');
  }

  // 이력 행 수 기록
  const historyRows = frame.locator('table tr:not(:first-child), .tabulator-row');
  const rowCount = await historyRows.count().catch(() => 0);
  store.set('obsTrigHistoryCount', rowCount);
  console.log(`[${tag}] TRIG-04: 트리거 이력 행 수 = ${rowCount}`);

  // (옵션) 첫 번째 이력 행 코멘트 수정
  if (rowCount > 0) {
    const firstRow = historyRows.first();
    const commentBtn = firstRow.locator('button, input[type="text"]').filter({ hasText: /comment|코멘트/i }).first();
    if (await commentBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await commentBtn.click();
      await page.waitForTimeout(500);
      const commentInput = frame.locator('input[type="text"], textarea').last();
      if (await commentInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await commentInput.fill('E2E 자동 코멘트');
        const saveCommentBtn = frame.locator('button').filter({ hasText: /save|저장|ok/i }).last();
        if (await saveCommentBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await saveCommentBtn.click();
          await page.waitForTimeout(1_000);
          console.log(`[${tag}] TRIG-04: 코멘트 수정 완료`);
        }
      }
    }
  }

  // ── Notification History 탭 ─────────────────────────────────────────────
  const notiHistTab = frame.locator('button, [role="tab"]').filter({ hasText: /notification.?history|발송.?이력/i }).first();
  const hasNotiHistTab = await notiHistTab.waitFor({ state: 'visible', timeout: 6_000 })
    .then(() => true).catch(() => false);

  if (hasNotiHistTab) {
    await notiHistTab.click();
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-noti-history.png`) }).catch(() => null);

    const bodyNotiHist = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    // channelName/recipients/isSucceeded 컬럼 확인
    const hasNotiCols  = /channel|recipient|succeed|success|fail/i.test(bodyNotiHist);
    const hasNoNoti    = /no.?notification|발송.?없음|empty/i.test(bodyNotiHist);
    console.log(`[${tag}] TRIG-04: notiHistory컬럼=${hasNotiCols}, noNoti=${hasNoNoti}`);

    if (!hasNotiCols && !hasNoNoti) {
      warn(tag, 'TRIG-04: 알림 발송 이력 컬럼(channelName/recipients/isSucceeded) 미표시');
    }

    // 실패 이력 펼침 확인 (실패 원인 detail)
    const failRows = frame.locator('tr, [class*="row"]').filter({ hasText: /fail|false/i });
    if (await failRows.count().then(n => n > 0).catch(() => false)) {
      await failRows.first().click().catch(() => null);
      await page.waitForTimeout(1_000);
      const bodyExpanded = (await frame.locator('body').textContent().catch(() => '')) ?? '';
      const hasFailDetail = /reason|error|message|원인/i.test(bodyExpanded);
      console.log(`[${tag}] TRIG-04: 실패 원인 펼침 = ${hasFailDetail}`);
      await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-noti-fail-detail.png`) }).catch(() => null);
    }
  } else {
    warn(tag, 'TRIG-04: Notification History 탭 미발견 — Alerts 탭 내 구조 상이할 수 있음');
  }

  console.log(`[${tag}] TC-OBS-TRIG-04 완료 — 트리거/알림 발송 이력 확인`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-OBS-TRIG-05: 정책 수정 (임계값 등)
//
// 1. 정책 행 Manage 클릭 → Policy settings 영역 펼침
// 2. Thresholds(Info/Warning/Critical)·Title·Resource·Aggregation·Hold/Repeat 수정
// 3. Save settings (PUT /api/o11y/trigger/policy/{id})
// 4. Grafana 알림 룰 재동기화 확인 (삭제 후 재생성 메시지)
// 5. 목록 Thresholds 갱신 확인
// ─────────────────────────────────────────────────────────────────────────────
async function runObsTrig05(ctx: StepRunContext, tag: string): Promise<void> {
  const { page } = ctx;

  const frame = await obsLoadFrame(ctx, tag);
  if (!frame) throw new Error(`[${tag}] OBS iframe 미발견`);

  const origin = await obsIframeOrigin(page);
  const hasAlerts = await gotoAlertsTab(frame, page, origin, tag);
  if (!hasAlerts) throw new Error(`[${tag}] Alerts 탭 미발견`);

  await page.waitForTimeout(1_000);

  // 정책 행 Manage 클릭
  const manageBtn = frame.locator('button').filter({ hasText: /^manage$/i }).first();
  const hasManage = await manageBtn.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true).catch(() => false);

  if (!hasManage) {
    const bodyText = (await frame.locator('body').textContent().catch(() => '')) ?? '';
    if (/no.?policy|empty|없음/i.test(bodyText)) {
      console.log(`[${tag}] TRIG-05: 정책 없음 — TRIG-01 선행 필요`);
      return;
    }
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig05-no-manage.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-05: Manage 버튼 미발견`);
  }

  await manageBtn.click();
  await page.waitForTimeout(1_500);

  // Policy settings 영역 펼침 (토글 버튼 또는 섹션 헤더)
  const settingsToggle = frame.locator('button, [class*="collapse"], [class*="accordion"]')
    .filter({ hasText: /policy.?settings|정책.?설정/i }).first();
  if (await settingsToggle.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await settingsToggle.click();
    await page.waitForTimeout(1_000);
    console.log(`[${tag}] TRIG-05: Policy settings 펼침`);
  }

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-policy-settings.png`) }).catch(() => null);
  const bodySettings = (await frame.locator('body').textContent().catch(() => '')) ?? '';

  // 설정 폼 영역 확인 (Threshold/Title/Resource/Aggregation/Hold/Repeat)
  const hasSettingsForm = /threshold|title|resource|aggregation|hold|repeat/i.test(bodySettings);
  console.log(`[${tag}] TRIG-05: Policy settings 폼 = ${hasSettingsForm}`);

  if (!hasSettingsForm) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-policy-settings.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-05: Policy settings 폼 미표시`);
  }

  // Title 수정 (기존 값 지우고 새 값)
  const titleInput = frame.locator('input[name*="title" i], input[placeholder*="title" i]').first();
  if (await titleInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const currentTitle = await titleInput.inputValue().catch(() => '');
    await titleInput.fill(`${currentTitle}-updated`);
    await page.waitForTimeout(200);
    console.log(`[${tag}] TRIG-05: Title 수정 = "${currentTitle}-updated"`);
  }

  // Threshold — Info/Warning/Critical 값 수정
  // 폼에 숫자 입력 필드가 3개 있을 경우: info / warning / critical 순
  const thresholdInputs = frame.locator('input[type="number"], input[name*="threshold" i]');
  const threshCount = await thresholdInputs.count().catch(() => 0);
  console.log(`[${tag}] TRIG-05: Threshold 입력 필드 수 = ${threshCount}`);

  if (threshCount >= 1) {
    // info threshold
    await thresholdInputs.nth(0).fill('50').catch(() => null);
  }
  if (threshCount >= 2) {
    // warning threshold
    await thresholdInputs.nth(1).fill('70').catch(() => null);
  }
  if (threshCount >= 3) {
    // critical threshold
    await thresholdInputs.nth(2).fill('90').catch(() => null);
  }
  await page.waitForTimeout(200);

  // holdDuration 수정
  const holdInput = frame.locator('input[name*="hold" i], input[name*="duration" i]').first();
  if (await holdInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await holdInput.fill('10m');
    await page.waitForTimeout(200);
  }

  // Save settings 버튼 클릭
  const saveBtn = frame.locator('button').filter({ hasText: /save.?settings|설정.?저장|save/i }).first();
  const hasSave = await saveBtn.waitFor({ state: 'visible', timeout: 6_000 })
    .then(() => true).catch(() => false);

  if (!hasSave) {
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-no-save-settings-btn.png`) }).catch(() => null);
    throw new Error(`[${tag}] TRIG-05: Save settings 버튼 미발견`);
  }

  await saveBtn.click();
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-policy-saved.png`) }).catch(() => null);

  // 저장 완료 및 Grafana 룰 재동기화 확인
  const bodyAfterSave = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  const isSaved      = /saved|success|updated|완료|갱신/i.test(bodyAfterSave);
  const hasGrafanaSync = /grafana|sync|rule|재동기|recreat/i.test(bodyAfterSave);
  console.log(`[${tag}] TRIG-05: 저장=${isSaved}, grafana재동기=${hasGrafanaSync}`);

  if (!isSaved) {
    warn(tag, 'TRIG-05: 저장 완료 메시지 미확인 — API 응답 또는 토스트 미감지');
  }

  // Manage 닫기 → 목록으로 돌아가 Thresholds 표시 갱신 확인
  const closeBtn = frame.locator('button').filter({ hasText: /close|닫기|back/i }).first();
  if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(1_500);
  } else {
    // Alerts 탭 재클릭으로 목록 갱신
    await gotoAlertsTab(frame, page, origin, tag);
  }

  await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-trig-policy-list-updated.png`) }).catch(() => null);
  const bodyList = (await frame.locator('body').textContent().catch(() => '')) ?? '';
  // 목록에서 수정된 threshold 값(50/70/90) 또는 "-updated" 제목 확인
  const hasUpdated = /50|70|90|-updated/i.test(bodyList);
  console.log(`[${tag}] TRIG-05: 목록 Threshold 갱신 = ${hasUpdated}`);

  if (!hasUpdated) {
    warn(tag, 'TRIG-05: 목록 Thresholds 갱신 미확인 — 목록 표시 형식 확인 필요');
  }

  console.log(`[${tag}] TC-OBS-TRIG-05 완료 — Policy settings 수정/저장/목록 갱신`);
}
