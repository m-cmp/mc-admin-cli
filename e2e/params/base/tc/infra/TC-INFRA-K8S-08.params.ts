/**
 * deploy/params/base/tc/infra/TC-INFRA-K8S-08.params.ts
 * TC-INFRA-K8S-08: PMK(K8s 클러스터) 삭제
 *
 * TC-INFRA-K8S-03 생성 params와 항상 쌍으로 맞춤.
 * CSP가 최소 1 NodeGroup을 요구하는 경우 TC-INFRA-K8S-07 이 FAIL 처리되며,
 * 이 TC에서 클러스터 삭제 시 NodeGroup도 함께 제거된다.
 *
 * 이름 체계:
 *   1라운드 pmk1/pmk2 ← 현재 active (tencent pmk1 확인됨)
 *   2라운드 pmk11/pmk12 (TC-INFRA-K8S-03 2라운드 생성 후 맞춤 예정)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:        'default',
    clusterName: '',
  },
  variants: {
    // 1라운드 active 클러스터
    tencent: { clusterName: 'pmk1' },
    ncp:     { clusterName: 'pmk2' },
  },
} satisfies TCParams;
