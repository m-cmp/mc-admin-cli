/**
 * deploy/params/loader.ts
 * 4-레이어 파라미터 로더
 *
 * 우선순위 (낮음 → 높음):
 *   Layer 1: deploy/params/base/tc/{domain}/{TC-ID}.params.ts   (기본값, 커밋)
 *   Layer 2: deploy/params/env/local.params.ts                   (.gitignore, 환경별)
 *   Layer 3: deploy/params/base/scenarios/{scenario-id}.params.ts (시나리오 스텝 override)
 *   Layer 4: process.env 의 PW_* 접두사 키                        (CI/민감정보, 최고 우선순위)
 *
 * process.env 매핑 예:
 *   PW_adminId=mcmp        → params.adminId = 'mcmp'
 *   PW_adminPassword=...   → params.adminPassword = '...'
 *   PW_connectionName=aws-ap-northeast-2 → params.connectionName = '...'
 */
import * as path from 'path';
import type { TCParams, EnvParams, ScenarioStaticParams, MergedParams, VariantSelector } from './types';

// ── 도메인 매핑 ─────────────────────────────────────────────────────────────
// TC ID의 두 번째 세그먼트(TC-{SEG}-...) → params 파일 폴더명
const DOMAIN_MAP: Record<string, string> = {
  IAM:      'iam',
  CSP:      'csp',
  INFRA:    'infra',
  APP:      'sw',       // TC-APP-* → params/base/tc/sw/
  DATA:     'data',
  OBS:      'obs',
  COST:     'cost',
  COSTOPT:  'cost',    // TC-COSTOPT-* → params/base/tc/cost/
  WF:       'workflow',
  WORKFLOW: 'workflow',
  WORKLOAD: 'workload',
};

/** TC ID → params 폴더명 */
export function domainOf(tcId: string): string {
  const parts   = tcId.split('-');      // ['TC', 'IAM', 'AUTH', '01', ...]
  const segment = parts[1] ?? '';
  return DOMAIN_MAP[segment] ?? segment.toLowerCase();
}

// params 루트: deploy/params/
const PARAMS_ROOT = path.resolve(__dirname);

// ── 동적 require 헬퍼 ────────────────────────────────────────────────────────

function tryRequire<T>(absPath: string): T | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(absPath) as T;
  } catch {
    return undefined;
  }
}

// ── Layer 1: base TC params ──────────────────────────────────────────────────

function loadTCBaseParams(tcId: string, variant?: VariantSelector): MergedParams {
  const domain   = domainOf(tcId);
  const filePath = path.join(PARAMS_ROOT, 'base', 'tc', domain, `${tcId}.params`);
  const mod      = tryRequire<{ default: TCParams }>(filePath);
  if (!mod) return {};

  const base = { ...(mod.default.base ?? {}) };
  if (variant && mod.default.variants?.[variant]) {
    return { ...base, ...mod.default.variants[variant] };
  }
  return base;
}

// ── Layer 2: env params ──────────────────────────────────────────────────────

let _envParamsCache: EnvParams | null | undefined = undefined;

function loadEnvParams(): EnvParams | undefined {
  if (_envParamsCache !== undefined) return _envParamsCache ?? undefined;
  const filePath = path.join(PARAMS_ROOT, 'env', 'local.params');
  const mod      = tryRequire<{ default: EnvParams }>(filePath);
  _envParamsCache = mod?.default ?? null;
  return mod?.default;
}

// ── Layer 3: scenario static params ─────────────────────────────────────────

function loadScenarioStaticParams(scenarioId: string, tcId: string): MergedParams {
  const filePath = path.join(PARAMS_ROOT, 'base', 'scenarios', `${scenarioId}.params`);
  const mod      = tryRequire<{ default: ScenarioStaticParams }>(filePath);
  if (!mod) return {};

  return {
    ...(mod.default.global            ?? {}),
    ...(mod.default.steps?.[tcId]     ?? {}),
  };
}

// ── Layer 4: process.env (PW_* 접두사) ──────────────────────────────────────

function extractProcessEnv(): MergedParams {
  const result: MergedParams = {};
  for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith('PW_') && val !== undefined) {
      // PW_adminId → adminId
      result[key.slice(3)] = val;
    }
  }
  return result;
}

// ── public API ───────────────────────────────────────────────────────────────

/**
 * TC 단독 실행용 파라미터 로드 (Layer 1 + 2 + 4)
 *
 * @param tcId    TC ID (예: 'TC-IAM-AUTH-01')
 * @param variant variant 키 (예: 'aws', 'ui:helm') — 없으면 base만
 */
export function loadTCParams(tcId: string, variant?: VariantSelector): MergedParams {
  const layer1      = loadTCBaseParams(tcId, variant);
  const envParams   = loadEnvParams();
  const layer2glob  = envParams?.global         ?? {};
  const layer2tc    = envParams?.tc?.[tcId]     ?? {};
  const layer4      = extractProcessEnv();

  return { ...layer1, ...layer2glob, ...layer2tc, ...layer4 };
}

/**
 * 시나리오 내 TC 파라미터 로드 (Layer 1 + 2 + 3 + 4)
 *
 * @param tcId       TC ID
 * @param scenarioId 시나리오 ID (예: 'C4-001')
 * @param variant    variant 키
 */
export function loadTCParamsForScenario(
  tcId:       string,
  scenarioId: string,
  variant?:   VariantSelector,
): MergedParams {
  const layer1      = loadTCBaseParams(tcId, variant);
  const envParams   = loadEnvParams();
  const layer2glob  = envParams?.global             ?? {};
  const layer2tc    = envParams?.tc?.[tcId]         ?? {};
  const layer3      = loadScenarioStaticParams(scenarioId, tcId);
  const layer4      = extractProcessEnv();

  return { ...layer1, ...layer2glob, ...layer2tc, ...layer3, ...layer4 };
}
