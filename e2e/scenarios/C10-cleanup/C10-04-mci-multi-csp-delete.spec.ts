/**
 * deploy/scenarios/C10-cleanup/C10-04-mci-multi-csp-delete.spec.ts
 * [C10] Multi-CSP MCI 삭제
 *
 * C4 완료 후 별도 실행 — C4-03-mci-multi-csp 가 생성한 단일 Multi-CSP MCI(mci-multi)를 삭제한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-INFRA-LC-02 [multi-csp]   mci-multi 삭제
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C10-cleanup/C10-04-mci-multi-csp-delete.spec.ts \
 *     --config deploy/playwright.config.ts --project=session-e-cleanup
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C10-04-mci-multi-csp-delete');
