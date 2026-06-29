/**
 * deploy/params/base/tc/cost/TC-COSTOPT-OPER.params.ts
 * TC-COSTOPT-OPER-01~03 공통 파라미터
 *
 * OPER-01: 비용 수집 및 최적화 알람 수신
 * OPER-02: 덤프데이터를 통한 비용 수집 및 최적화 알람 수신
 * OPER-03: ML/LLM 자원 추천 (Resource Recommendation)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    currency:     'USD',
    billingYear:  new Date().getFullYear(),
    billingMonth: new Date().getMonth() + 1,
  },
  variants: {
    // OPER-02: 덤프 데이터 기반 테스트용
    dump: {
      useDumpData: true,
    },
  },
} satisfies TCParams;
