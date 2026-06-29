/**
 * deploy/params/base/tc/infra/TC-INFRA-DEPLOY-07.params.ts
 * TC-INFRA-DEPLOY-07: MCI 서버 추가 (Add Server — Expert 모드)
 *
 * 기존 MCI에서 MCI Info > Default Tab > Add Server 버튼 클릭 후
 * Deployment Algorithm = 'expert' 선택 → + VM 버튼 → 값 입력 → Deploy
 *
 * IN params (시나리오 실행 시):
 *   store.require('mciId')   — TC-INFRA-DEPLOY-05 OUT
 *   store.require('mciName') — TC-INFRA-DEPLOY-05 OUT
 *
 * 런타임 OUT params:
 *   store.set('subGroupId',   추가된 SubGroup ID)
 *   store.set('subGroupName', subGroupName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:           'default',
    mciName:        'mci11',      // 단독 실행 시 대상 MCI 이름
    subGroupName:   'sg-exp1',
    provider:       'aws',
    region:         'ap-northeast-2',
    connectionName: 'aws-ap-northeast-2',
    commonSpec:     'aws+ap-northeast-2+c4.large',
    imageId:        'ami-0afe1fd15675c3f15',
    subGroupSize:   '1',
  },
  variants: {
    aws: {
      mciName:        'mci11',
      subGroupName:   'sg-exp-aws',
      provider:       'aws',
      region:         'ap-northeast-2',
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+c4.large',
      imageId:        'ami-0afe1fd15675c3f15',
    },
    gcp: {
      mciName:        'mci13',
      subGroupName:   'sg-exp-gcp',
      provider:       'gcp',
      region:         'asia-northeast3',
      connectionName: 'gcp-asia-northeast3',
      commonSpec:     'gcp+asia-northeast3+n1-standard-1',
      imageId:        'https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20260612',
    },
    azure: {
      mciName:        'mci12',
      subGroupName:   'sg-exp-azure',
      provider:       'azure',
      region:         'koreacentral',
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+standard_b4ms',
      imageId:        'Canonical:ubuntu-22_04-lts:server:22.04.202603110',
    },

    // ── C4-01 전용: mci01에 ng2~ng8 subgroup 추가
    // mciName: store.require('mciName') 으로 자동 주입 (mci01)
    // commonSpec 미지정 → TC가 vCPU 1→2→4 순으로 자동 선택
    'ng2-azure': {
      subGroupName:   'ng2',
      provider:       'azure',
      region:         'koreacentral',
      connectionName: 'azure-koreacentral',
      subGroupSize:   '2',
    },
    'ng3-ali': {
      subGroupName:   'ng3',
      provider:       'alibaba',
      region:         'ap-northeast-2',
      connectionName: 'alibaba-ap-northeast-2',
      subGroupSize:   '2',
    },
    'ng4-gcp': {
      subGroupName:   'ng4',
      provider:       'gcp',
      region:         'asia-northeast3',
      connectionName: 'gcp-asia-northeast3',
      subGroupSize:   '2',
    },
    'ng5-ncp': {
      subGroupName:   'ng5',
      provider:       'ncp',
      region:         'kr',
      connectionName: 'ncp-kr',
      subGroupSize:   '2',
    },
    'ng6-nhn': {
      subGroupName:   'ng6',
      provider:       'nhncloud',
      region:         'kr1',
      connectionName: 'nhncloud-kr1',
      imageId:        '0f07c795-2a46-44fc-a61b-fa0d96763ce2',
      subGroupSize:   '2',
    },
    'ng7-tencent': {
      subGroupName:   'ng7',
      provider:       'tencent',
      region:         'ap-seoul',
      connectionName: 'tencent-ap-seoul',
      subGroupSize:   '2',
    },
    'ng8-ibm': {
      subGroupName:   'ng8',
      provider:       'ibm',
      region:         'jp-tok',
      connectionName: 'ibm-jp-tok',
      subGroupSize:   '2',
    },

    // ── C5-01 전용: mci01 Scale Out — CSP별 ng{n}a / ng{n}b 추가
    // AWS
    ng1a: { subGroupName: 'ng1a', provider: 'aws',      region: 'ap-northeast-2', connectionName: 'aws-ap-northeast-2',      subGroupSize: '2' },
    ng1b: { subGroupName: 'ng1b', provider: 'aws',      region: 'ap-northeast-2', connectionName: 'aws-ap-northeast-2',      subGroupSize: '2' },
    // Azure
    ng2a: { subGroupName: 'ng2a', provider: 'azure',    region: 'koreacentral',   connectionName: 'azure-koreacentral',      subGroupSize: '2' },
    ng2b: { subGroupName: 'ng2b', provider: 'azure',    region: 'koreacentral',   connectionName: 'azure-koreacentral',      subGroupSize: '2' },
    // Alibaba
    ng3a: { subGroupName: 'ng3a', provider: 'alibaba',  region: 'ap-northeast-2', connectionName: 'alibaba-ap-northeast-2',  subGroupSize: '2' },
    ng3b: { subGroupName: 'ng3b', provider: 'alibaba',  region: 'ap-northeast-2', connectionName: 'alibaba-ap-northeast-2',  subGroupSize: '2' },
    // GCP
    ng4a: { subGroupName: 'ng4a', provider: 'gcp',      region: 'asia-northeast3',connectionName: 'gcp-asia-northeast3',     subGroupSize: '2' },
    ng4b: { subGroupName: 'ng4b', provider: 'gcp',      region: 'asia-northeast3',connectionName: 'gcp-asia-northeast3',     subGroupSize: '2' },
    // NCP
    ng5a: { subGroupName: 'ng5a', provider: 'ncp',      region: 'kr',             connectionName: 'ncp-kr',                  subGroupSize: '2' },
    ng5b: { subGroupName: 'ng5b', provider: 'ncp',      region: 'kr',             connectionName: 'ncp-kr',                  subGroupSize: '2' },
    // NHN
    ng6a: { subGroupName: 'ng6a', provider: 'nhncloud', region: 'kr1',            connectionName: 'nhncloud-kr1', imageId: '0f07c795-2a46-44fc-a61b-fa0d96763ce2', subGroupSize: '2' },
    ng6b: { subGroupName: 'ng6b', provider: 'nhncloud', region: 'kr1',            connectionName: 'nhncloud-kr1', imageId: '0f07c795-2a46-44fc-a61b-fa0d96763ce2', subGroupSize: '2' },
    // Tencent
    ng7a: { subGroupName: 'ng7a', provider: 'tencent',  region: 'ap-seoul',       connectionName: 'tencent-ap-seoul',        subGroupSize: '2' },
    ng7b: { subGroupName: 'ng7b', provider: 'tencent',  region: 'ap-seoul',       connectionName: 'tencent-ap-seoul',        subGroupSize: '2' },
    // IBM
    ng8a: { subGroupName: 'ng8a', provider: 'ibm',      region: 'jp-tok',         connectionName: 'ibm-jp-tok',              subGroupSize: '2' },
    ng8b: { subGroupName: 'ng8b', provider: 'ibm',      region: 'jp-tok',         connectionName: 'ibm-jp-tok',              subGroupSize: '2' },
  },
} satisfies TCParams;
