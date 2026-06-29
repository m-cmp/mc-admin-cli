/**
 * deploy/params/runtime/store.ts
 * 시나리오 런타임 IN/OUT 파라미터 스토어
 *
 * 동작 원리:
 *   - TC afterAll 에서 store.set(key, value)  → OUT param 저장
 *   - 다음 TC beforeAll 에서 store.require(key) → IN param 읽기
 *   - os.tmpdir()/scenario-runtime-{scenarioId}.json 에 파일로 지속
 *     (Playwright 워커 간 격리를 우회하기 위해 fs 사용)
 *   - resultDir 지정 시 {resultDir}/{scenarioId}/runtime-store.json 에도 동시 저장
 *     (CI 재실행·머신 재시작 후에도 런타임 상태 복구 가능)
 *
 * 모든 TC 는 PASS 또는 FAIL 만 가능하다.
 * 선행 TC 가 실패하면 store.require() 가 자동으로 throw 한다 — cascade 별도 처리 불필요.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface StoreData {
  params: Record<string, unknown>;
}

export class ScenarioRuntimeStore {
  private readonly tmpPath: string;
  private readonly resultPath: string | null;
  private data: StoreData;

  constructor(scenarioId: string, resultDir?: string) {
    this.tmpPath    = path.join(os.tmpdir(), `scenario-runtime-${scenarioId}.json`);
    this.resultPath = resultDir
      ? path.join(resultDir, 'runtime-store.json')
      : null;
    this.data = this.load();
  }

  // ── 파일 I/O ──────────────────────────────────────────────────────────────

  private load(): StoreData {
    for (const p of [this.resultPath, this.tmpPath].filter((x): x is string => x !== null)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8')) as StoreData;
      } catch { /* 없으면 다음 경로 시도 */ }
    }
    return { params: {} };
  }

  private save(): void {
    const json = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(this.tmpPath, json, 'utf8');
    if (this.resultPath) {
      fs.mkdirSync(path.dirname(this.resultPath), { recursive: true });
      fs.writeFileSync(this.resultPath, json, 'utf8');
    }
  }

  // ── 초기화 ────────────────────────────────────────────────────────────────

  /**
   * 시나리오 시작 시 스토어를 초기화한다.
   * 시나리오 spec 파일의 최상위 beforeAll 에서 호출한다.
   */
  reset(): void {
    this.data = { params: {} };
    for (const p of [this.tmpPath, this.resultPath].filter((x): x is string => x !== null)) {
      try { fs.unlinkSync(p); } catch { /* 이미 없으면 무시 */ }
    }
  }

  // ── OUT param 설정 ────────────────────────────────────────────────────────

  /** TC afterAll 에서 호출: OUT param 하나 저장 */
  set(key: string, value: unknown): void {
    this.data.params[key] = value;
    this.save();
  }

  /** TC afterAll 에서 호출: 여러 OUT param 한꺼번에 저장 */
  setAll(pairs: Record<string, unknown>): void {
    Object.assign(this.data.params, pairs);
    this.save();
  }

  // ── IN param 읽기 ─────────────────────────────────────────────────────────

  /** 키 조회 — 없으면 undefined */
  get<T = unknown>(key: string): T | undefined {
    return this.data.params[key] as T | undefined;
  }

  /**
   * 키 조회 — 없으면 에러 throw
   * 앞 단계 TC가 반드시 실행되었을 때 사용한다.
   */
  require<T = unknown>(key: string): T {
    const val = this.get<T>(key);
    if (val === undefined) {
      throw new Error(
        `[ScenarioRuntimeStore] 필수 런타임 파라미터가 없습니다: "${key}"\n` +
        `  → 이전 TC 가 FAIL 하거나 set("${key}", ...) 를 호출하지 않았습니다.`,
      );
    }
    return val;
  }

  /** 키 조회 — 없으면 fallback 반환 */
  getOrDefault<T = unknown>(key: string, fallback: T): T {
    const val = this.get<T>(key);
    return val !== undefined ? val : fallback;
  }

  // ── 이전 실행 값 로드 ─────────────────────────────────────────────────────

  /**
   * 이전 실행에서 저장된 discovered.json 을 store에 주입한다.
   * 이미 store에 값이 있는 키는 덮지 않는다 (initialStore 우선).
   */
  loadDiscovered(discoveredFilePath: string): void {
    try {
      const raw = JSON.parse(fs.readFileSync(discoveredFilePath, 'utf8')) as Record<string, unknown>;
      for (const [k, v] of Object.entries(raw)) {
        if (this.get(k) === undefined) {
          this.data.params[k] = v;
        }
      }
      this.save();
    } catch { /* 이전 실행 없으면 무시 */ }
  }

  // ── 실패 체크포인트 ───────────────────────────────────────────────────────

  /**
   * TC 실패 시 체크포인트를 저장한다.
   * 저장 경로: {resultDir}/checkpoint.json
   * 재연 시 이 파일로 어느 스텝에서 어떤 파라미터로 실패했는지 확인한다.
   */
  checkpoint(step: { order: number; tcId: string }, error: Error): void {
    if (!this.resultPath) return;
    const data = {
      failedAt:      step,
      storeSnapshot: this.snapshot(),
      error:         error.message,
      timestamp:     new Date().toISOString(),
    };
    const p = path.join(path.dirname(this.resultPath), 'checkpoint.json');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  }

  // ── 디버그 / 요약 ─────────────────────────────────────────────────────────

  /** 시나리오 종료 시 스토어 내용을 콘솔에 출력 */
  dump(label = 'ScenarioRuntimeStore'): void {
    console.log(`\n── ${label} ──────────────────────────`);
    console.log('  params:', JSON.stringify(this.data.params, null, 4));
    console.log('────────────────────────────────────────\n');
  }

  /** 현재 params 스냅샷 (읽기 전용 복사본) */
  snapshot(): Record<string, unknown> {
    return { ...this.data.params };
  }
}
