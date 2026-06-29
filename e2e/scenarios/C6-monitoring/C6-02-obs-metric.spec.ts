/**
 * deploy/scenarios/C6-02-obs-metric.spec.ts
 * [C6-02] OBS Metric 조회
 *
 * InfluxDB Agent 메트릭, CSP API 메트릭(cb-spider), K8s 노드 메트릭,
 * Infra/NS 오버뷰를 순서대로 확인한다.
 *
 * actor:  SRE 엔지니어
 * status: partial (Step 1 ready / Step 2~4 todo — API discovery 필요)
 *
 * 스텝:
 *   Step 1. TC-OBS-METRIC-01  Agent 시계열 메트릭(InfluxDB)  ← mciId 필수
 *   Step 2. TC-OBS-METRIC-02  CSP API 메트릭(cb-spider)      [todo]
 *   Step 3. TC-OBS-METRIC-03  K8s Cluster 노드 메트릭         [todo]
 *   Step 4. TC-OBS-METRIC-04  Infra / NS 레벨 오버뷰          [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C6-02-obs-metric');
