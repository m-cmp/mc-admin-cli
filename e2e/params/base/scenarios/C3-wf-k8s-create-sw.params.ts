/**
 * deploy/params/base/scenarios/C3-wf-k8s-create-sw.params.ts
 *
 * [C3] 워크플로우로 K8s 생성 + SW 설치
 * 실행 워크플로우: k8s-mariadb-backup-import-data-init  (단일 CSP 클러스터 배포 + mariadb Helm 설치)
 *
 * 대응 삭제 시나리오: C3-wf-k8s-delete (single) → k8s-mariadb-data-init-cleanup
 *   npx playwright test deploy/scenarios/C3-wf-k8s-delete.spec.ts \
 *     --config deploy/playwright.config.ts
 *   (C3-wf-k8s-delete.params.ts 의 workflowName 이 k8s-mariadb-data-init-cleanup 으로 설정됨)
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C3-wf-k8s-create-sw.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    workflowName:        'k8s-mariadb-backup-import-data-init',
    workflowDescription: '단일 CSP 클러스터 배포 + mariadb Helm 설치',
  },
} satisfies ScenarioStaticParams;
