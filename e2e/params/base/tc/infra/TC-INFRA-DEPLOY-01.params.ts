/**
 * deploy/params/base/tc/infra/TC-INFRA-DEPLOY-01.params.ts
 * TC-INFRA-DEPLOY-01: MCI 목록 조회
 * TC-INFRA-DEPLOY-02: MCI 상세 조회  (같은 파일 공유 — nsId 필요)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId: 'default',
  },
} satisfies TCParams;
