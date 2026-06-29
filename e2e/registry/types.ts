/**
 * deploy/registry/types.ts
 *
 * TC 레지스트리 및 시나리오 레지스트리에서 사용하는 공통 타입 정의.
 *
 * 사용처:
 *   - deploy/registry/tc/*.registry.ts   — 도메인별 TC 목록
 *   - deploy/registry/scenario/          — 시나리오 목록
 *   - deploy/registry/index.ts           — 전체 조회 유틸
 */

// ── TC 상태 ─────────────────────────────────────────────────────────────────
/** ready    : 구현 완료, 실행 가능
 *  wip      : 작업 중 (구현 진행 중) — 실행 시 FAIL
 *  todo     : 구현 예정 (spec 파일 없음) — 실행 시 FAIL
 *  deprecated: 더 이상 사용하지 않음
 */
export type TCStatus = 'ready' | 'wip' | 'todo' | 'deprecated';

// ── TC 채널 ─────────────────────────────────────────────────────────────────
/** api    : API(request) 테스트만
 *  ui     : 브라우저(page) 테스트만
 *  api+ui : 같은 TC 파일에 API + UI 테스트 모두 포함
 */
export type TCChannel = 'api' | 'ui' | 'api+ui';

// ── Variant ─────────────────────────────────────────────────────────────────
export type VariantKey = string;

/** 같은 TC ID이지만 variant별로 spec 파일이 다른 경우 */
export interface TCVariantFile {
  key: VariantKey;      // 'helm' | 'docker' | 'aws' | 'ui' | 'api' …
  specFile: string;     // repo root 기준 상대 경로
  channel?: TCChannel;  // variant마다 채널이 다를 경우 override
}

// ── TC 엔트리 ────────────────────────────────────────────────────────────────
export interface TCEntry {
  /** TC 식별자 — 파일명의 TC-{DOMAIN}-{FEATURE}-{NN} 부분 */
  id: string;
  /** 도메인 폴더명 (iam, infra, sw, data, obs, csp, cost, workflow, workload) */
  domain: string;
  /** 기능 코드 (AUTH, MCI, APP-REP …) */
  feature: string;
  /** 한 줄 설명 */
  title: string;
  /** 구현 상태 */
  status: TCStatus;
  /** 테스트 채널 */
  channel: TCChannel;
  /**
   * variant 없는 TC — 단일 spec 파일 경로
   * variants 있는 TC — 이 필드 대신 variants[] 사용
   */
  specFile?: string;
  /**
   * 같은 TC ID가 여러 variant 파일로 나뉜 경우
   * 예: TC-APP-REP-02 → api / ui:helm / ui:docker
   */
  variants?: TCVariantFile[];
  /** wip/todo 이유 및 이슈 트래커 번호 */
  note?: {
    reason: string;
    issue?: string;   // 예: 'ISSUE-009'
  };
  /** 검색·필터용 태그 (선택) */
  tags?: string[];
}

// ── 시나리오 상태 ────────────────────────────────────────────────────────────
/** ready   : 전체 스텝 실행 가능
 *  partial : 일부 스텝만 ready (나머지 wip/todo — 실행 시 FAIL)
 *  wip     : 작업 중
 *  todo    : 구현 예정
 *  deprecated: 더 이상 사용하지 않음
 */
export type ScenarioStatus = 'ready' | 'partial' | 'wip' | 'todo' | 'deprecated';

// ── 시나리오 스텝 ────────────────────────────────────────────────────────────
export interface ScenarioStep {
  /** 실행 순서 (1부터 시작) */
  order: number;
  /** 호출할 TC ID */
  tcId: string;
  /** TC의 어떤 variant를 사용할지 (미지정 = base) */
  variant?: VariantKey;
  /** 이 스텝에서 실행할 채널 (미지정 = TC 기본값) */
  channel?: TCChannel;
  /** 스텝 구현 상태 */
  status: TCStatus;
  /** 사람이 읽을 수 있는 스텝 설명 */
  description: string;
  /** wip/todo 이유 */
  note?: {
    reason: string;
    issue?: string;
  };
  /** 이 스텝이 RuntimeStore에 저장하는 key 목록 (문서화·검증용) */
  outputParams?: string[];
}

// ── 시나리오 엔트리 ──────────────────────────────────────────────────────────
export interface ScenarioEntry {
  /** 시나리오 식별자 — 예: 'C4-service-create-infra' */
  id: string;
  /** 시나리오 코드 분류 — 예: 'C2', 'C4', 'WF' */
  code: string;
  /** 한 줄 제목 */
  title: string;
  /** 시나리오 목적·범위 설명 */
  description: string;
  /** 전체 시나리오 상태 */
  status: ScenarioStatus;
  /** 이 시나리오를 수행하는 페르소나 (선택) */
  actor?: string;
  /** spec 파일 경로 (선택 — 없으면 TC를 직접 순서대로 호출) */
  specFile?: string;
  /** 순서가 있는 스텝 목록 */
  steps: ScenarioStep[];
  /** 시나리오 시작 시 RuntimeStore에 사전 주입할 값 (TC의 getOrDefault 기본값 override) */
  initialStore?: Record<string, unknown>;
  /**
   * 시나리오 시작 전 RuntimeStore에 반드시 있어야 하는 key 목록.
   * 없으면 beforeAll에서 즉시 FAIL (fail-fast).
   * 이전 시나리오가 생성한 값 또는 PW_<KEY>=<값> 환경변수로 제공.
   */
  requiredInputs?: string[];
}
