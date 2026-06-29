/**
 * deploy/tc/sw/TC-APP-REP-01.spec.ts
 * TC-APP-REP-01: Repository 목록 조회
 *
 * status: wip — 구현 필요 (ISSUE-013)
 */
import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-APP-REP-01: Repository 목록 조회', () => {
  test('TC-APP-REP-01: Repository 목록 조회', async () => {
    throw new Error('[TC-APP-REP-01] 미구현 (ISSUE-013) — 구현 후 이 throw를 제거하고 실제 테스트 코드를 작성');
  });
});
