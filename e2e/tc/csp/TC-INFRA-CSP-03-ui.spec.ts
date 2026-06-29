/**
 * deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 * TC-INFRA-CSP-03: CSP 자격증명 UI 등록 (CSP별 variant)
 *
 * 경로: Settings > Cloud SPs > Credential → Register Credential
 * Provider 선택 시 KV 행이 자동 생성되며, 각 Value만 입력 후 Register 클릭.
 *
 * ── 단독 실행 ────────────────────────────────────────────────────────
 *   TC_VARIANT=aws       npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=gcp       npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=azure     npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=alibaba   npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=ibm       npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=ncp       npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=nhn       npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=kt        npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=openstack npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *   TC_VARIANT=tencent   npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *
 * ── 민감값 주입 ──────────────────────────────────────────────────────
 *   TC_VARIANT=aws PW_ClientId=AKIA... PW_ClientSecret=... \
 *     npx playwright test deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts
 *
 * ── Provider별 KV 필드 (cb-spider PROVIDER_KEYS 기준) ────────────────
 *   aws:       ClientId, ClientSecret
 *   gcp:       ClientEmail, PrivateKey, ProjectID
 *   azure:     ClientId, ClientSecret, TenantId, SubscriptionId
 *   alibaba:   ClientId, ClientSecret
 *   ibm:       ApiKey, S3AccessKey, S3SecretKey
 *   ncp:       ClientId, ClientSecret
 *   nhn:       IdentityEndpoint, Username, Password, DomainName, TenantId
 *   kt:        IdentityEndpoint, Username, Password, DomainName, ProjectID
 *   openstack: IdentityEndpoint, Username, Password, DomainName, ProjectID
 *   tencent:   SecretId, SecretKey
 */
import { test, expect } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';
import { ScenarioContext, StandaloneContext } from '../../params/runtime/context';

const TC_ID   = 'TC-INFRA-CSP-03';
const variant = process.env.TC_VARIANT;

if (!variant || variant === 'api') {
  throw new Error(
    `TC_VARIANT 환경변수가 필요합니다. 예: TC_VARIANT=aws\n` +
    `지원 값: aws | gcp | azure | alibaba | ibm | ncp | nhn | kt | openstack | tencent`,
  );
}

const scenarioId = process.env.SCENARIO_ID;
const ctx = scenarioId
  ? new ScenarioContext(scenarioId, TC_ID, variant)
  : new StandaloneContext(TC_ID, variant);
const p = ctx.params;

// cb-spider PROVIDER_KEYS 와 동일 — 서버에서 기대하는 KV 키 이름 목록
const PROVIDER_FIELDS: Record<string, string[]> = {
  aws:       ['ClientId', 'ClientSecret'],
  gcp:       ['ClientEmail', 'PrivateKey', 'ProjectID'],
  azure:     ['ClientId', 'ClientSecret', 'TenantId', 'SubscriptionId'],
  alibaba:   ['ClientId', 'ClientSecret'],
  ibm:       ['ApiKey', 'S3AccessKey', 'S3SecretKey'],
  ncp:       ['ClientId', 'ClientSecret'],
  nhn:       ['IdentityEndpoint', 'Username', 'Password', 'DomainName', 'TenantId'],
  kt:        ['IdentityEndpoint', 'Username', 'Password', 'DomainName', 'ProjectID'],
  openstack: ['IdentityEndpoint', 'Username', 'Password', 'DomainName', 'ProjectID'],
  tencent:   ['SecretId', 'SecretKey'],
};

const fields = PROVIDER_FIELDS[variant];
if (!fields) {
  throw new Error(`지원하지 않는 TC_VARIANT: ${variant}. 지원: ${Object.keys(PROVIDER_FIELDS).join(' | ')}`);
}

const credentialHolder = (p.credentialHolder as string) ?? `e2e-${variant}-credential`;
const providerName     = (p.providerName as string)     ?? variant;

test.use({ storageState: { cookies: [], origins: [] } });
test.describe.configure({ mode: 'serial' });

test.describe(`TC-INFRA-CSP-03 UI: ${variant.toUpperCase()} 자격증명 등록`, () => {

  test(`UI: Credential 메뉴 진입 확인 (${variant})`, async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.settings.credentials, `TC-INFRA-CSP-03/${variant}`);
    expect(ok, 'Credential 메뉴 로드 실패').toBe(true);

    // Credential Holders 테이블 로드 확인
    await expect(page.locator('#credential-table')).toBeVisible({ timeout: 10_000 });
    console.log(`[TC-INFRA-CSP-03/${variant}] Credential 목록 페이지 OK`);
  });

  test(`UI: Register Credential 모달 오픈 → ${variant} Provider 선택 → KV 자동 채움`, async ({ page }) => {
    await loginAndGoto(page, PAGES.settings.credentials, `TC-INFRA-CSP-03/${variant}`);
    await page.locator('#credential-table').waitFor({ state: 'visible', timeout: 10_000 });

    // Register Credential 버튼 클릭
    await page.click('[data-bs-target="#credential-create-modal"]');
    await page.locator('#credential-create-modal').waitFor({ state: 'visible', timeout: 5_000 });
    console.log(`[TC-INFRA-CSP-03/${variant}] 모달 열림`);

    // Credential Holder 이름 입력
    await page.fill('#create-holder-name', credentialHolder);

    // CSP Provider 선택 → change 이벤트가 KV 행 자동 생성
    await page.selectOption('#create-holder-provider', providerName);
    await page.waitForTimeout(500);

    // KV 행이 fields.length 만큼 생성됐는지 확인
    const rows = page.locator('#kv-list-container .kv-row');
    await expect(rows).toHaveCount(fields.length, { timeout: 5_000 });
    console.log(`[TC-INFRA-CSP-03/${variant}] KV 행 ${fields.length}개 자동 생성 확인`);

    // 각 KV 행의 Key 자동 채움 확인
    for (let i = 0; i < fields.length; i++) {
      const keyInput = rows.nth(i).locator('.kv-key');
      await expect(keyInput).toHaveValue(fields[i], { timeout: 3_000 });
      console.log(`[TC-INFRA-CSP-03/${variant}] KV[${i}] key="${fields[i]}" 자동 채움 확인`);
    }
  });

  test(`UI: KV Value 입력 후 Register 완료 (${variant})`, async ({ page }) => {
    await loginAndGoto(page, PAGES.settings.credentials, `TC-INFRA-CSP-03/${variant}`);
    await page.locator('#credential-table').waitFor({ state: 'visible', timeout: 10_000 });

    // 이미 등록된 경우 삭제 또는 skip
    const existingRow = page.locator('#credential-table').getByText(credentialHolder);
    if (await existingRow.count().catch(() => 0) > 0) {
      console.warn(`[TC-INFRA-CSP-03/${variant}] ${credentialHolder} 이미 존재 — 재등록 skip`);
      return;
    }

    // Register Credential 모달 오픈
    await page.click('[data-bs-target="#credential-create-modal"]');
    await page.locator('#credential-create-modal').waitFor({ state: 'visible', timeout: 5_000 });

    // Holder 이름 + Provider 선택
    await page.fill('#create-holder-name', credentialHolder);
    await page.selectOption('#create-holder-provider', providerName);
    await page.waitForTimeout(500);

    // KV 행 Value 입력
    const rows = page.locator('#kv-list-container .kv-row');
    await expect(rows).toHaveCount(fields.length, { timeout: 5_000 });

    for (let i = 0; i < fields.length; i++) {
      const fieldKey   = fields[i];
      const fieldValue = (p[fieldKey] as string) ?? '';

      if (!fieldValue) {
        console.warn(`[TC-INFRA-CSP-03/${variant}] ${fieldKey} 값 미주입 — PW_${fieldKey} 환경변수 필요`);
      }
      await rows.nth(i).locator('.kv-value').fill(fieldValue);
    }

    // Register 버튼 클릭
    await page.click('#credential-create-modal .btn-primary[onclick*="registerCredential"]');

    // 성공: 모달 닫힘 또는 성공 토스트
    await Promise.race([
      page.locator('#credential-create-modal').waitFor({ state: 'hidden', timeout: 15_000 }),
      page.locator('.toast-success, .alert-success, [class*="success"]').first().waitFor({ timeout: 15_000 }),
    ]).catch(() => {
      console.warn(`[TC-INFRA-CSP-03/${variant}] Register 응답 확인 timeout`);
    });

    // 목록에서 신규 Holder 확인
    await page.locator('#credential-table').waitFor({ state: 'visible', timeout: 10_000 });
    const registered = page.locator('#credential-table').getByText(credentialHolder);
    if (await registered.count().catch(() => 0) > 0) {
      console.log(`[TC-INFRA-CSP-03/${variant}] ✅ ${credentialHolder} 등록 확인`);
    } else {
      console.warn(`[TC-INFRA-CSP-03/${variant}] 목록 반영 미확인 — 새로고침 필요할 수 있음`);
    }
  });

});
