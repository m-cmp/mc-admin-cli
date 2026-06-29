/**
 * deploy/params/base/tc/workflow/TC-WF-FLOW-02.params.ts
 * TC-WF-FLOW-02: 신규 워크플로우 생성 A (인프라 배포 + SW 설치)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    flowName:    'tc-flow-a-infra-sw',
    description: 'E2E — 인프라 배포 + SW 설치 플로우',
    // 노드 정의
    nodes: [
      { id: 'n1', type: 'infra-deploy' },
      { id: 'n2', type: 'sw-install',  dependsOn: ['n1'] },
    ],
  },
} satisfies TCParams;
