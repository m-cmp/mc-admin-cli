/**
 * deploy/scenarios/C4-svc-direct/C4-09-k8s-app-verify.spec.ts
 * [C4-09] K8s Application 상태 확인
 *
 * K8s 클러스터에 배포된 애플리케이션의 상태 목록을 조회하고 상세 정보를 확인한다.
 * C4-02-k8s-* 각 환경에 대해 Playwright projects로 반복 실행된다.
 *
 * actor:  SRE 엔지니어
 * status: todo
 *
 * 스텝:
 *   Step 1. TC-APP-APPS-01  Apps Status 목록 조회 (K8s)      [todo]
 *   Step 2. TC-APP-APPS-02  Apps Status 상세 팝업 확인 (K8s)  [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-09-k8s-app-verify');
