/**
 * deploy/params/base/tc/infra/TC-INFRA-MCI-03.params.ts
 * TC-INFRA-MCI-03: MCI 생성
 *
 * CSP별 variant 를 통해 동일 TC를 여러 클라우드에서 실행할 수 있다.
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
    mciName: 'tc-mci-temp',
    // 기본값: aws ap-northeast-2
    connectionName: 'aws-ap-northeast-2',
    commonSpec:     'aws+ap-northeast-2+c4.large',
    imageId:        'ami-0afe1fd15675c3f15',
    rootDiskType:   'default',
    rootDiskSize:   '0',
    subGroupSize:   '1',
  },
  variants: {
    // ── VM(MCI) 생성 variants — mciName·vmName은 생성 순서 기반 (mci1~7, ing1~7)
    // specId/imageId: SearchImage API + c4-record.json 검증값 (2026-06-25)
    aws: {
      mciName:        'mci1',
      vmName:         'ing1',
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+c4.large',
      imageId:        'ami-0afe1fd15675c3f15',
    },
    azure: {
      mciName:        'mci2',
      vmName:         'ing2',
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+standard_b4ms',
      imageId:        'Canonical:ubuntu-22_04-lts:server:22.04.202603110',
    },
    gcp: {
      mciName:        'mci3',
      vmName:         'ing3',
      connectionName: 'gcp-asia-northeast3',
      commonSpec:     'gcp+asia-northeast3+n1-standard-1',
      imageId:        'https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20260612',
    },
    ali: {
      mciName:        'mci4',
      vmName:         'ing4',
      connectionName: 'alibaba-ap-northeast-1',
      commonSpec:     'alibaba+eu-central-1+ecs.t6-c4m1.large',
      imageId:        'ubuntu_22_04_x64_20G_alibase_20260522.vhd',
    },
    ibm: {
      mciName:        'mci5',
      vmName:         'ing5',
      connectionName: 'ibm-jp-tok',
      commonSpec:     'ibm+jp-tok+bx2-2x8',
      imageId:        'r022-7b087e37-53f6-4613-9670-e8cfed3d2527',
    },
    nhn: {
      mciName:        'mci6',
      vmName:         'ing6',
      connectionName: 'nhncloud-kr1',
      commonSpec:     'nhn+kr1+m2.c2m4',
      imageId:        '0f07c795-2a46-44fc-a61b-fa0d96763ce2',
    },
    // Tencent VM(MCI) — ap-seoul (2026-06-26 SearchImage 확인)
    // 중국 본토(ap-chongqing 등)는 사용 불가 → ap-seoul로 변경
    // img-487zeit5: Ubuntu Server 22.04 LTS 64bit (x86_64, non-UEFI)
    tencent: {
      mciName:        'mci7',
      vmName:         'ing7',
      connectionName: 'tencent-ap-seoul',
      commonSpec:     'tencent+ap-seoul+s3.small1',
      imageId:        'img-487zeit5',
    },
    // ── 대형 인스턴스 (scale-out / 특수 용도)
    'aws-large': {
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+t2.medium',
    },
    // ── K8s Node 전용 variants (TC-INFRA-K8S-03에서 재사용)
    // Tencent K8s Node — ap-tokyo 사용 (2026-06-24 확인)
    'tencent-k8s': {
      connectionName: 'tencent-ap-tokyo',
      commonSpec:     'tencent+ap-tokyo+S5.MEDIUM4',
    },
    // NCP K8s Node (2026-06-24 확인)
    ncp: {
      connectionName: 'ncp-kr',
      commonSpec:     'ncp+kr+s2-g3',
    },
    // 폐기 이력:
    // ap-chongqing+s5.medium4: ResourceInsufficient (2026-06-26)
    // ap-seoul+s2.small1: out of stock (2026-06-24)
  },
} satisfies TCParams;
