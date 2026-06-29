/**
 * deploy/tc/sw/TC-APP-CAT-04.spec.ts
 * TC-APP-CAT-04: 외부 검색 결과 업로드
 *
 * status: wip — 구현 필요 (ISSUE-012)
 */
import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC-APP-CAT-04: 외부 검색 결과 업로드', () => {
  test('TC-APP-CAT-04: 외부 검색 결과 업로드', async () => {
    throw new Error('[TC-APP-CAT-04] 미구현 (ISSUE-012) — 구현 후 이 throw를 제거하고 실제 테스트 코드를 작성');
  });
});
