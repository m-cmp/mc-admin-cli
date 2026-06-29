/**
 * deploy/scenarios/C10-cleanup/C10-01-wf-infra-delete.spec.ts
 * [C10] 워크플로우로 인프라 삭제
 *
 * C4 완료 후 별도 실행 — 워크플로우를 통해 MCI 인프라를 자동으로 삭제한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-FLOW-03     인프라 삭제 워크플로우 정의
 *   Step 2. TC-WF-FLOW-06     워크플로우 실행
 *   Step 3. TC-INFRA-DEPLOY-01    MCI 삭제 확인
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C10-cleanup/C10-01-wf-infra-delete.spec.ts \
 *     --config deploy/playwright.config.ts --project=session-e-cleanup
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C10-01-wf-infra-delete');
