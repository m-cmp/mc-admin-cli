/**
 * deploy/scenarios/C8-data/C8-02-objstore-migrate.spec.ts
 * [C8-02] Object Storage Migration
 *
 * Object Storage 데이터를 다른 버킷으로 마이그레이션한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 전제조건:
 *   - C8-01에서 원본 버킷과 샘플 데이터가 생성되어 있어야 한다.
 *
 * 스텝:
 *   Step 1. TC-DATA-OS-02  Object Storage 마이그레이션
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-02-objstore-migrate');
