/**
 * deploy/params/base/tc/csp/TC-CSP-VPC-03.params.ts
 * TC-CSP-VPC-03: VPC 생성 (서브넷 포함)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    connectionName: 'aws-ap-northeast-2',
    vpcName:        'e2e-vpc',
    cidrBlock:      '10.0.0.0/16',
    subnetName:     'e2e-subnet-01',
    subnetCidr:     '10.0.1.0/24',
    zone:           'ap-northeast-2a',
  },
  variants: {
    aws: {
      connectionName: 'aws-ap-northeast-2',
      cidrBlock:      '10.10.0.0/16',
      subnetCidr:     '10.10.1.0/24',
      zone:           'ap-northeast-2a',
    },
    azure: {
      connectionName: 'azure-koreacentral',
      cidrBlock:      '10.20.0.0/16',
      subnetCidr:     '10.20.1.0/24',
      zone:           'koreacentral-1',
    },
    gcp: {
      connectionName: 'gcp-asia-northeast3',
      cidrBlock:      '10.30.0.0/16',
      subnetCidr:     '10.30.1.0/24',
      zone:           'asia-northeast3-a',
    },
  },
} satisfies TCParams;
