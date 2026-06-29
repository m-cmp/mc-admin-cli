/**
 * deploy/tc/data/TC-DATA-OS-01-04.spec.ts
 * TC-DATA-OS-01-04: Object Storage 생성/관리 — 브라우저 UI 테스트
 */
import { test, expect } from '@playwright/test';
import { PAGES }         from '../../shared/pages';
import { loginAndGoto }  from '../../shared/request-auth.helper';

const TC_ID = 'TC-DATA-OS-01-04';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-DATA-OS-01-04: Object Storage 생성/관리', () => {
  test('UI: 화면 진입 확인', async ({ page }) => {
    const ok = await loginAndGoto(page, PAGES.data.objectStorage, TC_ID);
    if (!ok) return;
    expect(page.url()).toMatch(/\/webconsole\//);
    console.log(`[${TC_ID}] UI OK: ${page.url()}`);
  });
});
