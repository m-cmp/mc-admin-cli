/**
 * deploy/params/runtime/context.ts
 * 시나리오 실행 컨텍스트 — 정적 파라미터 + 런타임 스토어 통합
 *
 * 두 가지 컨텍스트를 제공한다:
 *
 *   ScenarioContext  — 시나리오 내에서 TC를 실행할 때 사용
 *                      (4-레이어 정적 params + 런타임 store 모두 활성화)
 *
 *   StandaloneContext — TC를 독립 실행할 때 사용
 *                       (Layer 1+2+4 정적 params만, store 없음)
 *
 * 사용 예 (시나리오 TC 파일):
 *
 *   import { ScenarioContext } from '../../deploy/params/runtime/context';
 *
 *   const ctx = new ScenarioContext('C4-001', 'TC-INFRA-DEPLOY-05');
 *
 *   test.afterAll(async () => {
 *     ctx.store.set('mciId', createdMciId);
 *     ctx.store.set('mciName', ctx.params.mciName as string);
 *   });
 *
 * 사용 예 (독립 실행 TC 파일):
 *
 *   import { StandaloneContext } from '../../deploy/params/runtime/context';
 *
 *   const ctx = new StandaloneContext('TC-INFRA-DEPLOY-05', 'aws');
 *   const nsId = ctx.require<string>('nsId');
 */
import { ScenarioRuntimeStore }                     from './store';
import { loadTCParams, loadTCParamsForScenario }    from '../loader';
import type { MergedParams, VariantSelector }        from '../types';

// ── ScenarioContext ───────────────────────────────────────────────────────────

export class ScenarioContext {
  readonly scenarioId: string;
  readonly tcId:       string;
  readonly variant:    VariantSelector | undefined;
  /** 4-레이어 병합된 정적 파라미터 */
  readonly params:     MergedParams;
  /** 시나리오 런타임 IN/OUT 스토어 */
  readonly store:      ScenarioRuntimeStore;

  constructor(scenarioId: string, tcId: string, variant?: VariantSelector) {
    this.scenarioId = scenarioId;
    this.tcId       = tcId;
    this.variant    = variant;
    this.params     = loadTCParamsForScenario(tcId, scenarioId, variant);
    this.store      = new ScenarioRuntimeStore(scenarioId);
  }

  /** 정적 params에서 값 읽기 — 없으면 undefined */
  get<T = unknown>(key: string): T | undefined {
    return this.params[key] as T | undefined;
  }

  /** 정적 params에서 값 읽기 — 없으면 에러 throw */
  require<T = unknown>(key: string): T {
    const val = this.get<T>(key);
    if (val === undefined) {
      throw new Error(
        `[ScenarioContext] 필수 정적 파라미터 없음: "${key}" (scenario: ${this.scenarioId}, tc: ${this.tcId})`,
      );
    }
    return val;
  }

  /** 정적 params에서 값 읽기 — 없으면 fallback */
  getOrDefault<T = unknown>(key: string, fallback: T): T {
    const val = this.get<T>(key);
    return val !== undefined ? val : fallback;
  }
}

// ── StandaloneContext ─────────────────────────────────────────────────────────

/** TC 독립 실행용 컨텍스트 (시나리오 없음, store 없음) */
export class StandaloneContext {
  readonly tcId:   string;
  readonly variant: VariantSelector | undefined;
  /** Layer 1 + 2 + 4 병합된 정적 파라미터 */
  readonly params: MergedParams;

  constructor(tcId: string, variant?: VariantSelector) {
    this.tcId    = tcId;
    this.variant = variant;
    this.params  = loadTCParams(tcId, variant);
  }

  /** params에서 값 읽기 — 없으면 undefined */
  get<T = unknown>(key: string): T | undefined {
    return this.params[key] as T | undefined;
  }

  /** params에서 값 읽기 — 없으면 에러 throw */
  require<T = unknown>(key: string): T {
    const val = this.get<T>(key);
    if (val === undefined) {
      throw new Error(
        `[StandaloneContext] 필수 파라미터 없음: "${key}" (tc: ${this.tcId})`,
      );
    }
    return val;
  }

  /** params에서 값 읽기 — 없으면 fallback */
  getOrDefault<T = unknown>(key: string, fallback: T): T {
    const val = this.get<T>(key);
    return val !== undefined ? val : fallback;
  }
}
