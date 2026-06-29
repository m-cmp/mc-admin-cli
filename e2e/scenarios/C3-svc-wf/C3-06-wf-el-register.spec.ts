/**
 * deploy/scenarios/C3-svc-wf/C3-06-wf-el-register.spec.ts
 * [C3-06] Event Listener 등록 (WF 연결)
 *
 * Workflow와 연결된 Event Listener를 생성하고 이름 중복을 검사한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-EL-02  Event Listener 생성 (Workflow 연결)
 *   Step 2. TC-WF-EL-03  Event Listener 이름 중복 검사
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C3-06-wf-el-register');
