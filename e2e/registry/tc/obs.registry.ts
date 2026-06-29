/**
 * deploy/registry/tc/obs.registry.ts
 * OBS(Observability) 도메인 TC 전체 목록
 *
 * Feature 코드:
 *   AGENT   — Node 조회·에이전트 설치·상태폴링·플러그인·제거 (C6-01)
 *   METRIC  — 시계열/CSP/K8s/오버뷰 메트릭 조회 (C6-02)
 *   INSIGHT — Anomaly Detection·History·Prediction·LLM 분석 (C6-03)
 *   LOG     — 라벨 조회·LogQL 키워드 검색 (C6-04)
 *   TRACE   — Trace 검색·상세·iframe 임베드 (C6-05)
 *   TRIG    — Trigger Policy 생성/목록/삭제·타겟연결·채널·히스토리·수정 (C6-06)
 *   IFRAME  — 콘솔 iframe 임베드 (C6-07)
 */
import type { TCEntry } from '../types';

export const OBS_TC_REGISTRY: TCEntry[] = [
  // ── C6-01: Agent 관리 ──────────────────────────────────────────────────────
  { id: 'TC-OBS-AGENT-01', domain: 'obs', feature: 'AGENT', title: '모니터링 등록 가능 Node 조회(Config)', status: 'ready',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-AGENT-01-list-agent-nodes.spec.ts' },
  { id: 'TC-OBS-AGENT-02', domain: 'obs', feature: 'AGENT', title: '모니터링 에이전트 설치',               status: 'ready',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-MON-CONFIG-02-install-monitoring-agent.spec.ts' },
  { id: 'TC-OBS-AGENT-03', domain: 'obs', feature: 'AGENT', title: 'Agent 설치 상태 폴링',                status: 'todo',   channel: 'api',    specFile: 'mc-web-console/specs/obs/TC-OBS-AGENT-03-agent-status-poll.spec.ts' },
  { id: 'TC-OBS-AGENT-04', domain: 'obs', feature: 'AGENT', title: '모니터링 플러그인(item) 등록',         status: 'todo',   channel: 'api',    specFile: 'mc-web-console/specs/obs/TC-OBS-AGENT-04-register-plugin.spec.ts' },
  { id: 'TC-OBS-AGENT-05', domain: 'obs', feature: 'AGENT', title: 'Agent 제거',                         status: 'todo',   channel: 'api',    specFile: 'mc-web-console/specs/obs/TC-OBS-AGENT-05-delete-agent.spec.ts' },

  // ── C6-02: Metric 조회 ─────────────────────────────────────────────────────
  { id: 'TC-OBS-METRIC-01', domain: 'obs', feature: 'METRIC', title: 'Agent 시계열 메트릭(InfluxDB)',  status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-METRIC-01-agent-timeseries.spec.ts' },
  { id: 'TC-OBS-METRIC-02', domain: 'obs', feature: 'METRIC', title: 'CSP API 메트릭(cb-spider)',     status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-METRIC-02-csp-api-metrics.spec.ts' },
  { id: 'TC-OBS-METRIC-03', domain: 'obs', feature: 'METRIC', title: 'K8s Cluster 노드 메트릭',       status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-METRIC-03-k8s-node-metrics.spec.ts' },
  { id: 'TC-OBS-METRIC-04', domain: 'obs', feature: 'METRIC', title: 'Infra / NS 레벨 오버뷰',        status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-METRIC-04-infra-ns-overview.spec.ts' },

  // ── C6-03: Insight 분석 ────────────────────────────────────────────────────
  { id: 'TC-OBS-INSIGHT-01', domain: 'obs', feature: 'INSIGHT', title: 'Anomaly Detection 설정',      status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-INSIGHT-01-anomaly-detection-config.spec.ts' },
  { id: 'TC-OBS-INSIGHT-02', domain: 'obs', feature: 'INSIGHT', title: 'Anomaly History 조회',        status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-INSIGHT-02-anomaly-history.spec.ts' },
  { id: 'TC-OBS-INSIGHT-03', domain: 'obs', feature: 'INSIGHT', title: 'Prediction(예측)',            status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-INSIGHT-03-prediction.spec.ts' },
  { id: 'TC-OBS-INSIGHT-04', domain: 'obs', feature: 'INSIGHT', title: 'Server Error Analysis(LLM)', status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-INSIGHT-04-server-error-analysis.spec.ts' },

  // ── C6-04: Log 조회 ────────────────────────────────────────────────────────
  { id: 'TC-OBS-LOG-01', domain: 'obs', feature: 'LOG', title: '라벨 조회',          status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-LOG-01-list-logs.spec.ts' },
  { id: 'TC-OBS-LOG-02', domain: 'obs', feature: 'LOG', title: '키워드 검색(LogQL)', status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-LOG-02-logql-search.spec.ts' },

  // ── C6-05: Trace 조회 ──────────────────────────────────────────────────────
  { id: 'TC-OBS-TRACE-01', domain: 'obs', feature: 'TRACE', title: 'Trace 검색(Tempo)',          status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-TRACE-01-list-traces.spec.ts' },
  { id: 'TC-OBS-TRACE-02', domain: 'obs', feature: 'TRACE', title: 'Trace 상세 / Call Sequence', status: 'todo',  channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-TRACE-02-trace-detail.spec.ts' },
  { id: 'TC-OBS-TRACE-03', domain: 'obs', feature: 'TRACE', title: 'Trace iframe 임베드',        status: 'todo',  channel: 'ui',     specFile: 'mc-web-console/specs/obs/TC-OBS-TRACE-03-trace-iframe.spec.ts' },

  // ── C6-06: Trigger 관리 ────────────────────────────────────────────────────
  { id: 'TC-OBS-TRIG-01', domain: 'obs', feature: 'TRIG', title: 'Trigger Policy 생성/목록/삭제',   status: 'todo', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-TRIG-01-trigger-policy-crud.spec.ts' },
  { id: 'TC-OBS-TRIG-02', domain: 'obs', feature: 'TRIG', title: '정책 ↔ Node/Infra 타겟 연결',    status: 'todo', channel: 'api',    specFile: 'mc-web-console/specs/obs/TC-OBS-TRIG-02-policy-target-link.spec.ts' },
  { id: 'TC-OBS-TRIG-03', domain: 'obs', feature: 'TRIG', title: '알림 채널 설정',                 status: 'todo', channel: 'api',    specFile: 'mc-web-console/specs/obs/TC-OBS-TRIG-03-notify-channel.spec.ts' },
  { id: 'TC-OBS-TRIG-04', domain: 'obs', feature: 'TRIG', title: 'Trigger / Notification History', status: 'todo', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-TRIG-04-trigger-history.spec.ts' },
  { id: 'TC-OBS-TRIG-05', domain: 'obs', feature: 'TRIG', title: '정책 수정(임계값 등)',            status: 'todo', channel: 'api',    specFile: 'mc-web-console/specs/obs/TC-OBS-TRIG-05-policy-update.spec.ts' },

  // ── C6-07: iframe 임베드 ───────────────────────────────────────────────────
  { id: 'TC-OBS-IFRAME-01', domain: 'obs', feature: 'IFRAME', title: '콘솔 iframe 진입(임베드)', status: 'todo', channel: 'ui', specFile: 'mc-web-console/specs/obs/TC-OBS-IFRAME-01-console-iframe.spec.ts' },
];
