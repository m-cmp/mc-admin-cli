/**
 * deploy/scenarios/C4-svc-direct/C4-05-app-deploy-standalone.spec.ts
 * [C4-05] SW Standalone 배포 (Infra VM 단일)
 *
 * MCI의 단일 VM에 애플리케이션을 Standalone 방식으로 배포한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C4-03, C4-04 완료 후 Catalog에 VM 타겟 앱이 등록되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-APP-DEP-01  VM 단일 Standalone 배포
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-05-app-deploy-standalone');
