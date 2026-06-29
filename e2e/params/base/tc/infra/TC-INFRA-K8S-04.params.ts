/**
 * deploy/params/base/tc/infra/TC-INFRA-K8S-04.params.ts
 * TC-INFRA-K8S-04: PMK 클러스터 생성 (Expert 모드)
 *
 * Dynamic 모드(K8S-03)와 달리 toggleExpertCreation() 버튼으로 전환된
 * #create_expert 폼을 사용하며 Provider / Region 드롭다운이 추가된다.
 *
 * 런타임 OUT params:
 *   store.set('k8sId',   생성된 K8s 클러스터 ID)
 *   store.set('k8sName', clusterName)
 *   store.set('nsId',    nsId)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:           'default',
    clusterName:    'pmk-exp1',
    nodeGroupName:  'png-exp1',
    provider:       'tencent',
    region:         'ap-tokyo',
    connectionName: 'tencent-ap-tokyo',
    commonSpec:     'tencent+ap-tokyo+S5.MEDIUM4',
    desiredNodeSize: 1,
    minNodeSize:     1,
    maxNodeSize:     3,
    onAutoScaling:  'false',
  },
  variants: {
    tencent: {
      clusterName:    'pmk-exp1',
      nodeGroupName:  'png-exp1',
      provider:       'tencent',
      region:         'ap-tokyo',
      connectionName: 'tencent-ap-tokyo',
      commonSpec:     'tencent+ap-tokyo+S5.MEDIUM4',
    },
    ncp: {
      clusterName:    'pmk-exp2',
      nodeGroupName:  'png-exp2',
      provider:       'ncp',
      region:         'kr',
      connectionName: 'ncp-kr',
      commonSpec:     'ncp+kr+s2-g3',
    },

    // ── C4-02 전용: IBM K8s 클러스터 (Expert 모드)
    // commonSpec 미지정 → TC가 vCPU 2→4 순으로 자동 선택
    ibm: {
      clusterName:     'k8s-ibm',
      nodeGroupName:   'png-ibm',
      provider:        'ibm',
      region:          'jp-tok',
      connectionName:  'ibm-jp-tok',
      desiredNodeSize: 1,
      minNodeSize:     1,
      maxNodeSize:     3,
      onAutoScaling:   'false',
    },
  },
} satisfies TCParams;
