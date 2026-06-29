/**
 * deploy/scenarios/C8-data/C8-01-objstore-generate.spec.ts
 * [C8-01] Object Storage 생성
 *
 * Object Storage 버킷을 생성하고 초기 샘플 데이터를 준비한다.
 *
 * actor:  DBA / 인프라 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-DATA-OS-01  Object Storage 생성 (Generate)
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C8-01-objstore-generate');
