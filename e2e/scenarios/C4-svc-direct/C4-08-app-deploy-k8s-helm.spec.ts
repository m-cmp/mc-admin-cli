/**
 * deploy/scenarios/C4-svc-direct/C4-08-app-deploy-k8s-helm.spec.ts
 * [C4-08] SW K8s Helm 배포
 *
 * K8s 클러스터에 Catalog(K8s 타겟)를 등록하고 Helm으로 애플리케이션을 배포한다.
 * C4-02-k8s-* 각 환경에 대해 Playwright projects로 반복 실행된다.
 *
 * actor:  SRE 엔지니어
 * status: todo
 *
 * 스텝:
 *   Step 1. TC-APP-REP-03  SW Catalog 등록 (K8s 타겟)  [todo]
 *   Step 2. TC-APP-DEP-03  SW K8s 배포 (Helm)          [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-08-app-deploy-k8s-helm');
