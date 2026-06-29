/**
 * deploy/params/base/scenarios/C3-wf-infra-create-sw.params.ts
 *
 * [C3] 워크플로우로 인프라 생성 + SW 설치
 * 실행 워크플로우: vm-mariadb-backup-import-data-init  (단일 CSP 인프라 배포 + mariadb 설치)
 *
 * 대응 삭제 시나리오: C3-wf-infra-delete (single) → vm-mariadb-data-init-cleanup
 *   npx playwright test deploy/scenarios/C3-wf-infra-delete.spec.ts \
 *     --config deploy/playwright.config.ts
 *   (C3-wf-infra-delete.params.ts 의 workflowName 이 vm-mariadb-data-init-cleanup 으로 설정됨)
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C3-wf-infra-create-sw.spec.ts \
 *     --config deploy/playwright.config.ts
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    workflowName:        'vm-mariadb-backup-import-data-init',
    workflowDescription: '단일 CSP 인프라 배포 + mariadb 설치',
  },
} satisfies ScenarioStaticParams;
