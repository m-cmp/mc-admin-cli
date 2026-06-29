/**
 * deploy/registry/tc/cost.registry.ts
 * COST(비용 최적화) 도메인 TC 전체 목록
 *
 * Feature 코드 (Excel mc-cost-optimizer 기준):
 *   BILL   — 청구·비용 API 조회
 *   IFRAME — Cost Analysis iframe 화면 테스트
 *   INIT   — CUR 데이터 수집·알림/LLM 채널 설정 (초기화)
 *   OPER   — 비용 수집 알람 수신·ML/LLM 자원 추천 (운영)
 *
 * 엑셀 TC ID 체계: TC-COSTOPT-{FEATURE}-{NN}
 * 구 TC-COST-{FEATURE}-{NN} 에서 프레임워크 세그먼트 COST → COSTOPT 로 변경.
 */
import type { TCEntry } from '../types';

export const COST_TC_REGISTRY: TCEntry[] = [
  // ── BILL: 청구·비용 API 조회 ───────────────────────────────────────────────
  { id: 'TC-COSTOPT-BILL-01',   domain: 'cost', feature: 'BILL',   title: 'API 호스트 조회',          status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-01-getApiHosts.spec.ts' },
  { id: 'TC-COSTOPT-BILL-02',   domain: 'cost', feature: 'BILL',   title: '당월 청구 조회',            status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-02-getCurMonthBill.spec.ts' },
  { id: 'TC-COSTOPT-BILL-03',   domain: 'cost', feature: 'BILL',   title: 'Top5 청구 조회',            status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-03-getTop5Bill.spec.ts' },
  { id: 'TC-COSTOPT-BILL-04',   domain: 'cost', feature: 'BILL',   title: '자산별 청구 조회',          status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-04-getBillAsset.spec.ts' },
  { id: 'TC-COSTOPT-IFRAME-01', domain: 'cost', feature: 'IFRAME', title: 'Cost Analysis iframe 화면', status: 'ready', channel: 'ui',  specFile: 'mc-web-console/specs/cost/TC-COST-IFRAME-cost-analysis-iframe.spec.ts' },

  // ── INIT: CUR 데이터 수집 설정 + 채널 설정 ────────────────────────────────
  { id: 'TC-COSTOPT-INIT-01', domain: 'cost', feature: 'INIT', title: 'AWS CUR 데이터 수집 설정',                      status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-02-cost-cur-init.spec.ts' },
  { id: 'TC-COSTOPT-INIT-02', domain: 'cost', feature: 'INIT', title: 'NCP CUR 데이터 수집 설정',                      status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-02-cost-cur-init.spec.ts' },
  { id: 'TC-COSTOPT-INIT-03', domain: 'cost', feature: 'INIT', title: 'Azure CUR 데이터 수집 설정',                    status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-02-cost-cur-init.spec.ts' },
  { id: 'TC-COSTOPT-INIT-04', domain: 'cost', feature: 'INIT', title: 'GCP CUR 데이터 수집 설정',                      status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-02-cost-cur-init.spec.ts' },
  { id: 'TC-COSTOPT-INIT-05', domain: 'cost', feature: 'INIT', title: '알림 채널 설정 (Gmail / Slack)',                 status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-03-cost-channel-init.spec.ts' },
  { id: 'TC-COSTOPT-INIT-06', domain: 'cost', feature: 'INIT', title: 'LLM 채널 설정',                                 status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-03-cost-channel-init.spec.ts' },

  // ── OPER: 비용 수집 알람 수신 + ML/LLM 자원 추천 ─────────────────────────
  { id: 'TC-COSTOPT-OPER-01', domain: 'cost', feature: 'OPER', title: '비용 수집 및 최적화 알람 수신',                  status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-04-cost-oper-alarm.spec.ts' },
  { id: 'TC-COSTOPT-OPER-02', domain: 'cost', feature: 'OPER', title: '덤프데이터를 통한 비용 수집 및 최적화 알람 수신', status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-04-cost-oper-alarm.spec.ts' },
  { id: 'TC-COSTOPT-OPER-03', domain: 'cost', feature: 'OPER', title: 'ML/LLM 자원 추천 (Resource Recommendation)',     status: 'todo', channel: 'ui', specFile: 'deploy/scenarios/C9-cost/C9-05-cost-oper-recommendation.spec.ts' },
];
