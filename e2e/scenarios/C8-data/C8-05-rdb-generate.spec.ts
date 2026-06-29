/**
 * deploy/scenarios/C8-data/C8-05-rdb-generate.spec.ts
 * [C8-05] RDBMS 테스트 데이터 생성
 *
 * RDBMS 인스턴스에 테스트 데이터를 생성(Generate)한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C1 MC-DATA-MANAGER-INIT에서 RDBMS 인스턴스가 가동 중이어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-RDB-01  RDBMS 데이터 생성 (Generate)
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-05-rdb-generate');
