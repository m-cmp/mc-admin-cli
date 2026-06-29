/**
 * deploy/params/base/tc/iam/TC-IAM-WORKSPACE-01.params.ts
 * TC-IAM-WORKSPACE-01: 워크스페이스 목록 조회
 * TC-IAM-WORKSPACE-02: 워크스페이스 생성  (같은 params 파일 공유)
 * TC-IAM-WORKSPACE-03: 워크스페이스 상세
 * ...
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    workspaceName:        'e2e-workspace',
    workspaceDescription: 'E2E 테스트용 워크스페이스',
  },
} satisfies TCParams;
