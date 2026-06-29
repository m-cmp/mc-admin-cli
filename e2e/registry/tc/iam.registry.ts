/**
 * deploy/registry/tc/iam.registry.ts
 * IAM 도메인 TC 전체 목록 (76개)
 *
 * Feature 코드:
 *   AUTH          — 인증 (로그인·로그아웃·토큰)
 *   COMPANY       — 회사 관리
 *   MENU          — 메뉴 관리
 *   ORG           — 조직 관리
 *   POLICY        — 정책 관리
 *   PROJECT       — 프로젝트 관리
 *   ROLE          — 역할 관리
 *   USER-LIFECYCLE— 사용자 가입·승인 전체 흐름
 *   USERGROUP     — 사용자·그룹 CRUD + 역할 관계
 *   WORKSPACE     — 워크스페이스 CRUD + 멤버·UI
 */
import type { TCEntry } from '../types';

export const IAM_TC_REGISTRY: TCEntry[] = [

  // ── AUTH (11) ─────────────────────────────────────────────────────────────
  { id: 'TC-IAM-AUTH-01', domain: 'iam', feature: 'AUTH', title: '로그인', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-01-login.spec.ts' },
  { id: 'TC-IAM-AUTH-02', domain: 'iam', feature: 'AUTH', title: '로그아웃', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-02-logout.spec.ts' },
  { id: 'TC-IAM-AUTH-03', domain: 'iam', feature: 'AUTH', title: '토큰 갱신', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-03-refresh.spec.ts' },
  { id: 'TC-IAM-AUTH-04', domain: 'iam', feature: 'AUTH', title: '토큰 유효성 검증', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-04-validate.spec.ts' },
  { id: 'TC-IAM-AUTH-05', domain: 'iam', feature: 'AUTH', title: '회원가입', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-05-signup.spec.ts' },
  { id: 'TC-IAM-AUTH-06', domain: 'iam', feature: 'AUTH', title: 'Workspace 티켓 발급', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-06-workspace-ticket.spec.ts' },
  { id: 'TC-IAM-AUTH-07', domain: 'iam', feature: 'AUTH', title: 'JWT 토큰 구조 검증', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-07-JWT-token-structure.spec.ts' },
  { id: 'TC-IAM-AUTH-08', domain: 'iam', feature: 'AUTH', title: '만료 토큰 갱신 처리', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-08-expired-token-refresh.spec.ts' },
  { id: 'TC-IAM-AUTH-09', domain: 'iam', feature: 'AUTH', title: '갱신 입력값 유효성 검증', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-09-refresh-input-validation.spec.ts' },
  { id: 'TC-IAM-AUTH-10', domain: 'iam', feature: 'AUTH', title: '갱신 엔드포인트 접근성', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-10-refresh-endpoint-accessibility.spec.ts' },
  { id: 'TC-IAM-AUTH-11', domain: 'iam', feature: 'AUTH', title: '세션 보호', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/iam/TC-IAM-AUTH-11-session-protection.spec.ts' },

  // ── COMPANY (4) ──────────────────────────────────────────────────────────
  { id: 'TC-IAM-COMP-01', domain: 'iam', feature: 'COMP', title: '회사 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-COMPANY-01-list-companies.spec.ts' },
  { id: 'TC-IAM-COMP-02', domain: 'iam', feature: 'COMP', title: '회사 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-COMPANY-02-create-company.spec.ts' },
  { id: 'TC-IAM-COMP-03', domain: 'iam', feature: 'COMP', title: '회사 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-COMPANY-03-update-company.spec.ts' },
  { id: 'TC-IAM-COMP-04', domain: 'iam', feature: 'COMP', title: '회사 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-COMPANY-04-delete-company.spec.ts' },

  // ── MENU (5) ─────────────────────────────────────────────────────────────
  { id: 'TC-IAM-MENU-01', domain: 'iam', feature: 'MENU', title: '메뉴 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-MENU-01-list-menus.spec.ts' },
  { id: 'TC-IAM-MENU-02', domain: 'iam', feature: 'MENU', title: '메뉴별 역할 체크박스 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-MENU-02-list-roles-for-menu-checkbox.spec.ts' },
  { id: 'TC-IAM-MENU-03', domain: 'iam', feature: 'MENU', title: '메뉴 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-MENU-03-create-menu.spec.ts' },
  { id: 'TC-IAM-MENU-04', domain: 'iam', feature: 'MENU', title: '메뉴 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-MENU-04-update-menu.spec.ts' },
  { id: 'TC-IAM-MENU-05', domain: 'iam', feature: 'MENU', title: '메뉴 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-MENU-05-delete-menu.spec.ts' },

  // ── ORG (5) ──────────────────────────────────────────────────────────────
  { id: 'TC-IAM-ORG-01', domain: 'iam', feature: 'ORG', title: '조직 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ORG-01-list-orgs.spec.ts' },
  { id: 'TC-IAM-ORG-02', domain: 'iam', feature: 'ORG', title: '조직 트리 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ORG-02-org-tree.spec.ts' },
  { id: 'TC-IAM-ORG-03', domain: 'iam', feature: 'ORG', title: '조직 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ORG-03-create-org.spec.ts' },
  { id: 'TC-IAM-ORG-04', domain: 'iam', feature: 'ORG', title: '조직 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ORG-04-update-org.spec.ts' },
  { id: 'TC-IAM-ORG-05', domain: 'iam', feature: 'ORG', title: '조직 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ORG-05-delete-org.spec.ts' },

  // ── POLICY (4) ───────────────────────────────────────────────────────────
  { id: 'TC-IAM-POLICY-01', domain: 'iam', feature: 'POLICY', title: '정책 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-POLICY-01-list-policies.spec.ts' },
  { id: 'TC-IAM-POLICY-02', domain: 'iam', feature: 'POLICY', title: '정책 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-POLICY-02-create-policy.spec.ts' },
  { id: 'TC-IAM-POLICY-03', domain: 'iam', feature: 'POLICY', title: '정책 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-POLICY-03-update-policy.spec.ts' },
  { id: 'TC-IAM-POLICY-04', domain: 'iam', feature: 'POLICY', title: '정책 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-POLICY-04-delete-policy.spec.ts' },

  // ── PROJECT (4) ──────────────────────────────────────────────────────────
  { id: 'TC-IAM-PRJ-01', domain: 'iam', feature: 'PRJ', title: '프로젝트 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-PROJECT-01-list-projects.spec.ts' },
  { id: 'TC-IAM-PRJ-02', domain: 'iam', feature: 'PRJ', title: '프로젝트 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-PROJECT-02-create-project.spec.ts' },
  { id: 'TC-IAM-PRJ-03', domain: 'iam', feature: 'PRJ', title: '프로젝트 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-PROJECT-03-update-project.spec.ts' },
  { id: 'TC-IAM-PRJ-04', domain: 'iam', feature: 'PRJ', title: '프로젝트 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-PROJECT-04-delete-project.spec.ts' },

  // ── ROLE (8) ─────────────────────────────────────────────────────────────
  { id: 'TC-IAM-RBAC-01', domain: 'iam', feature: 'RBAC', title: '역할 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-01-list-roles.spec.ts' },
  { id: 'TC-IAM-RBAC-02', domain: 'iam', feature: 'RBAC', title: '역할 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-02-create-role.spec.ts' },
  { id: 'TC-IAM-RBAC-03', domain: 'iam', feature: 'RBAC', title: '역할 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-03-update-role.spec.ts' },
  { id: 'TC-IAM-RBAC-04', domain: 'iam', feature: 'RBAC', title: '역할 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-04-delete-role.spec.ts' },
  { id: 'TC-IAM-RBAC-05', domain: 'iam', feature: 'RBAC', title: '플랫폼 역할 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-05-list-platform-roles.spec.ts' },
  { id: 'TC-IAM-RBAC-06', domain: 'iam', feature: 'RBAC', title: '사용자에 플랫폼 역할 부여', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-06-assign-platform-role-to-user.spec.ts' },
  { id: 'TC-IAM-RBAC-07', domain: 'iam', feature: 'RBAC', title: '그룹에 플랫폼 역할 부여', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-07-assign-platform-role-to-group.spec.ts' },
  { id: 'TC-IAM-RBAC-08', domain: 'iam', feature: 'RBAC', title: '워크스페이스 역할 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-ROLE-08-list-workspace-roles.spec.ts' },

  // ── USER-LIFECYCLE (3) ───────────────────────────────────────────────────
  { id: 'TC-IAM-USER-LIFECYCLE-01', domain: 'iam', feature: 'USER-LIFECYCLE', title: '가입 신청·관리자 API 승인 후 로그인', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USER-LIFECYCLE-01-signup-approve-via-api-then-login.spec.ts' },
  { id: 'TC-IAM-USER-LIFECYCLE-02', domain: 'iam', feature: 'USER-LIFECYCLE', title: '가입 신청·관리자 UI 승인 후 로그인', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USER-LIFECYCLE-02-signup-approve-via-ui-then-login.spec.ts' },
  { id: 'TC-IAM-USER-LIFECYCLE-03', domain: 'iam', feature: 'USER-LIFECYCLE', title: '가입 승인 후 역할·워크스페이스 선택', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USER-LIFECYCLE-03-signup-approve-roles-workspace-select.spec.ts' },

  // ── USERGROUP (17) ───────────────────────────────────────────────────────
  { id: 'TC-IAM-UG-01', domain: 'iam', feature: 'UG', title: '사용자 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-01-list-users.spec.ts' },
  { id: 'TC-IAM-UG-02', domain: 'iam', feature: 'UG', title: '사용자 단건 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-02-get-user.spec.ts' },
  { id: 'TC-IAM-UG-03', domain: 'iam', feature: 'UG', title: '사용자 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-03-create-user.spec.ts' },
  { id: 'TC-IAM-UG-04', domain: 'iam', feature: 'UG', title: '사용자 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-04-update-user.spec.ts' },
  { id: 'TC-IAM-UG-05', domain: 'iam', feature: 'UG', title: '사용자 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-05-delete-user.spec.ts' },
  { id: 'TC-IAM-UG-06', domain: 'iam', feature: 'UG', title: '그룹 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-06-list-groups.spec.ts' },
  { id: 'TC-IAM-UG-07', domain: 'iam', feature: 'UG', title: '그룹 단건 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-07-get-group.spec.ts' },
  { id: 'TC-IAM-UG-08', domain: 'iam', feature: 'UG', title: '그룹 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-08-create-group.spec.ts' },
  { id: 'TC-IAM-UG-09', domain: 'iam', feature: 'UG', title: '그룹 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-09-update-group.spec.ts' },
  { id: 'TC-IAM-UG-10', domain: 'iam', feature: 'UG', title: '그룹 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-10-delete-group.spec.ts' },
  { id: 'TC-IAM-UG-11', domain: 'iam', feature: 'UG', title: '그룹에 사용자 배정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-11-assign-user-to-group.spec.ts' },
  { id: 'TC-IAM-UG-12', domain: 'iam', feature: 'UG', title: '그룹에서 사용자 제거', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-12-remove-user-from-group.spec.ts' },
  { id: 'TC-IAM-UG-13', domain: 'iam', feature: 'UG', title: '사용자에 플랫폼 역할 부여', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-13-assign-platform-role-to-user.spec.ts' },
  { id: 'TC-IAM-UG-14', domain: 'iam', feature: 'UG', title: '사용자 플랫폼 역할 제거', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-14-remove-platform-role-from-user.spec.ts' },
  { id: 'TC-IAM-UG-15', domain: 'iam', feature: 'UG', title: '사용자 비밀번호 초기화', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-15-reset-user-password.spec.ts' },
  { id: 'TC-IAM-UG-16', domain: 'iam', feature: 'UG', title: '사용자 상태 변경', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-16-update-user-status.spec.ts' },
  { id: 'TC-IAM-UG-17', domain: 'iam', feature: 'UG', title: '활성 멤버 보유 그룹 삭제 거부', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-USERGROUP-17-reject-delete-group-with-active-member.spec.ts' },

  // ── WORKSPACE (15) ───────────────────────────────────────────────────────
  { id: 'TC-IAM-WS-01', domain: 'iam', feature: 'WS', title: '워크스페이스 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-01-list-workspaces.spec.ts' },
  { id: 'TC-IAM-WS-02', domain: 'iam', feature: 'WS', title: '워크스페이스 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-02-create-workspace.spec.ts' },
  { id: 'TC-IAM-WS-03', domain: 'iam', feature: 'WS', title: '워크스페이스 수정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-03-update-workspace.spec.ts' },
  { id: 'TC-IAM-WS-04', domain: 'iam', feature: 'WS', title: '워크스페이스 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-04-delete-workspace.spec.ts' },
  { id: 'TC-IAM-WS-05', domain: 'iam', feature: 'WS', title: '워크스페이스에 사용자 배정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-05-assign-user-to-workspace.spec.ts' },
  { id: 'TC-IAM-WS-06', domain: 'iam', feature: 'WS', title: '워크스페이스 역할과 함께 사용자 배정', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-06-assign-user-with-workspace-role.spec.ts' },
  { id: 'TC-IAM-WS-07', domain: 'iam', feature: 'WS', title: '배정된 워크스페이스 사용자 확인', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-07-user-sees-assigned-workspace.spec.ts' },
  { id: 'TC-IAM-WS-08', domain: 'iam', feature: 'WS', title: '대시보드 카운트 표시', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-08-dashboard-count-display.spec.ts' },
  { id: 'TC-IAM-WS-09', domain: 'iam', feature: 'WS', title: '상세 카드·탭 네비게이션', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-09-detail-card-and-tab-navigation.spec.ts' },
  { id: 'TC-IAM-WS-10', domain: 'iam', feature: 'WS', title: '워크스페이스 추가 모달 UI', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-10-add-workspace-modal-ui.spec.ts' },
  { id: 'TC-IAM-WS-11', domain: 'iam', feature: 'WS', title: '편집 모달 UI', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-11-edit-modal-ui.spec.ts' },
  { id: 'TC-IAM-WS-12', domain: 'iam', feature: 'WS', title: '삭제 확인 모달 UI', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-12-delete-confirm-modal-ui.spec.ts' },
  { id: 'TC-IAM-WS-13', domain: 'iam', feature: 'WS', title: 'Projects 탭 관리', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-13-projects-tab-management.spec.ts' },
  { id: 'TC-IAM-WS-14', domain: 'iam', feature: 'WS', title: '테이블 정렬·다중선택', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-14-table-sort-and-multi-select.spec.ts' },
  { id: 'TC-IAM-WS-15', domain: 'iam', feature: 'WS', title: '워크스페이스 역할 배정 (신규 API·UI)', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/iam/TC-IAM-WORKSPACE-15-assign-workspace-role-via-new-api-ui.spec.ts' },

];
