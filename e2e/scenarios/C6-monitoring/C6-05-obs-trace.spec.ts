/**
 * deploy/scenarios/C6-05-obs-trace.spec.ts
 * [C6-05] OBS Trace 조회
 *
 * Grafana Tempo에서 Trace를 검색하고 상세 Call Sequence와 iframe 임베드를 확인한다.
 *
 * actor:  SRE 엔지니어
 * status: partial (Step 1 ready / Step 2~3 todo — Jaeger/Tempo 미설치 시 skip)
 *
 * 스텝:
 *   Step 1. TC-OBS-TRACE-01  Trace 검색(Tempo)          [Jaeger 미설치 시 FAIL]
 *   Step 2. TC-OBS-TRACE-02  Trace 상세 / Call Sequence  [todo]
 *   Step 3. TC-OBS-TRACE-03  Trace iframe 임베드          [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C6-05-obs-trace');
