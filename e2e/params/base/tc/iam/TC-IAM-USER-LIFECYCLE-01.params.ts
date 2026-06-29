/**
 * deploy/params/base/tc/iam/TC-IAM-USER-LIFECYCLE-01.params.ts
 * TC-IAM-USER-LIFECYCLE-01: 사용자 회원가입
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    newUserId:       'e2e-user-01',
    newUserPassword: 'E2eUser!2024',
    newUserName:     'E2E 테스트 사용자',
    newUserEmail:    'e2e-user-01@example.com',
  },
} satisfies TCParams;
