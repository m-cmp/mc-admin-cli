/**
 * deploy/params/base/tc/cost/TC-COSTOPT-INIT.params.ts
 * TC-COSTOPT-INIT-01~06 공통 파라미터
 *
 * INIT-01~04: CSP별 CUR 데이터 수집 설정 (AWS, NCP, Azure, GCP)
 * INIT-05: 알림 채널 설정 (Gmail / Slack)
 * INIT-06: LLM 채널 설정
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    // CUR 설정 공통
    currency: 'USD',
  },
  variants: {
    aws: {
      csp:         'aws',
      region:      'ap-northeast-2',
      displayName: 'AWS CUR',
    },
    ncp: {
      csp:         'ncp',
      region:      'kr',
      displayName: 'NCP CUR',
    },
    azure: {
      csp:         'azure',
      region:      'koreacentral',
      displayName: 'Azure CUR',
    },
    gcp: {
      csp:         'gcp',
      region:      'asia-northeast3',
      displayName: 'GCP CUR',
    },
    // 알림 채널 (INIT-05)
    'notification-gmail': {
      channelType: 'gmail',
    },
    'notification-slack': {
      channelType: 'slack',
    },
    // LLM 채널 (INIT-06)
    llm: {
      channelType: 'llm',
    },
  },
} satisfies TCParams;
