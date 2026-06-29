/**
 * deploy/params/base/tc/infra/TC-INFRA-K8S-05.params.ts
 * TC-INFRA-K8S-05: PMK KubeConfig 획득 — 기본 파라미터
 *
 * C7-k8s-per-csp (aws), C7-k8s-manage-ibm (ibm) 에서 사용.
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:        'default',
    clusterName: 'pmk1',
  },
  variants: {
    aws: { clusterName: 'tc-k8s-aws' },
    ibm: { clusterName: 'tc-k8s-ibm' },
    tencent: { clusterName: 'pmk11' },
    ncp:     { clusterName: 'pmk12' },
  },
} satisfies TCParams;
