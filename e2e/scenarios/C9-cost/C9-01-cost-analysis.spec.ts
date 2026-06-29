/**
 * deploy/scenarios/C9-01-cost-analysis.spec.ts
 * [C9] 클라우드 비용 확인
 *
 * Cost Analysis API로 당월 청구·Top5 비용을 조회하고
 * Cost Analysis iframe 화면이 정상 로드되는지 확인한다.
 * 실행 중인 MCI가 없어도 독립적으로 동작한다.
 *
 * actor:  과금 관리자
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-COSTOPT-BILL-01     API 호스트 조회
 *   Step 2. TC-COSTOPT-BILL-02     당월 청구 조회
 *   Step 3. TC-COSTOPT-BILL-03     Top5 청구 조회
 *   Step 4. TC-COSTOPT-IFRAME-01   Cost Analysis iframe 확인
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C9-01-cost-analysis.spec.ts
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C9-01-cost-analysis');
