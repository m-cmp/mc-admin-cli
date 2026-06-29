/**
 * deploy/scenarios/C3-svc-wf/C3-04-wf-run-infra-app.spec.ts
 * [C3-04] WF 실행 — 인프라 + Application 통합 배포
 *
 * 인프라와 애플리케이션을 함께 배포하는 Workflow를 실행하고 로그를 확인한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-WF-FLOW-06 (variant:infra-app)  인프라+App 통합 배포 Workflow 실행 (RUN)
 *   Step 2. TC-WF-FLOW-07                       Workflow 로그 모달 확인
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C3-04-wf-run-infra-app');
