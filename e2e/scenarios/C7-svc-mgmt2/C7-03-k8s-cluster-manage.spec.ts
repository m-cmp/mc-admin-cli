/**
 * deploy/scenarios/C7-svc-mgmt2/C7-03-k8s-cluster-manage.spec.ts
 * [C7-03] K8s 클러스터 운영 관리
 *
 * K8s 클러스터·NodeGroup 목록/상세 조회, KubeConfig 획득,
 * Helm 앱 배포, NodeGroup 크기 변경을 수행한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C5 시나리오로 K8s 클러스터가 배포되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-INFRA-K8S-01  K8s 클러스터·NodeGroup 목록/상세 조회
 *   Step 2. TC-INFRA-K8S-05  KubeConfig 획득 (kubectl 접속 정보)
 *   Step 3. TC-APP-DEP-03    K8s Helm 앱 배포
 *   Step 4. TC-INFRA-K8S-06  K8s NodeGroup 크기 변경
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C7-03-k8s-cluster-manage');
