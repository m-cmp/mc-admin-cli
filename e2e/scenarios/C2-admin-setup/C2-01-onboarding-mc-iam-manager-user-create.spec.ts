/**
 * deploy/scenarios/C2-01-onboarding-mc-iam-manager-user-create.spec.ts
 * [C2] IAM 온보딩 — 사용자 추가·역할·그룹 할당
 *
 * 신규 사용자 생성부터 역할 배정, 그룹 할당, 워크스페이스 접근 확인까지
 * 플랫폼 관리자가 수행하는 전체 온보딩 흐름을 검증한다.
 *
 * actor:  플랫폼 관리자
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-IAM-UG-03    신규 사용자 생성
 *   Step 2. TC-IAM-UG-08    그룹 생성
 *   Step 3. TC-IAM-UG-11    그룹에 사용자 배정
 *   Step 4. TC-IAM-RBAC-06         사용자에 플랫폼 역할 부여
 *   Step 5. TC-IAM-WS-05    워크스페이스에 사용자 배정
 *   Step 6. TC-IAM-AUTH-01         신규 사용자로 로그인 확인
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-01-onboarding-mc-iam-manager-user-create.spec.ts
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C2-01-onboarding-mc-iam-manager-user-create');
