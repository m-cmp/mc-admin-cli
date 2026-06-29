/**
 * deploy/scenarios/C10-cleanup/C10-06-k8s-per-csp-delete.spec.ts
 * [C10] CSP별 K8s 클러스터(PMK) 삭제
 *
 * C4 완료 후 별도 실행 — C4-08-k8s-per-csp 가 생성한 K8s 클러스터를 순서대로 삭제한다.
 * 이미 없는 클러스터는 경고 후 건너뛴다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-INFRA-K8S-08 [tencent]  pmk1 삭제
 *   Step 2. TC-INFRA-K8S-08 [ncp]      pmk2 삭제
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C10-cleanup/C10-06-k8s-per-csp-delete.spec.ts \
 *     --config deploy/playwright.config.ts --project=session-e-cleanup
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C10-06-k8s-per-csp-delete');
