/**
 * deploy/tc/data/TC-DATA-OBJ-BAK-01.spec.ts
 * TC-DATA-OBJ-BAK-01: Object Storage 백업/복원 — 브라우저 UI 테스트
 */
import { test, expect } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';

const TC_ID = 'TC-DATA-OBJ-BAK-01';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-OBJ-BAK-01: Object Storage 백업/복원', () => {
  test('UI: 화면 진입 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.objectStorage, TC_ID);
    if (!ok) return;
    expect(page.url()).toMatch(/\/webconsole\//);
    console.log(`[${TC_ID}] UI OK: ${page.url()}`);
  });
});
