/**
 * deploy/params/base/scenarios/C3-wf-run-predefined.params.ts
 *
 * [C3] 사전 정의 워크플로우 실행
 * 이미 등록된 워크플로우를 이름으로 조회·실행한다.
 *
 * 8개 사전 정의 워크플로우 (PW_workflowName 으로 선택):
 *   vm-mariadb-backup-import-data-init   — 단일 CSP VM + SW 생성 (기본값)
 *   vm-mariadb-data-init-cleanup         — 단일 CSP VM + SW 삭제
 *   multi-csp-vm-deploy                  — 다중 CSP VM 생성
 *   multi-csp-vm-cleanup                 — 다중 CSP VM 삭제
 *   k8s-mariadb-backup-import-data-init  — 단일 CSP K8s + SW 생성
 *   k8s-mariadb-data-init-cleanup        — 단일 CSP K8s + SW 삭제
 *   multi-csp-k8s-cluster-deploy         — 다중 CSP K8s 생성
 *   multi-csp-k8s-cluster-cleanup        — 다중 CSP K8s 삭제
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C3-wf-run-predefined.spec.ts \
 *     --config deploy/playwright.config.ts
 *
 *   PW_workflowName=multi-csp-vm-deploy \
 *   npx playwright test deploy/scenarios/C3-wf-run-predefined.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    workflowName:        'vm-mariadb-backup-import-data-init',
    workflowDescription: '단일 CSP VM + SW 생성',
  },
} satisfies ScenarioStaticParams;
