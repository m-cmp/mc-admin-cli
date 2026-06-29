/**
 * deploy/params/base/tc/iam/TC-IAM-RBAC-01.params.ts
 * TC-IAM-RBAC-01 ~ 08 공통 파라미터
 *
 * variant 'admin' / 'viewer' 로 권한 수준별 케이스 분리
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    roleName:        'e2e-custom-role',
    roleDescription: 'E2E 테스트용 커스텀 역할',
    // 기본 권한 집합 (조회만)
    permissions: ['workspace:read', 'project:read'],
  },
  variants: {
    admin: {
      roleName:    'e2e-admin-role',
      permissions: ['workspace:read', 'workspace:write', 'project:read', 'project:write'],
    },
    viewer: {
      roleName:    'e2e-viewer-role',
      permissions: ['workspace:read', 'project:read'],
    },
  },
} satisfies TCParams;
