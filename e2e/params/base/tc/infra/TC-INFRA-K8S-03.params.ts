/**
 * deploy/params/base/tc/infra/TC-INFRA-K8S-03.params.ts
 * TC-INFRA-K8S-03: K8s 클러스터(PMK) 직접 생성
 *
 * createK8sDynamic API를 사용하여 CSP별 K8s 클러스터를 생성한다.
 *
 * 지원 CSP (K8s 가능 확인):
 *   - Tencent: ap-tokyo (tencent-k8s 스펙)
 *   - NCP: kr
 *
 * 런타임 OUT params:
 *   store.set('k8sId',             생성된 K8s 클러스터 ID)
 *   store.set('k8sId_{variant}',   CSP별 K8s ID)
 *   store.set('k8sName',           clusterName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:           'default',
    // 2라운드: pmk11/pmk12 (1라운드 pmk1/pmk2 삭제 완료 후)
    clusterName:    'pmk11',
    nodeGroupName:  'png11',
    connectionName: 'tencent-ap-tokyo',
    commonSpec:     'tencent+ap-tokyo+S5.MEDIUM4',
    desiredNodeSize: 1,
    minNodeSize:     1,
    maxNodeSize:     3,
    onAutoScaling:  'false',
  },
  variants: {
    // Step 1: Tencent K8s — 2라운드 pmk11/png11
    tencent: {
      clusterName:    'pmk11',
      nodeGroupName:  'png11',
      connectionName: 'tencent-ap-tokyo',
      commonSpec:     'tencent+ap-tokyo+S5.MEDIUM4',
    },
    // Step 2: NCP K8s — 2라운드 pmk12/png12
    ncp: {
      clusterName:    'pmk12',
      nodeGroupName:  'png12',
      connectionName: 'ncp-kr',
      commonSpec:     'ncp+kr+s2-g3',
    },

    // ── C4-02 전용: 6개 CSP K8s 클러스터 (Dynamic 모드)
    // commonSpec 미지정 → TC가 vCPU 2→4 순으로 자동 선택
    aws: {
      clusterName:     'k8s-aws',
      nodeGroupName:   'png-aws',
      connectionName:  'aws-ap-northeast-2',
      desiredNodeSize: 1,
      minNodeSize:     1,
      maxNodeSize:     3,
      onAutoScaling:   'false',
    },
    azure: {
      clusterName:     'k8s-azure',
      nodeGroupName:   'png-azure',
      connectionName:  'azure-koreacentral',
      desiredNodeSize: 1,
      minNodeSize:     1,
      maxNodeSize:     3,
      onAutoScaling:   'false',
    },
    ali: {
      clusterName:     'k8s-ali',
      nodeGroupName:   'png-ali',
      connectionName:  'alibaba-ap-northeast-2',
      desiredNodeSize: 1,
      minNodeSize:     1,
      maxNodeSize:     3,
      onAutoScaling:   'false',
    },
    gcp: {
      clusterName:     'k8s-gcp',
      nodeGroupName:   'png-gcp',
      connectionName:  'gcp-asia-northeast3',
      desiredNodeSize: 1,
      minNodeSize:     1,
      maxNodeSize:     3,
      onAutoScaling:   'false',
    },
    nhn: {
      clusterName:     'k8s-nhn',
      nodeGroupName:   'png-nhn',
      connectionName:  'nhncloud-kr1',
      desiredNodeSize: 1,
      minNodeSize:     1,
      maxNodeSize:     3,
      onAutoScaling:   'false',
    },
  },
} satisfies TCParams;
