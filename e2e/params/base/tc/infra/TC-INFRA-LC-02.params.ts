/**
 * deploy/params/base/tc/infra/TC-INFRA-LC-02.params.ts
 * TC-INFRA-LC-02: MCI 삭제
 *
 * variant 를 통해 어느 MCI를 삭제할지 지정한다.
 * mciId 가 비어있으면 runInfraLc02 는 런타임 store.mciId → MCI_ID 환경변수 순으로 폴백한다.
 *
 * 이름 체계: TC-INFRA-DEPLOY-05 생성 params와 항상 쌍으로 맞춤
 *   1라운드 mci1~7  → 삭제 완료 (2026-06-25)
 *   2라운드 mci11~17 ← 현재
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:  'default',
    mciId: '',   // 빈 값: 시나리오 store 또는 MCI_ID 환경변수로 주입
  },
  variants: {
    // C4-mci-per-csp 생성 MCI 이름 (mci11~mci18)
    aws:     { mciId: 'mci11' },
    azure:   { mciId: 'mci12' },
    gcp:     { mciId: 'mci13' },
    ali:     { mciId: 'mci14' },
    ibm:     { mciId: 'mci15' },
    nhn:     { mciId: 'mci16' },
    tencent: { mciId: 'mci17' },
    ncp:     { mciId: 'mci18' },
    // C3-mci-multi-csp 가 생성한 MCI 이름
    'multi-csp': { mciId: 'mci-multi' },
  },
} satisfies TCParams;
