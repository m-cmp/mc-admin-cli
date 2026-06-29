/**
 * deploy/params/base/scenarios/C2-001.params.ts
 * C2-001: IAM 기본 시나리오 — 사용자 생성 ~ 워크스페이스 설정
 *
 * 런타임 IN/OUT 흐름:
 *   TC-IAM-USER-LIFECYCLE-01 → store.set('newUserId', ...)
 *   TC-IAM-WS-02      → store.set('workspaceId', ...)
 *   TC-IAM-UG-02      → store.require('workspaceId'), store.require('newUserId')
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    // C2-001 전체에서 사용하는 공통 접두사
    resourcePrefix: 'c2-001',
  },
  steps: {
    'TC-IAM-USER-LIFECYCLE-01': {
      newUserId:       'c2-001-user',
      newUserPassword: 'C2Test!2024',
      newUserName:     'C2-001 테스트 사용자',
      newUserEmail:    'c2-001-user@example.com',
    },
    'TC-IAM-WS-02': {
      workspaceName:        'c2-001-workspace',
      workspaceDescription: 'C2-001 시나리오 테스트 워크스페이스',
    },
    'TC-IAM-UG-02': {
      groupName:        'c2-001-group',
      groupDescription: 'C2-001 시나리오 테스트 그룹',
    },
  },
} satisfies ScenarioStaticParams;
