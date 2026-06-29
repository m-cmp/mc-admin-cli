/**
 * deploy/scenarios/C3-svc-wf/C3-03-wf-run-infra.spec.ts
 * [C3-03] WF 실행 — 인프라 배포
 *
 * 정의된 인프라 생성 Workflow를 RUN 버튼으로 실행하고 로그를 확인한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-FLOW-06  인프라 배포 Workflow 실행 (RUN)
 *   Step 2. TC-WF-FLOW-07  Workflow 로그 모달 확인
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C3-03-wf-run-infra');
