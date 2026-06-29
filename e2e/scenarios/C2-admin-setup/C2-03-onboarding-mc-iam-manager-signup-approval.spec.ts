/**
 * deploy/scenarios/C2-03-onboarding-mc-iam-manager-signup-approval.spec.ts
 * [C2] 가입 신청 승인 — 관리자 승인 화면 API·UI 검증
 *
 * 사용자가 회원가입을 신청하고 관리자가 API 또는 UI로 승인한 후
 * 해당 사용자의 로그인이 가능해지는 흐름을 검증한다.
 *
 * actor:  플랫폼 관리자
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-IAM-AUTH-05              사용자 회원가입 신청
 *   Step 2. TC-IAM-USER-LIFECYCLE-01    관리자 API 승인 후 로그인
 *   Step 3. TC-IAM-USER-LIFECYCLE-02    관리자 UI 승인 후 로그인
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-03-onboarding-mc-iam-manager-signup-approval.spec.ts
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C2-03-onboarding-mc-iam-manager-signup-approval');
