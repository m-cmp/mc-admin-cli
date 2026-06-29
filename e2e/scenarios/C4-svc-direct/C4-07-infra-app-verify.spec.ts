/**
 * deploy/scenarios/C4-svc-direct/C4-07-infra-app-verify.spec.ts
 * [C4-07] Infra Application 상태 확인
 *
 * Infra(MCI VM)에 배포된 애플리케이션의 상태 목록을 조회하고 상세 정보를 확인한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-APP-APPS-01  Apps Status 목록 조회 (Infra)
 *   Step 2. TC-APP-APPS-02  Apps Status 상세 팝업 확인 (Infra)
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-07-infra-app-verify');
