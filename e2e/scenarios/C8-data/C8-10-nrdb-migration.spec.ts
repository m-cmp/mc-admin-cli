/**
 * deploy/scenarios/C8-data/C8-10-nrdb-migration.spec.ts
 * [C8-10] NRDBMS Migration
 *
 * NRDBMS 데이터를 다른 인스턴스로 마이그레이션한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C8-09에서 테스트 데이터가 생성되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-NRDB-02  NRDBMS 마이그레이션
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-10-nrdb-migration');
