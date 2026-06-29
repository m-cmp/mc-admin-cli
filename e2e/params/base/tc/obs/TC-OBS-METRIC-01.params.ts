/**
 * deploy/params/base/tc/obs/TC-OBS-METRIC-01.params.ts
 * TC-OBS-METRIC-01 ~ 06 공통 파라미터
 *
 * 런타임 IN params:
 *   store.require('mciId') — TC-INFRA-DEPLOY-05 OUT
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:        'default',
    // mciId 는 런타임 스토어에서 주입
    metricType:  'cpu',     // 'cpu' | 'memory' | 'disk' | 'network'
    periodSec:   60,
    agentPort:   9090,
  },
} satisfies TCParams;
