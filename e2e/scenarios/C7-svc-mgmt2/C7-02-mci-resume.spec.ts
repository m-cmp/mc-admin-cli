/**
 * deploy/scenarios/C7-svc-mgmt2/C7-02-mci-resume.spec.ts
 * [C7-02] MCI Resume
 *
 * suspend 상태의 MCI를 resume하여 Running으로 복구한다.
 * C7-01 실행 후 MCI가 Stopped 상태일 때 단독으로 실행하는 복구 시나리오.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-INFRA-DEPLOY-02  MCI 상태 확인
 *   Step 2. TC-INFRA-LC-01b     MCI resume (Stopped→Running)
 *   Step 3. TC-INFRA-DEPLOY-01  Running 상태 확인
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C7-02-mci-resume');
