/**
 * deploy/tc/sw/TC-APP-DEP-02.spec.ts
 * TC-APP-DEP-02: VM 다중 배포 (Clustering)
 *
 * status: wip — 구현 필요 (ISSUE-014)
 */
import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-APP-DEP-02: VM 다중 배포 (Clustering)', () => {
  test('TC-APP-DEP-02: VM 다중 배포 (Clustering)', async () => {
    throw new Error('[TC-APP-DEP-02] 미구현 (ISSUE-014) — 구현 후 이 throw를 제거하고 실제 테스트 코드를 작성');
  });
});
