/**
 * deploy/params/base/scenarios/C3-wf-infra-create.params.ts
 *
 * [C3] 워크플로우로 인프라 생성
 * 실행 워크플로우: multi-csp-vm-deploy  (다중 CSP 인프라 배포)
 *
 * 대응 삭제 시나리오: C3-wf-infra-delete → multi-csp-vm-cleanup
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C3-wf-infra-create.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    workflowName:        'multi-csp-vm-deploy',
    workflowDescription: '다중 CSP 인프라 배포 (8종)',
  },
} satisfies ScenarioStaticParams;
