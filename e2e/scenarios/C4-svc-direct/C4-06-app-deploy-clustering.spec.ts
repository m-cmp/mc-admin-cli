/**
 * deploy/scenarios/C4-svc-direct/C4-06-app-deploy-clustering.spec.ts
 * [C4-06] SW Clustering 배포 (NodeGroup N개 VM)
 *
 * C4-01에서 생성한 Clustering NodeGroup(N개 VM)에 애플리케이션을 Clustering 방식으로 배포한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C4-01에서 Clustering NodeGroup이 생성되어 있어야 한다.
 *   - C4-04 완료 후 Catalog에 VM 타겟 앱이 등록되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-APP-DEP-02  NodeGroup Clustering 배포
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-06-app-deploy-clustering');
