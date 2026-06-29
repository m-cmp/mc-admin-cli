/**
 * deploy/scenarios/C5-svc-mgmt1/C5-04-app-ops-verify.spec.ts
 * [C5-04] 애플리케이션 운영 액션
 *
 * 배포된 애플리케이션의 상태 목록 갱신·상세 조회 후
 * 운영 액션(Restart / Stop / Uninstall)을 수행한다.
 * Rating 제출은 C5-05에서 별도 처리한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-APP-APPS-01  배포 상태 목록 갱신·Refresh
 *   Step 2. TC-APP-APPS-02  배포 상세 조회
 *   Step 3. TC-APP-APPS-03  운영 액션 (Restart / Stop / Uninstall)
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C5-04-app-ops-verify');
