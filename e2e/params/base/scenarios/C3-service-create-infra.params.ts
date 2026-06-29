/**
 * deploy/params/base/scenarios/C3-service-create-infra.params.ts
 * C3-service-create-infra: MCI 직접 생성 → SW 배포 → 정리
 *
 * Spec 검색:
 *   - Priority option: seoul
 *   - vCPU max: 4, Cost max: 1
 *
 * MCI 중복:
 *   - mciDuplicateMode: rename|duplicate (기본 rename)
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    nsId: 'default',
    mciName:        'e2e-mci-c3',
    specSearch: {
      priorityRegion: 'seoul',
      maxCpu:         4,
      maxCost:        1,
      notFoundMode:   'fail',
      specKeywords:   ['t3a.small', 'c4.large', 'small'],
    },
    mciDuplicateMode: 'rename',
  },
  steps: {
    'TC-INFRA-DEPLOY-05': {
      mciName:        'c3-mci-temp',
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+t2.small',
      specSearch: {
        priorityRegion: 'seoul',
        maxCpu:         4,
        maxCost:        1,
        notFoundMode:   'fail',
      },
    },
    'TC-APP-DEP-01': {
      appName:     'c3-nginx',
      catalogName: 'nginx',
      version:     'latest',
      deployType:  'standalone',
    },
    'TC-OBS-METRIC-01': {
      metricType: 'cpu',
      periodSec:  60,
    },
  },
} satisfies ScenarioStaticParams;
