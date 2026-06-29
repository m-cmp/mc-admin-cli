/**
 * deploy/params/base/tc/cost/TC-COSTOPT-BILL-01.params.ts
 * TC-COSTOPT-BILL-01 ~ 04 공통 파라미터
 * TC-COSTOPT-IFRAME-01: Cost Analysis iframe
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    // Cost API는 admin token 으로 호출 (adminId/adminPassword 는 전역 env 에서 주입)
    currency:       'USD',
    // 조회 기간 (getCurMonthBill 등에서 사용)
    billingYear:    new Date().getFullYear(),
    billingMonth:   new Date().getMonth() + 1,
    top5Limit:      5,
  },
} satisfies TCParams;
