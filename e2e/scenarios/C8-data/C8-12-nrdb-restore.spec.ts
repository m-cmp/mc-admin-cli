/**
 * deploy/scenarios/C8-data/C8-12-nrdb-restore.spec.ts
 * [C8-12] NRDBMS Restore
 *
 * NRDBMS 백업에서 데이터를 복원한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C8-11에서 백업이 완료되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-NRDB-04  NRDBMS 복원
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-12-nrdb-restore');
