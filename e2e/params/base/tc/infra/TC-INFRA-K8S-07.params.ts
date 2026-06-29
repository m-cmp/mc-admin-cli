/**
 * deploy/params/base/tc/infra/TC-INFRA-K8S-07.params.ts
 * TC-INFRA-K8S-07: PMK NodeGroup 삭제 — 기본 파라미터
 *
 * minNodeGroupRequired: true 인 CSP는 NodeGroup 개별 삭제 불가.
 * 해당 variant 는 이 TC를 건너뛰고 TC-INFRA-K8S-08(PMK 삭제)로 일괄 처리.
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nodeGroupName:        'png1',
    minNodeGroupRequired: false,
  },
  variants: {
    tencent: { nodeGroupName: 'png11', minNodeGroupRequired: false },
    ncp:     { nodeGroupName: 'png12', minNodeGroupRequired: false },
    // 최소 1 NodeGroup을 요구하는 CSP 예시:
    // someCSP: { minNodeGroupRequired: true },
  },
} satisfies TCParams;
