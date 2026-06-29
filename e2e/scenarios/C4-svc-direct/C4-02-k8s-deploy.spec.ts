/**
 * deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts
 * [C4-02] K8s 배포 — CSP별 공용 spec
 *
 * 9개 CSP K8s 클러스터 배포 시나리오가 이 파일을 공유한다.
 * 실행 시 SCENARIO_ID 환경변수로 대상 시나리오를 선택한다.
 *
 *   C4-02-k8s-aws      (todo)   AWS    — Dynamic
 *   C4-02-k8s-azure    (todo)   Azure  — Dynamic
 *   C4-02-k8s-gcp      (todo)   GCP    — Dynamic
 *   C4-02-k8s-ali      (todo)   Alibaba — Dynamic
 *   C4-02-k8s-ibm      (wip)    IBM    — Expert
 *   C4-02-k8s-nhn      (todo)   NHN    — Dynamic
 *   C4-02-k8s-tencent  (ready)  Tencent — Dynamic
 *   C4-02-k8s-ncp      (ready)  NCP    — Dynamic
 *
 * 스텝 (CSP별 variant 적용):
 *   Step 1. TC-INFRA-K8S-03 or K8S-04  K8s 클러스터 배포 (Dynamic or Expert)
 *   Step 2. TC-INFRA-K8S-05             KubeConfig 획득
 *
 * 실행 예:
 *   SCENARIO_ID=C4-02-k8s-tencent npx playwright test C4-02-k8s-deploy.spec.ts
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario(process.env.SCENARIO_ID ?? 'C4-02-k8s-aws');
