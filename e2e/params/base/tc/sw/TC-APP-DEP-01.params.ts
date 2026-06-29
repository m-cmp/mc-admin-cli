/**
 * deploy/params/base/tc/sw/TC-APP-DEP-01.params.ts
 * TC-APP-DEP-01: SW 배포 — VM Standalone
 * TC-APP-DEP-02: SW 배포 — VM Clustering   (같은 파일 공유)
 * TC-APP-DEP-03: SW 배포 — K8s Helm        (같은 파일 공유, 'k8s' variant)
 *
 * 런타임 IN params:
 *   store.require('mciId')    — TC-INFRA-DEPLOY-05 OUT
 *   store.require('mciName')  — TC-INFRA-DEPLOY-05 OUT
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:        'default',
    appName:     'tc-nginx',
    catalogName: 'nginx',
    version:     'latest',
    // mciId, mciName 은 런타임 스토어에서 주입
  },
  variants: {
    standalone: {
      deployType:  'standalone',
      replicaCount: 1,
    },
    clustering: {
      deployType:  'clustering',
      replicaCount: 3,
    },
    k8s: {
      deployType:   'k8s',
      helmChartUrl: '',
      namespace:    'default',
    },
    mci11: {
      mciId:       'mci11',
      mciName:     'mci11',
      nsId:        'default',
      deployType:  'standalone',
      replicaCount: 1,
    },
    mci16: {
      mciId:       'mci16',
      mciName:     'mci16',
      nsId:        'default',
      deployType:  'standalone',
      replicaCount: 1,
    },
    mci18: {
      mciId:       'mci18',
      mciName:     'mci18',
      nsId:        'default',
      deployType:  'standalone',
      replicaCount: 1,
    },
  },
} satisfies TCParams;
