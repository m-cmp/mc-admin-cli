/**
 * deploy/scenarios/C3-svc-wf/C3-02-wf-modify.spec.ts
 * [C3-02] WF 조회·수정
 *
 * 등록된 Workflow 목록을 조회하고 상세 내용을 수정한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-FLOW-02  Workflow 목록 조회
 *   Step 2. TC-WF-FLOW-04  Workflow 상세 수정
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C3-02-wf-modify');
