/**
 * deploy/scenarios/C8-data/C8-03-objstore-backup.spec.ts
 * [C8-03] Object Storage Backup
 *
 * Object Storage 버킷을 백업한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C8-01에서 원본 버킷과 샘플 데이터가 생성되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-OS-03  Object Storage 백업
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-03-objstore-backup');
