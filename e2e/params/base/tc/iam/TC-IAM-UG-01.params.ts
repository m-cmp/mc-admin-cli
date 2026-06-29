/**
 * deploy/params/base/tc/iam/TC-IAM-UG-01.params.ts
 * TC-IAM-UG-01 ~ 17 공통 파라미터
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    groupName:        'e2e-usergroup',
    groupDescription: 'E2E 테스트용 사용자 그룹',
    targetUserId:     'e2e-user-01',
  },
} satisfies TCParams;
