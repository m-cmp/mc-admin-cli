/**
 * deploy/registry/tc/data.registry.ts
 * DATA 도메인 TC 전체 목록 (mc-data-manager)
 *
 * Feature 코드:
 *   OS    — Object Storage CRUD (01~04)
 *   RDB   — RDBMS CRUD (01~04, BAK, MIG)
 *   NORDB — NoRDBMS (BAK, MIG)
 *   NRDB  — NoRDBMS CRUD (01~04)
 *   OBJ   — Object Storage (BAK, MIG)
 *   UI    — 포털 iframe UI (01~06)
 *
 * spec 파일 위치: deploy/tc/data/
 */
import type { TCEntry } from '../types';

export const DATA_TC_REGISTRY: TCEntry[] = [

  // ── Object Storage CRUD (4) ──────────────────────────────────────────────
  { id: 'TC-DATA-OS-01', domain: 'data', feature: 'OS', title: 'Object Storage 생성', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-OS-01-04.spec.ts' },
  { id: 'TC-DATA-OS-02', domain: 'data', feature: 'OS', title: 'Object Storage 마이그레이션', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-OS-01-04.spec.ts' },
  { id: 'TC-DATA-OS-03', domain: 'data', feature: 'OS', title: 'Object Storage 백업', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-OS-01-04.spec.ts' },
  { id: 'TC-DATA-OS-04', domain: 'data', feature: 'OS', title: 'Object Storage 복원', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-OS-01-04.spec.ts' },

  // ── OBJ (2) ──────────────────────────────────────────────────────────────
  { id: 'TC-DATA-OBJ-MIG-01', domain: 'data', feature: 'OBJ', title: 'Object Storage 마이그레이션 (상세)', status: 'ready', channel: 'api+ui', specFile: 'deploy/tc/data/TC-DATA-OBJ-MIG-01.spec.ts' },
  { id: 'TC-DATA-OBJ-BAK-01', domain: 'data', feature: 'OBJ', title: 'Object Storage 백업 (상세)', status: 'ready', channel: 'api+ui', specFile: 'deploy/tc/data/TC-DATA-OBJ-BAK-01.spec.ts' },

  // ── RDB — CRUD (4) ───────────────────────────────────────────────────────
  { id: 'TC-DATA-RDB-01', domain: 'data', feature: 'RDB', title: 'RDBMS 데이터 생성 (Generate)', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-RDB-01-04.spec.ts' },
  { id: 'TC-DATA-RDB-02', domain: 'data', feature: 'RDB', title: 'RDBMS 마이그레이션', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-RDB-01-04.spec.ts' },
  { id: 'TC-DATA-RDB-03', domain: 'data', feature: 'RDB', title: 'RDBMS 백업', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-RDB-01-04.spec.ts' },
  { id: 'TC-DATA-RDB-04', domain: 'data', feature: 'RDB', title: 'RDBMS 복원', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-RDB-01-04.spec.ts' },

  // ── RDB — 상세 (2) ───────────────────────────────────────────────────────
  { id: 'TC-DATA-RDB-BAK-01', domain: 'data', feature: 'RDB', title: 'RDBMS 백업 (상세)', status: 'ready', channel: 'api+ui', specFile: 'deploy/tc/data/TC-DATA-RDB-BAK-01.spec.ts' },
  { id: 'TC-DATA-RDB-MIG-01', domain: 'data', feature: 'RDB', title: 'RDBMS 마이그레이션 (상세)', status: 'ready', channel: 'api+ui', specFile: 'deploy/tc/data/TC-DATA-RDB-MIG-01.spec.ts' },

  // ── NRDB — CRUD (4) ──────────────────────────────────────────────────────
  { id: 'TC-DATA-NRDB-01', domain: 'data', feature: 'NRDB', title: 'NoRDBMS 데이터 생성 (Generate)', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-NRDB-01-04.spec.ts' },
  { id: 'TC-DATA-NRDB-02', domain: 'data', feature: 'NRDB', title: 'NoRDBMS 마이그레이션', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-NRDB-01-04.spec.ts' },
  { id: 'TC-DATA-NRDB-03', domain: 'data', feature: 'NRDB', title: 'NoRDBMS 백업', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-NRDB-01-04.spec.ts' },
  { id: 'TC-DATA-NRDB-04', domain: 'data', feature: 'NRDB', title: 'NoRDBMS 복원', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-NRDB-01-04.spec.ts' },

  // ── NORDB — 상세 (2) ─────────────────────────────────────────────────────
  { id: 'TC-DATA-NORDB-BAK-01', domain: 'data', feature: 'NORDB', title: 'NoRDBMS 백업 (상세)', status: 'ready', channel: 'api+ui', specFile: 'deploy/tc/data/TC-DATA-NORDB-BAK-01.spec.ts' },
  { id: 'TC-DATA-NORDB-MIG-01', domain: 'data', feature: 'NORDB', title: 'NoRDBMS 마이그레이션 (상세)', status: 'ready', channel: 'api+ui', specFile: 'deploy/tc/data/TC-DATA-NORDB-MIG-01.spec.ts' },

  // ── UI — 포털 iframe (6) ─────────────────────────────────────────────────
  { id: 'TC-DATA-UI-01', domain: 'data', feature: 'UI', title: 'Data Migration 페이지 로드 및 iframe 초기화', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-UI.spec.ts' },
  { id: 'TC-DATA-UI-02', domain: 'data', feature: 'UI', title: 'Nav 탭 Navigation', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-UI.spec.ts' },
  { id: 'TC-DATA-UI-03', domain: 'data', feature: 'UI', title: 'Service 탭 전환', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-UI.spec.ts' },
  { id: 'TC-DATA-UI-04', domain: 'data', feature: 'UI', title: 'Object Storage Migration 태스크 목록', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-UI.spec.ts' },
  { id: 'TC-DATA-UI-05', domain: 'data', feature: 'UI', title: 'Generate 페이지', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-UI.spec.ts' },
  { id: 'TC-DATA-UI-06', domain: 'data', feature: 'UI', title: 'Back up / Restore 등록 페이지', status: 'ready', channel: 'ui', specFile: 'deploy/tc/data/TC-DATA-UI.spec.ts' },
];
