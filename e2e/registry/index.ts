/**
 * deploy/registry/index.ts
 * 전체 레지스트리 통합 진입점 + 조회 유틸
 *
 * 사용 예:
 *   import { findTC, listByDomain, listScenariosByCode } from '../registry';
 *   const tc = findTC('TC-INFRA-DEPLOY-05');
 *   const iamTCs = listByDomain('iam');
 *   const c4 = listScenariosByCode('C4');
 */
import type { TCEntry, ScenarioEntry, TCStatus, ScenarioStatus } from './types';

// ── TC 레지스트리 전체 import ─────────────────────────────────────────────
import { IAM_TC_REGISTRY }      from './tc/iam.registry';
import { CSP_TC_REGISTRY }      from './tc/csp.registry';
import { INFRA_TC_REGISTRY }    from './tc/infra.registry';
import { SW_TC_REGISTRY }       from './tc/sw.registry';
import { DATA_TC_REGISTRY }     from './tc/data.registry';
import { OBS_TC_REGISTRY }      from './tc/obs.registry';
import { COST_TC_REGISTRY }     from './tc/cost.registry';
import { WORKFLOW_TC_REGISTRY } from './tc/workflow.registry';
import { WORKLOAD_TC_REGISTRY } from './tc/workload.registry';

// ── 시나리오 레지스트리 import ────────────────────────────────────────────
import { SCENARIO_REGISTRY }    from './scenario/scenarios.registry';

// ── 전체 TC 목록 (도메인 순서 고정) ─────────────────────────────────────
export const ALL_TC: TCEntry[] = [
  ...IAM_TC_REGISTRY,
  ...CSP_TC_REGISTRY,
  ...INFRA_TC_REGISTRY,
  ...SW_TC_REGISTRY,
  ...DATA_TC_REGISTRY,
  ...OBS_TC_REGISTRY,
  ...COST_TC_REGISTRY,
  ...WORKFLOW_TC_REGISTRY,
  ...WORKLOAD_TC_REGISTRY,
];

export const ALL_SCENARIOS: ScenarioEntry[] = SCENARIO_REGISTRY;

// ── TC 조회 유틸 ──────────────────────────────────────────────────────────

/** TC ID로 단건 조회 */
export function findTC(id: string): TCEntry | undefined {
  return ALL_TC.find(tc => tc.id === id);
}

/** TC ID로 단건 조회 — 없으면 에러 */
export function requireTC(id: string): TCEntry {
  const tc = findTC(id);
  if (!tc) throw new Error(`[registry] TC 없음: ${id}`);
  return tc;
}

/** 도메인별 TC 목록 */
export function listByDomain(domain: string): TCEntry[] {
  return ALL_TC.filter(tc => tc.domain === domain);
}

/** 상태별 TC 목록 */
export function listByStatus(status: TCStatus): TCEntry[] {
  return ALL_TC.filter(tc => tc.status === status);
}

/** Feature 코드별 TC 목록 */
export function listByFeature(feature: string): TCEntry[] {
  return ALL_TC.filter(tc => tc.feature === feature);
}

/** 태그로 TC 목록 필터 */
export function listByTag(tag: string): TCEntry[] {
  return ALL_TC.filter(tc => tc.tags?.includes(tag));
}

/** variant가 있는 TC 목록 */
export function listVariantTCs(): TCEntry[] {
  return ALL_TC.filter(tc => tc.variants && tc.variants.length > 0);
}

// ── 시나리오 조회 유틸 ────────────────────────────────────────────────────

/** 시나리오 ID로 단건 조회 */
export function findScenario(id: string): ScenarioEntry | undefined {
  return ALL_SCENARIOS.find(s => s.id === id);
}

/** 시나리오 ID로 단건 조회 — 없으면 에러 */
export function requireScenario(id: string): ScenarioEntry {
  const s = findScenario(id);
  if (!s) throw new Error(`[registry] 시나리오 없음: ${id}`);
  return s;
}

/** 코드별 시나리오 목록 (예: 'C4') */
export function listScenariosByCode(code: string): ScenarioEntry[] {
  return ALL_SCENARIOS.filter(s => s.code === code);
}

/** 상태별 시나리오 목록 */
export function listScenariosByStatus(status: ScenarioStatus): ScenarioEntry[] {
  return ALL_SCENARIOS.filter(s => s.status === status);
}

// ── 통계 ─────────────────────────────────────────────────────────────────

export interface RegistrySummary {
  tc: {
    total:      number;
    byDomain:   Record<string, number>;
    byStatus:   Record<TCStatus, number>;
  };
  scenario: {
    total:      number;
    byCode:     Record<string, number>;
    byStatus:   Record<ScenarioStatus, number>;
  };
}

export function summary(): RegistrySummary {
  const tcByDomain: Record<string, number>   = {};
  const tcByStatus: Record<string, number>   = {};
  const scByCode:   Record<string, number>   = {};
  const scByStatus: Record<string, number>   = {};

  for (const tc of ALL_TC) {
    tcByDomain[tc.domain] = (tcByDomain[tc.domain] ?? 0) + 1;
    tcByStatus[tc.status] = (tcByStatus[tc.status] ?? 0) + 1;
  }
  for (const sc of ALL_SCENARIOS) {
    scByCode[sc.code]     = (scByCode[sc.code]     ?? 0) + 1;
    scByStatus[sc.status] = (scByStatus[sc.status] ?? 0) + 1;
  }

  return {
    tc:       { total: ALL_TC.length,       byDomain: tcByDomain, byStatus: tcByStatus as Record<TCStatus, number> },
    scenario: { total: ALL_SCENARIOS.length, byCode:   scByCode,   byStatus: scByStatus as Record<ScenarioStatus, number> },
  };
}

// ── 편의 re-export ────────────────────────────────────────────────────────
export type { TCEntry, ScenarioEntry } from './types';
export { IAM_TC_REGISTRY, CSP_TC_REGISTRY, INFRA_TC_REGISTRY,
         SW_TC_REGISTRY,  DATA_TC_REGISTRY, OBS_TC_REGISTRY,
         COST_TC_REGISTRY, WORKFLOW_TC_REGISTRY, WORKLOAD_TC_REGISTRY };
export { SCENARIO_REGISTRY };
