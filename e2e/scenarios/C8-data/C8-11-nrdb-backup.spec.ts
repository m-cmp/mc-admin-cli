/**
 * deploy/scenarios/C8-data/C8-11-nrdb-backup.spec.ts
 * [C8-11] NRDBMS Backup
 *
 * NRDBMS 데이터를 백업한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C8-09에서 테스트 데이터가 생성되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-NRDB-03  NRDBMS 백업
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-11-nrdb-backup');
