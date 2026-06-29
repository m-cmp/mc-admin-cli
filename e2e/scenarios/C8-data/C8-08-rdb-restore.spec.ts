/**
 * deploy/scenarios/C8-data/C8-08-rdb-restore.spec.ts
 * [C8-08] RDBMS Restore
 *
 * RDBMS 백업에서 데이터를 복원한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C8-07에서 백업이 완료되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-RDB-04  RDBMS 복원
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-08-rdb-restore');
