/**
 * deploy/params/base/scenarios/C3-wf-k8s-create.params.ts
 *
 * [C3] 워크플로우로 K8s 생성
 * 실행 워크플로우: multi-csp-k8s-cluster-deploy  (다중 CSP 클러스터 배포)
 *
 * 대응 삭제 시나리오: C3-wf-k8s-delete → multi-csp-k8s-cluster-cleanup
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C3-wf-k8s-create.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    workflowName:        'multi-csp-k8s-cluster-deploy',
    workflowDescription: '다중 CSP 클러스터 배포',
  },
} satisfies ScenarioStaticParams;
