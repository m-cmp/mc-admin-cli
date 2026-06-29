/**
 * deploy/params/base/tc/csp/TC-CSP-CONNECTION-02.params.ts
 * TC-CSP-CONNECTION-02: CSP Connection 생성
 *
 * variant: CSP 제공자별 (aws / azure / gcp / ali / ibm / nhn / tencent)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    // 기본값: aws ap-northeast-2
    connectionName:   'aws-ap-northeast-2',
    providerName:     'aws',
    regionName:       'ap-northeast-2',
    credentialHolder: 'e2e-credential',
  },
  variants: {
    aws: {
      connectionName:   'aws-ap-northeast-2',
      providerName:     'aws',
      regionName:       'ap-northeast-2',
      credentialHolder: 'e2e-aws-credential',
    },
    azure: {
      connectionName:   'azure-koreacentral',
      providerName:     'azure',
      regionName:       'koreacentral',
      credentialHolder: 'e2e-azure-credential',
    },
    gcp: {
      connectionName:   'gcp-asia-northeast3',
      providerName:     'gcp',
      regionName:       'asia-northeast3',
      credentialHolder: 'e2e-gcp-credential',
    },
    ali: {
      connectionName:   'alibaba-ap-northeast-1',
      providerName:     'alibaba',
      regionName:       'ap-northeast-1',
      credentialHolder: 'e2e-ali-credential',
    },
    nhn: {
      connectionName:   'nhncloud-kr1',
      providerName:     'nhncloud',
      regionName:       'kr1',
      credentialHolder: 'e2e-nhn-credential',
    },
  },
} satisfies TCParams;
