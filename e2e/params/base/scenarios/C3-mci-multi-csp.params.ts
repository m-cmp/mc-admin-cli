/**
 * deploy/params/base/scenarios/C3-mci-multi-csp.params.ts
 *
 * [C3] Multi-CSP MCI — 여러 CSP VM을 단일 MCI로 통합 생성
 * 대응 삭제 시나리오: C3-mci-multi-csp-delete
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    mciName: 'mci-multi',
    vmName:  'ing-multi',
  },
} satisfies ScenarioStaticParams;
