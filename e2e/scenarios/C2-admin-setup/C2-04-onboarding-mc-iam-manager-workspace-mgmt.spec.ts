/**
 * deploy/scenarios/C2-04-onboarding-mc-iam-manager-workspace-mgmt.spec.ts
 * [C2] Workspace 관리 UI 전체 검증
 *
 * 워크스페이스 목록 조회·생성·수정·삭제, Projects 탭 관리,
 * 대시보드 카운트 및 테이블 정렬·다중선택 UX를 검증한다.
 *
 * actor:  플랫폼 관리자
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-IAM-WS-01    워크스페이스 목록 조회
 *   Step 2. TC-IAM-WS-02    워크스페이스 생성
 *   Step 3. TC-IAM-WS-08    대시보드 카운트 확인
 *   Step 4. TC-IAM-WS-10    추가 모달 UI 확인
 *   Step 5. TC-IAM-WS-13    Projects 탭 관리
 *   Step 6. TC-IAM-WS-14    테이블 정렬·다중선택
 *   Step 7. TC-IAM-WS-04    워크스페이스 삭제
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-04-onboarding-mc-iam-manager-workspace-mgmt.spec.ts
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C2-04-onboarding-mc-iam-manager-workspace-mgmt');
