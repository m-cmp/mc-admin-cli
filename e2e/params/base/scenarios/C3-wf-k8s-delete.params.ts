/**
 * deploy/params/base/scenarios/C3-wf-k8s-delete.params.ts
 *
 * [C3] 워크플로우로 K8s 삭제
 *
 * 워크플로우 쌍:
 *   생성: k8s-mariadb-backup-import-data-init  (C3-wf-k8s-create-sw)
 *   삭제: k8s-mariadb-data-init-cleanup        ← 기본값 (단일 CSP 삭제)
 *
 *   생성: multi-csp-k8s-cluster-deploy         (C3-wf-k8s-create)
 *   삭제: multi-csp-k8s-cluster-cleanup        ← PW_workflowName 으로 오버라이드
 *
 * 실행 (단일 CSP 삭제 — 기본):
 *   npx playwright test deploy/scenarios/C3-wf-k8s-delete.spec.ts \
 *     --config deploy/playwright.config.ts
 *
 * 실행 (다중 CSP 삭제 — override):
 *   PW_workflowName=multi-csp-k8s-cluster-cleanup \
 *   npx playwright test deploy/scenarios/C3-wf-k8s-delete.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    // 기본: C3-wf-k8s-create-sw (k8s-mariadb-backup-import-data-init) 의 삭제 워크플로우
    workflowName:        'k8s-mariadb-data-init-cleanup',
    workflowDescription: '단일 CSP 클러스터 삭제',
  },
} satisfies ScenarioStaticParams;
