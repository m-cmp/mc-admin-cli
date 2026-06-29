/**
 * deploy/params/base/tc/infra/TC-INFRA-MCI-05.params.ts
 * TC-INFRA-MCI-05: MCI 삭제
 *
 * variant 를 통해 어느 MCI를 삭제할지 지정한다.
 * mciId 가 비어있으면 runInfraMci05 는 런타임 store.mciId → MCI_ID 환경변수 순으로 폴백한다.
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:  'default',
    mciId: '',   // 빈 값: 시나리오 store 또는 MCI_ID 환경변수로 주입
  },
  variants: {
    // C3-mci-per-csp 가 생성한 MCI 이름 (mci1~mci7)
    aws:     { mciId: 'mci1' },
    azure:   { mciId: 'mci2' },
    gcp:     { mciId: 'mci3' },
    ali:     { mciId: 'mci4' },
    ibm:     { mciId: 'mci5' },
    nhn:     { mciId: 'mci6' },
    tencent: { mciId: 'mci7' },
    // C3-mci-multi-csp 가 생성한 MCI 이름
    'multi-csp': { mciId: 'mci-multi' },
  },
} satisfies TCParams;
