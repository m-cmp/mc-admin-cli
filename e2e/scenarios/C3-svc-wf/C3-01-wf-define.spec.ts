/**
 * deploy/scenarios/C3-svc-wf/C3-01-wf-define.spec.ts
 * [C3-01] WF 등록 (서비스 생성용·삭제용)
 *
 * 서비스 생성 및 삭제용 Workflow를 각각 정의하고 등록한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-FLOW-03 (variant:create)  서비스 생성용 Workflow 등록
 *   Step 2. TC-WF-FLOW-03 (variant:delete)  서비스 삭제용 Workflow 등록
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C3-01-wf-define');
