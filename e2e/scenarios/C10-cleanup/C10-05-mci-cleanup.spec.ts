/**
 * deploy/scenarios/C10-cleanup/C10-05-mci-cleanup.spec.ts
 * [C10] mc* MCI 일괄 삭제 (case 분류)
 *
 * C4 완료 후 별도 실행 — 이름이 mc로 시작하는 모든 MCI를
 * Total Servers 수(0/1/2+)로 case 분류하여 일괄 삭제한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-INFRA-LC-03    mc* MCI 스캔 → case1/2/3 분류 → 전체 삭제
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C10-cleanup/C10-05-mci-cleanup.spec.ts \
 *     --config deploy/playwright.config.ts --project=session-e-cleanup
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C10-05-mci-cleanup');
