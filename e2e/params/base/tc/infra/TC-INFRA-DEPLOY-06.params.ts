/**
 * deploy/params/base/tc/infra/TC-INFRA-DEPLOY-06.params.ts
 * TC-INFRA-DEPLOY-06: MCI 생성 (Expert 모드)
 *
 * Express 모드(DEPLOY-05)와 달리 Provider / Region 드롭다운을 별도 선택하고
 * #expert_server_configuration 폼을 사용한다.
 *
 * 런타임 OUT params:
 *   store.set('mciId',   생성된 MCI ID)
 *   store.set('mciName', mciName)
 *   store.set('nsId',    nsId)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:    'default',
    mciName: 'tc-exp-mci1',
    // Expert 모드 — Provider / Region / Connection 별도 지정
    provider:       'aws',
    region:         'ap-northeast-2',
    connectionName: 'aws-ap-northeast-2',
    commonSpec:     'aws+ap-northeast-2+c4.large',
    imageId:        'ami-0afe1fd15675c3f15',
    subGroupSize:   '1',
  },
  variants: {
    aws: {
      mciName:        'tc-exp-mci1',
      provider:       'aws',
      region:         'ap-northeast-2',
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+c4.large',
      imageId:        'ami-0afe1fd15675c3f15',
    },
    gcp: {
      mciName:        'tc-exp-mci2',
      provider:       'gcp',
      region:         'asia-northeast3',
      connectionName: 'gcp-asia-northeast3',
      commonSpec:     'gcp+asia-northeast3+n1-standard-1',
      imageId:        'https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20260612',
    },
    azure: {
      mciName:        'tc-exp-mci3',
      provider:       'azure',
      region:         'koreacentral',
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+standard_b4ms',
      imageId:        'Canonical:ubuntu-22_04-lts:server:22.04.202603110',
    },
    ali: {
      mciName:        'tc-exp-mci4',
      provider:       'alibaba',
      region:         'ap-northeast-1',
      connectionName: 'alibaba-ap-northeast-1',
      commonSpec:     'alibaba+eu-central-1+ecs.t6-c4m1.large',
      imageId:        'ubuntu_22_04_x64_20G_alibase_20260522.vhd',
    },
  },
} satisfies TCParams;
