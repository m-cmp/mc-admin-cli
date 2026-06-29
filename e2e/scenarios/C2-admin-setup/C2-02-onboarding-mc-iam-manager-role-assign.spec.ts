/**
 * deploy/scenarios/C2-02-onboarding-mc-iam-manager-role-assign.spec.ts
 * [C2] 관리자 계정 생성·역할 할당·MCI 연동
 *
 * 관리자 사용자를 생성하고 역할을 부여한 뒤 MCI 목록에 접근 가능한지 확인한다.
 *
 * actor:  플랫폼 관리자
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-IAM-UG-03    관리자 사용자 생성
 *   Step 2. TC-IAM-RBAC-06         플랫폼 역할 부여
 *   Step 3. TC-INFRA-DEPLOY-01        MCI 목록 접근 확인
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-02-onboarding-mc-iam-manager-role-assign.spec.ts
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C2-02-onboarding-mc-iam-manager-role-assign');
