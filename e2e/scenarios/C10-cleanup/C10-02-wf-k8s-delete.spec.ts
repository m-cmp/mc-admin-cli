/**
 * deploy/scenarios/C10-cleanup/C10-02-wf-k8s-delete.spec.ts
 * [C10] 워크플로우로 K8s 삭제
 *
 * C4 완료 후 별도 실행 — K8s 생성 워크플로우와 쌍인 삭제 워크플로우를 실행하여
 * K8s 클러스터를 자동 삭제한다.
 *
 * 워크플로우 쌍:
 *   생성: k8s-mariadb-backup-import-data-init
 *   삭제: k8s-mariadb-data-init-cleanup  ← 실행 대상
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-FLOW-03              K8s 삭제 워크플로우 존재 확인
 *   Step 2. TC-WF-FLOW-06              K8s 삭제 워크플로우 실행 (k8s-mariadb-data-init-cleanup)
 *   Step 3. TC-INFRA-K8S-08 [tencent]  K8s 클러스터 삭제 완료 확인
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C10-cleanup/C10-02-wf-k8s-delete.spec.ts \
 *     --config deploy/playwright.config.ts --project=session-e-cleanup
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C10-02-wf-k8s-delete');
