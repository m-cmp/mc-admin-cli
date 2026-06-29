/**
 * deploy/params/base/tc/csp/TC-CSP-CREDENTIAL-03.params.ts
 * TC-CSP-CREDENTIAL-03: CSP 자격증명 등록
 *
 * variant 'api'      → mc-web-console/specs/csp/ 의 API 테스트 (credentialKeyId/Value 사용)
 * variant 'aws'~     → deploy/tc/csp/TC-CSP-CREDENTIAL-03-ui.spec.ts 의 UI 테스트
 *
 * 민감값(비밀번호·키)은 env/local.params.ts 또는 PW_* 환경변수로 주입한다.
 * 이 파일에는 구조(키 목록)만 정의하고 값은 빈 문자열로 유지한다.
 *
 * Provider별 KV 필드명은 cb-spider PROVIDER_KEYS 기준:
 *   aws:       ClientId, ClientSecret
 *   gcp:       ClientEmail, PrivateKey, ProjectID
 *   azure:     ClientId, ClientSecret, TenantId, SubscriptionId
 *   alibaba:   ClientId, ClientSecret
 *   ibm:       ApiKey, S3AccessKey, S3SecretKey
 *   ncp:       ClientId, ClientSecret
 *   nhn:       IdentityEndpoint, Username, Password, DomainName, TenantId
 *   kt:        IdentityEndpoint, Username, Password, DomainName, ProjectID
 *   openstack: IdentityEndpoint, Username, Password, DomainName, ProjectID
 *   tencent:   SecretId, SecretKey
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    credentialHolder:   'e2e-credential',
    providerName:       'aws',
    credentialKeyId:    '',
    credentialKeyValue: '',
  },

  variants: {

    // ── API 테스트 (기존 방식) ─────────────────────────────────────────────
    api: {
      credentialHolder:   'e2e-credential',
      providerName:       'aws',
      credentialKeyId:    '',    // PW_credentialKeyId
      credentialKeyValue: '',    // PW_credentialKeyValue
    },

    // ── UI 테스트 — CSP별 ──────────────────────────────────────────────────

    aws: {
      credentialHolder: 'e2e-aws-credential',
      providerName:     'aws',
      ClientId:         '',    // PW_ClientId  (AWS Access Key ID)
      ClientSecret:     '',    // PW_ClientSecret  (AWS Secret Access Key)
    },

    gcp: {
      credentialHolder: 'e2e-gcp-credential',
      providerName:     'gcp',
      ClientEmail:      '',    // PW_ClientEmail  (서비스 계정 이메일)
      PrivateKey:       '',    // PW_PrivateKey   (서비스 계정 Private Key JSON)
      ProjectID:        '',    // PW_ProjectID
    },

    azure: {
      credentialHolder: 'e2e-azure-credential',
      providerName:     'azure',
      ClientId:         '',    // PW_ClientId      (Application/Client ID)
      ClientSecret:     '',    // PW_ClientSecret  (Client Secret Value)
      TenantId:         '',    // PW_TenantId
      SubscriptionId:   '',    // PW_SubscriptionId
    },

    alibaba: {
      credentialHolder: 'e2e-alibaba-credential',
      providerName:     'alibaba',
      ClientId:         '',    // PW_ClientId      (AccessKey ID)
      ClientSecret:     '',    // PW_ClientSecret  (AccessKey Secret)
    },

    ibm: {
      credentialHolder: 'e2e-ibm-credential',
      providerName:     'ibm',
      ApiKey:           '',    // PW_ApiKey
      S3AccessKey:      '',    // PW_S3AccessKey
      S3SecretKey:      '',    // PW_S3SecretKey
    },

    ncp: {
      credentialHolder: 'e2e-ncp-credential',
      providerName:     'ncp',
      ClientId:         '',    // PW_ClientId      (NCP Access Key)
      ClientSecret:     '',    // PW_ClientSecret  (NCP Secret Key)
    },

    nhn: {
      credentialHolder:  'e2e-nhn-credential',
      providerName:      'nhn',
      IdentityEndpoint:  '',    // PW_IdentityEndpoint  (Keystone v3 endpoint)
      Username:          '',    // PW_Username
      Password:          '',    // PW_Password
      DomainName:        '',    // PW_DomainName
      TenantId:          '',    // PW_TenantId  (Project ID)
    },

    kt: {
      credentialHolder:  'e2e-kt-credential',
      providerName:      'kt',
      IdentityEndpoint:  '',    // PW_IdentityEndpoint
      Username:          '',    // PW_Username
      Password:          '',    // PW_Password
      DomainName:        '',    // PW_DomainName
      ProjectID:         '',    // PW_ProjectID
    },

    openstack: {
      credentialHolder:  'e2e-openstack-credential',
      providerName:      'openstack',
      IdentityEndpoint:  '',    // PW_IdentityEndpoint
      Username:          '',    // PW_Username
      Password:          '',    // PW_Password
      DomainName:        '',    // PW_DomainName
      ProjectID:         '',    // PW_ProjectID
    },

    tencent: {
      credentialHolder: 'e2e-tencent-credential',
      providerName:     'tencent',
      SecretId:         '',    // PW_SecretId
      SecretKey:        '',    // PW_SecretKey
    },

  },
} satisfies TCParams;
