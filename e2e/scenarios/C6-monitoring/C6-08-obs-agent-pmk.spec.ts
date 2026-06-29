/**
 * deploy/scenarios/C6-monitoring/C6-08-obs-agent-pmk.spec.ts
 * [C6-08] OBS Agent 관리 — PMK K8s
 *
 * PMK K8s 클러스터에 모니터링 Agent를 설치·상태확인·제거한다.
 * MCI VM 대상인 C6-01과 분리된 K8s 전용 시나리오.
 *
 * actor:  SRE 엔지니어
 * status: todo
 *
 * 전제조건:
 *   - C4-02-k8s-* 시나리오로 K8s 클러스터가 배포되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-OBS-AGENT-01 (variant:pmk)  PMK K8s Node 조회 (Config)  [todo]
 *   Step 2. TC-OBS-AGENT-02 (variant:pmk)  PMK K8s Agent 설치           [todo]
 *   Step 3. TC-OBS-AGENT-03 (variant:pmk)  PMK K8s Agent 설치 상태 폴링 [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C6-08-obs-agent-pmk');
