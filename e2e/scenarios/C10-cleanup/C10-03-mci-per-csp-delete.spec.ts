/**
 * deploy/scenarios/C10-cleanup/C10-03-mci-per-csp-delete.spec.ts
 * [C10] CSP별 MCI 삭제 (자동화)
 *
 * C4 완료 후 별도 실행 — C4-02-mci-per-csp 가 생성한 CSP별 MCI(mci1~mci7)를 순서대로 삭제한다.
 * 이미 없는 MCI는 경고 후 건너뛴다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-INFRA-LC-02 [aws]       mci1 삭제
 *   Step 2. TC-INFRA-LC-02 [azure]     mci2 삭제
 *   Step 3. TC-INFRA-LC-02 [gcp]       mci3 삭제
 *   Step 4. TC-INFRA-LC-02 [ali]       mci4 삭제
 *   Step 5. TC-INFRA-LC-02 [ibm]       mci5 삭제
 *   Step 6. TC-INFRA-LC-02 [nhn]       mci6 삭제
 *   Step 7. TC-INFRA-LC-02 [tencent]   mci7 삭제
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C10-cleanup/C10-03-mci-per-csp-delete.spec.ts \
 *     --config deploy/playwright.config.ts --project=session-e-cleanup
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C10-03-mci-per-csp-delete');
