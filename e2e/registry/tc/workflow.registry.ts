/**
 * deploy/registry/tc/workflow.registry.ts
 * WORKFLOW 도메인 TC 전체 목록 (14개)
 *
 * Feature 코드:
 *   WF-FLOW  — 워크플로우 Engine 연동·목록·생성·수정·실행·삭제·로그
 *   WF-EL    — 이벤트 리스너 목록·생성·중복검사·수정·삭제·GET/POST 트리거
 *
 * 엑셀 TC ID 매핑 (Excel mc-workflow-manager 기준):
 *   TC-WF-FLOW-01 ← Workflow Engine(Jenkins) 등록·연동 확인
 *   TC-WF-FLOW-02 ← 구 TC-WORKFLOW-01 (목록 조회)
 *   TC-WF-FLOW-03 ← 구 TC-WORKFLOW-02 (API 생성) + 구 TC-WF-FLOW-02 (UI 생성 A)
 *   TC-WF-FLOW-04 ← Workflow 상세 수정
 *   TC-WF-FLOW-05 ← 구 TC-WORKFLOW-04 (삭제)
 *   TC-WF-FLOW-06 ← 구 TC-WORKFLOW-03 (실행 — 콘솔 RUN 버튼)
 *   TC-WF-FLOW-07 ← Workflow 로그 모달 표시
 *   TC-WF-EL-01   ← 구 TC-WORKFLOW-EL-01 (Event Listener 목록)
 *   TC-WF-EL-02   ← 구 TC-WORKFLOW-EL-02 (Event Listener 생성·워크플로우 연결)
 *   TC-WF-EL-03   ← Event Listener 이름 중복 검사
 *   TC-WF-EL-04   ← Event Listener 상세 수정
 *   TC-WF-EL-05   ← Event Listener 삭제
 *   TC-WF-EL-06   ← 구 TC-WORKFLOW-EL-05 (GET Trigger URL로 워크플로우 실행)
 *   TC-WF-EL-07   ← 구 TC-WORKFLOW-EL-06 (POST Trigger URL로 워크플로우 실행)
 */
import type { TCEntry } from '../types';

export const WORKFLOW_TC_REGISTRY: TCEntry[] = [

  // ── WF-FLOW ──────────────────────────────────────────────────────────────
  {
    id: 'TC-WF-FLOW-01',
    domain: 'workflow', feature: 'WF-FLOW',
    title: 'Workflow Engine(Jenkins) 등록 및 연동 확인',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-FLOW-02',
    domain: 'workflow', feature: 'WF-FLOW',
    title: 'Workflow 목록 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-01-list-workflows.spec.ts',
  },
  {
    id: 'TC-WF-FLOW-03',
    domain: 'workflow', feature: 'WF-FLOW',
    title: '신규 Workflow 생성 (정의)',
    status: 'ready', channel: 'api+ui',
    variants: [
      { key: 'api', channel: 'api', specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-02-create-workflow.spec.ts' },
      { key: 'ui',  channel: 'ui',  specFile: 'mc-web-console/specs/workflow/TC-WF-FLOW-02-신규-workflow-생성-a-인프라-배포-sw-설치.spec.ts' },
    ],
  },
  {
    id: 'TC-WF-FLOW-04',
    domain: 'workflow', feature: 'WF-FLOW',
    title: 'Workflow 상세 수정',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-FLOW-05',
    domain: 'workflow', feature: 'WF-FLOW',
    title: 'Workflow 삭제',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-04-delete-workflow.spec.ts',
  },
  {
    id: 'TC-WF-FLOW-06',
    domain: 'workflow', feature: 'WF-FLOW',
    title: 'Workflow 실행 (RUN) — 콘솔 RUN 버튼',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-03-run-workflow.spec.ts',
  },
  {
    id: 'TC-WF-FLOW-07',
    domain: 'workflow', feature: 'WF-FLOW',
    title: 'Workflow 로그 모달 표시',
    status: 'ready', channel: 'ui',
  },

  // ── WF-EL (Event Listener) ────────────────────────────────────────────────
  {
    id: 'TC-WF-EL-01',
    domain: 'workflow', feature: 'WF-EL',
    title: 'Event Listener 목록 조회',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-EL-02',
    domain: 'workflow', feature: 'WF-EL',
    title: '신규 Event Listener 생성',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-EL-03',
    domain: 'workflow', feature: 'WF-EL',
    title: 'Event Listener 이름 중복 검사',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-EL-04',
    domain: 'workflow', feature: 'WF-EL',
    title: 'Event Listener 상세 수정',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-EL-05',
    domain: 'workflow', feature: 'WF-EL',
    title: 'Event Listener 삭제',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-EL-06',
    domain: 'workflow', feature: 'WF-EL',
    title: 'Event Listener를 통한 Workflow 실행 (GET)',
    status: 'ready', channel: 'ui',
  },
  {
    id: 'TC-WF-EL-07',
    domain: 'workflow', feature: 'WF-EL',
    title: 'Event Listener를 통한 Workflow 실행 (POST)',
    status: 'ready', channel: 'ui',
  },
];
