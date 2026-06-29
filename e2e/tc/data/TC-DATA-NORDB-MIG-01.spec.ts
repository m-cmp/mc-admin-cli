/**
 * deploy/tc/data/TC-DATA-NORDB-MIG-01.spec.ts
 * TC-DATA-NORDB-MIG-01: NoRDBMS 마이그레이션 — 브라우저 UI 테스트
 */
import { test, expect } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';

const TC_ID = 'TC-DATA-NORDB-MIG-01';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-NORDB-MIG-01: NoRDBMS 마이그레이션', () => {
  test('UI: 화면 진입 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.nordbms, TC_ID);
    if (!ok) return;
    expect(page.url()).toMatch(/\/webconsole\//);
    console.log(`[${TC_ID}] UI OK: ${page.url()}`);
  });
});
