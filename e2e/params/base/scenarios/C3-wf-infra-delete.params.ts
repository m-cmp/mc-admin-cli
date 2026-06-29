/**
 * deploy/params/base/scenarios/C3-wf-infra-delete.params.ts
 *
 * [C3] 워크플로우로 인프라 삭제
 *
 * 워크플로우 쌍:
 *   생성: vm-mariadb-backup-import-data-init  (C3-wf-infra-create-sw)
 *   삭제: vm-mariadb-data-init-cleanup        ← 기본값 (단일 CSP 삭제)
 *
 *   생성: multi-csp-vm-deploy                (C3-wf-infra-create)
 *   삭제: multi-csp-vm-cleanup               ← PW_workflowName 으로 오버라이드
 *
 * 실행 (단일 CSP 삭제 — 기본):
 *   npx playwright test deploy/scenarios/C3-wf-infra-delete.spec.ts \
 *     --config deploy/playwright.config.ts
 *
 * 실행 (다중 CSP 삭제 — override):
 *   PW_workflowName=multi-csp-vm-cleanup \
 *   npx playwright test deploy/scenarios/C3-wf-infra-delete.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    // 기본: C3-wf-infra-create-sw (vm-mariadb-backup-import-data-init) 의 삭제 워크플로우
    workflowName:        'vm-mariadb-data-init-cleanup',
    workflowDescription: '단일 CSP 인프라 삭제',
  },
} satisfies ScenarioStaticParams;
