/**
 * deploy/scenarios/C3-svc-wf/C3-07-wf-el-run.spec.ts
 * [C3-07] Event Listener로 WF 실행 (GET / POST)
 *
 * Event Listener를 통해 외부에서 Workflow를 GET/POST 방식으로 실행한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-EL-06  Event Listener GET Trigger로 Workflow 실행
 *   Step 2. TC-WF-EL-07  Event Listener POST Trigger로 Workflow 실행
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C3-07-wf-el-run');
