/**
 * deploy/scenarios/C6-04-obs-log.spec.ts
 * [C6-04] OBS Log 조회
 *
 * Loki 라벨 목록을 조회하고 LogQL로 키워드 검색을 수행한다.
 *
 * actor:  SRE 엔지니어
 * status: partial (Step 1 ready / Step 2 todo — LogQL API discovery 필요)
 *
 * 스텝:
 *   Step 1. TC-OBS-LOG-01  라벨 조회             ← mciId 필수
 *   Step 2. TC-OBS-LOG-02  키워드 검색(LogQL)    [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C6-04-obs-log');
