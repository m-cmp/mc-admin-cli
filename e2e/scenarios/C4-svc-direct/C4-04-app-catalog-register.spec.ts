/**
 * deploy/scenarios/C4-svc-direct/C4-04-app-catalog-register.spec.ts
 * [C4-04] SW 검색 → Catalog 등록
 *
 * 외부(DockerHub)에서 애플리케이션을 검색·Upload하고 SW Catalog에 등록한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-APP-CAT-03  외부 검색 결과 표시 (DockerHub)
 *   Step 2. TC-APP-CAT-04  DockerHub 이미지 → Repository Upload
 *   Step 3. TC-APP-CAT-05  Catalog 신규 등록 (VM 타겟)
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-04-app-catalog-register');
