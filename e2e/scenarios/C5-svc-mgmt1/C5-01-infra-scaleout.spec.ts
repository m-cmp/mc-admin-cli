/**
 * deploy/scenarios/C5-svc-mgmt1/C5-01-infra-scaleout.spec.ts
 * [C5-01] Infra Scale Out — CSP별 NodeGroup 2개 추가
 *
 * mci01의 각 CSP subgroup에 nodegroup을 2개씩 추가하여 수평 확장한다.
 * (8 CSP × 2 = 16 subgroup 추가)
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step  1. TC-INFRA-DEPLOY-07 (variant:ng1a)  ng1a (AWS) subgroup 추가
 *   Step  2. TC-INFRA-DEPLOY-07 (variant:ng1b)  ng1b (AWS) subgroup 추가
 *   Step  3. TC-INFRA-DEPLOY-07 (variant:ng2a)  ng2a (Azure) subgroup 추가
 *   Step  4. TC-INFRA-DEPLOY-07 (variant:ng2b)  ng2b (Azure) subgroup 추가
 *   Step  5. TC-INFRA-DEPLOY-07 (variant:ng3a)  ng3a (Alibaba) subgroup 추가
 *   Step  6. TC-INFRA-DEPLOY-07 (variant:ng3b)  ng3b (Alibaba) subgroup 추가
 *   Step  7. TC-INFRA-DEPLOY-07 (variant:ng4a)  ng4a (GCP) subgroup 추가
 *   Step  8. TC-INFRA-DEPLOY-07 (variant:ng4b)  ng4b (GCP) subgroup 추가
 *   Step  9. TC-INFRA-DEPLOY-07 (variant:ng5a)  ng5a (NCP) subgroup 추가
 *   Step 10. TC-INFRA-DEPLOY-07 (variant:ng5b)  ng5b (NCP) subgroup 추가
 *   Step 11. TC-INFRA-DEPLOY-07 (variant:ng6a)  ng6a (NHN) subgroup 추가
 *   Step 12. TC-INFRA-DEPLOY-07 (variant:ng6b)  ng6b (NHN) subgroup 추가
 *   Step 13. TC-INFRA-DEPLOY-07 (variant:ng7a)  ng7a (Tencent) subgroup 추가
 *   Step 14. TC-INFRA-DEPLOY-07 (variant:ng7b)  ng7b (Tencent) subgroup 추가
 *   Step 15. TC-INFRA-DEPLOY-07 (variant:ng8a)  ng8a (IBM) subgroup 추가
 *   Step 16. TC-INFRA-DEPLOY-07 (variant:ng8b)  ng8b (IBM) subgroup 추가
 *   Step 17. TC-INFRA-DEPLOY-01                  전체 VM Running 상태 확인
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C5-01-infra-scaleout');
