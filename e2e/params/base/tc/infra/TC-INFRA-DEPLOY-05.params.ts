/**
 * deploy/params/base/tc/infra/TC-INFRA-DEPLOY-05.params.ts
 * TC-INFRA-DEPLOY-05: MCI 생성
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
    rootDiskType:   'default',
    rootDiskSize:   '0',
    subGroupSize:   '1',
  },
  variants: {
    // ── VM(MCI) 생성 variants — 2라운드: mci11~17
    // imageId 미지정 시 Ubuntu 22.04 OS 필터 자동 적용 (non-pro 우선)
    aws: {
      mciName:        'mci11',
      vmName:         'ing11',
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+c4.large',
    },
    // Azure koreacentral — 생성 성공 확인 (2026-06-27)
    // Standard_B2ts_v2, Standard_F2ams_v6 모두 성공
    azure: {
      mciName:        'mci12',
      vmName:         'ing12',
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+Standard_B2ts_v2',
      imageId:        'Canonical:ubuntu-22_04-lts:server:22.04.202603110',
    },
    // azure-f2ams: Standard_F2ams_v6 — 성공 확인 (2026-06-27), 대체 spec
    'azure-f2ams': {
      mciName:        'mci12',
      vmName:         'ing12',
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+Standard_F2ams_v6',
      imageId:        'Canonical:ubuntu-22_04-lts:server:22.04.202603110',
    },
    gcp: {
      mciName:        'mci13',
      vmName:         'ing13',
      connectionName: 'gcp-asia-northeast3',
      commonSpec:     'gcp+asia-northeast3+n1-standard-4',
    },
    // Alibaba: ap-northeast-2 (서울, 1차) — 2026-06-26 확인: ecs.t6-c4m1.large
    ali: {
      mciName:        'mci14',
      vmName:         'ing14',
      connectionName: 'alibaba-ap-northeast-2',
      commonSpec:     'alibaba+ap-northeast-2+ecs.t6-c4m1.large',
    },
    ibm: {
      mciName:        'mci15',
      vmName:         'ing15',
      connectionName: 'ibm-jp-tok',
      commonSpec:     'ibm+jp-tok+bx2-4x16',  // 2026-06-26 확인: bx2-2x8 미등록
    },
    nhn: {
      mciName:        'mci16',
      vmName:         'ing16',
      connectionName: 'nhncloud-kr1',
      commonSpec:     'nhn+kr1+m2.c2m4',
      imageId:        '0f07c795-2a46-44fc-a61b-fa0d96763ce2',
    },
    // Tencent VM(MCI) — ap-seoul (2026-06-26 SearchImage 확인)
    // img-487zeit5: Ubuntu Server 22.04 LTS 64bit (x86_64, non-UEFI)
    tencent: {
      mciName:        'mci17',
      vmName:         'ing17',
      connectionName: 'tencent-ap-seoul',
      commonSpec:     'tencent+ap-seoul+s3.small1',
      imageId:        'img-487zeit5',
    },
    // ── C4-01 전용: mci01 생성 (AWS ng1 — 첫 번째 subgroup)
    // commonSpec 미지정 → TC가 vCPU 1→2→4 순으로 자동 선택
    multi: {
      mciName:        'mci01',
      vmName:         'ng1',
      connectionName: 'aws-ap-northeast-2',
      subGroupSize:   '2',
    },
    // ── 대형 인스턴스 (scale-out / 특수 용도)
    'aws-large': {
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+t2.medium',
    },
    // NCP VM(MCI) — kr (2026-06-26 확인)
    ncp: {
      mciName:        'mci18',
      vmName:         'ing18',
      connectionName: 'ncp-kr',
      commonSpec:     'ncp+kr+s2-g3',
      imageId:        '104630229',  // Ubuntu 24.04
    },
    // ── K8s Node 전용 variants (TC-INFRA-K8S-03에서 재사용)
    // Tencent K8s Node — ap-tokyo 사용 (2026-06-24 확인)
    'tencent-k8s': {
      connectionName: 'tencent-ap-tokyo',
      commonSpec:     'tencent+ap-tokyo+S5.MEDIUM4',
    },
    // NCP K8s Node (2026-06-24 확인)
    'ncp-k8s': {
      connectionName: 'ncp-kr',
      commonSpec:     'ncp+kr+s2-g3',
    },
    // tencent+ap-seoul+s2.small1 — out of stock (2026-06-24 확인)
    // 'tencent-seoul': {
    //   connectionName: 'tencent-ap-seoul',
    //   commonSpec:     'tencent+ap-seoul+s2.small1',
    // },
  },
} satisfies TCParams;
