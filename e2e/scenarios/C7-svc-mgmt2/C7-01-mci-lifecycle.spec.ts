/**
 * deploy/scenarios/C7-svc-mgmt2/C7-01-mci-lifecycle.spec.ts
 * [C7-01] 운영 중 MCI 관리 (인프라 라이프사이클)
 *
 * 운영 중인 MCI 인프라의 suspend·reboot·resume 라이프사이클을 관리한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C5 시나리오로 mciId가 생성되어 store에 저장되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-INFRA-LC-01a  MCI suspend (Running→Stopped)
 *   Step 2. TC-INFRA-LC-01c  MCI reboot  (Stopped→Running)
 *   Step 3. TC-INFRA-LC-01a  MCI suspend (Running→Stopped)
 *   Step 4. TC-INFRA-LC-01b  MCI resume  (Stopped→Running)
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C7-01-mci-lifecycle');
