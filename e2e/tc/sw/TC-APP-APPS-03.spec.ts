/**
 * deploy/tc/sw/TC-APP-APPS-03.spec.ts
 * TC-APP-APPS-03: 운영 액션 (Restart / Stop / Uninstall)
 *
 * status: wip — 구현 필요 (ISSUE-015)
 */
import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-APP-APPS-03: 운영 액션 (Restart / Stop / Uninstall)', () => {
  test('TC-APP-APPS-03: 운영 액션 (Restart / Stop / Uninstall)', async () => {
    throw new Error('[TC-APP-APPS-03] 미구현 (ISSUE-015) — 구현 후 이 throw를 제거하고 실제 테스트 코드를 작성');
  });
});
