/**
 * deploy/params/types.ts
 * 파라미터 시스템 핵심 타입 정의
 *
 * 4-레이어 우선순위 (낮음 → 높음):
 *   Layer 1: base/tc/{domain}/{TC-ID}.params.ts   — 기본값, Git 커밋
 *   Layer 2: env/local.params.ts                  — .gitignore, 환경별 오버라이드
 *   Layer 3: base/scenarios/{scenario-id}.params.ts — 시나리오 내 스텝별 override
 *   Layer 4: process.env (PW_* 접두사)             — CI / 민감정보, 최고 우선순위
 */

// ── TC 기본 파라미터 ──────────────────────────────────────────────────────────

/**
 * 각 TC params 파일이 `export default` 하는 구조.
 *
 * `base`       — variant 공통 기본값
 * `variants`   — variant key → base 위에 덮어쓸 값
 *
 * @example
 *   export default {
 *     base: { nsId: 'default', mciName: 'tc-mci-temp' },
 *     variants: {
 *       'aws': { connectionName: 'aws-ap-northeast-2', commonSpec: 'aws+ap-northeast-2+t2.small' },
 *       'gcp': { connectionName: 'gcp-asia-northeast3', commonSpec: 'gcp+asia-northeast3+n1-standard-1' },
 *     },
 *   } satisfies TCParams;
 */
export interface TCParams {
  base:      Record<string, unknown>;
  variants?: Record<string, Record<string, unknown>>;
}

// ── 환경별 오버라이드 ─────────────────────────────────────────────────────────

/**
 * deploy/params/env/local.params.ts 가 `export default` 하는 구조.
 * 이 파일은 .gitignore 에 포함되어 환경별로 다르게 관리한다.
 *
 * `global`    — 모든 TC에 적용되는 전역 값 (adminId, adminPassword, baseUrl 등)
 * `tc`        — TC ID별 오버라이드
 * `scenario`  — 시나리오 ID별 오버라이드
 */
export interface EnvParams {
  env:       string;   // 예: 'local' | 'ci' | 'staging'
  global?:   Record<string, unknown>;
  tc?:       Record<string, Record<string, unknown>>;
  scenario?: Record<string, Record<string, unknown>>;
}

// ── 시나리오 정적 파라미터 ───────────────────────────────────────────────────

/**
 * deploy/params/base/scenarios/{scenario-id}.params.ts 가 `export default` 하는 구조.
 *
 * `global`  — 시나리오 전체에 적용 (모든 스텝 TC가 읽음)
 * `steps`   — TC ID → 해당 스텝에만 적용할 override
 */
export interface ScenarioStaticParams {
  global?: Record<string, unknown>;
  steps?:  Record<string, Record<string, unknown>>;
}

// ── 최종 병합 결과 ────────────────────────────────────────────────────────────

/** loadTCParams() / loadTCParamsForScenario() 가 반환하는 최종 병합된 파라미터 맵 */
export type MergedParams = Record<string, unknown>;

/** variant 선택자 — 동일 TC의 여러 케이스를 구분하는 문자열 (예: 'aws', 'ui:helm') */
export type VariantSelector = string;
