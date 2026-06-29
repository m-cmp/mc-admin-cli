/**
 * deploy/scenarios/shared/createScenarioSuite.ts
 * 레지스트리 기반 시나리오 spec 부트스트랩 — C4/C8 커스텀 spec 제외 공통 진입점
 */
import * as fs   from 'fs';
import * as path from 'path';
import { test, type TestInfo } from '@playwright/test';
import { requireScenario } from '../../registry';
import { ScenarioRuntimeStore } from '../../params/runtime/store';
import { loadDiscovered, saveDiscovered } from '../../params/runtime/discovered';
import { runScenarioStep } from './runScenarioStep';
import type { ScenarioStep } from '../../registry/types';

const OUT_DIR = process.env.RUN_OUTPUT_DIR
  ?? path.resolve(__dirname, '../../../deploy_result');

const RESULT_DIR = OUT_DIR;

type StepRecord = {
  order:       number;
  tcId:        string;
  variant?:    string;
  description: string;
  result:      'pass' | 'fail' | 'timeout' | 'skip';
};

export function bootstrapScenario(scenarioId: string): void {
  const entry     = requireScenario(scenarioId);
  const runtimeId = process.env.SCENARIO_ID ?? scenarioId;
  const scenarioResultDir = path.join(OUT_DIR, runtimeId);

  const store      = new ScenarioRuntimeStore(runtimeId, scenarioResultDir);
  const stepRecords: StepRecord[] = [];
  let currentStep: ScenarioStep | null = null;

  test.describe(`${entry.code}: ${entry.title}`, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeAll(() => {
      // 1. store 초기화
      store.reset();

      // 2. 이전 실행 발견값 로드 (Layer 2.5) — 이미 있는 값은 덮지 않음
      const discovered = loadDiscovered(OUT_DIR, runtimeId);
      for (const [k, v] of Object.entries(discovered)) {
        if (store.get(k) === undefined) store.set(k, v);
      }

      // 3. 레지스트리 initialStore 주입 (discovered보다 우선)
      if (entry.initialStore) {
        store.setAll(entry.initialStore);
      }

      // 4. requiredInputs 유효성 검사 — fail-fast
      if (entry.requiredInputs?.length) {
        const missing = entry.requiredInputs.filter(k => store.get(k) === undefined);
        if (missing.length > 0) {
          throw new Error(
            `[${scenarioId}] 필수 입력 파라미터 없음: ${missing.join(', ')}\n` +
            `  → PW_${missing[0]}=<값> 환경변수 또는 이전 시나리오 실행으로 제공하세요.`,
          );
        }
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${scenarioId}] 시나리오 시작 (runtime: ${runtimeId})`);
      console.log(`  actor: ${entry.actor}`);
      console.log(`  status: ${entry.status}`);
      if (entry.requiredInputs?.length) {
        console.log(`  requiredInputs: ${entry.requiredInputs.join(', ')} ✓`);
      }
      console.log('='.repeat(60));
    });

    test.afterEach(async ({}, testInfo: TestInfo) => {
      const m = testInfo.title.match(/^Step (\d+)/);
      if (!m) return;
      const order = parseInt(m[1], 10);
      const step  = steps.find(s => s.order === order);
      if (!step) return;

      let result: StepRecord['result'];
      if (testInfo.status === 'skipped') {
        result = 'skip';
      } else {
        result = testInfo.status === 'passed'   ? 'pass'
               : testInfo.status === 'timedOut' ? 'timeout'
               : 'fail';
      }

      stepRecords.push({
        order,
        tcId:        step.tcId,
        variant:     step.variant,
        description: step.description,
        result,
      });

      // 실패 시 체크포인트 저장 — 재연에 필요한 정보 보존
      if ((result === 'fail' || result === 'timeout') && currentStep) {
        store.checkpoint(
          { order: currentStep.order, tcId: currentStep.tcId },
          new Error(testInfo.error?.message ?? '알 수 없는 오류'),
        );
        console.log(`[${scenarioId}] 체크포인트 저장: Step${currentStep.order} ${currentStep.tcId}`);
      }
    });

    test.afterAll(() => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${scenarioId}] 시나리오 종료 — 런타임 파라미터:`);
      store.dump(`${scenarioId} RuntimeStore`);
      console.log('='.repeat(60));

      // 발견된 params 영속 저장 — 다음 실행 시 Layer 2.5로 재사용
      try {
        saveDiscovered(OUT_DIR, runtimeId, store.snapshot());
        console.log(`[${scenarioId}] discovered.json 저장 완료`);
      } catch (e) {
        console.error(`[${scenarioId}] discovered.json 저장 실패:`, e);
      }

      // ── deploy_result 기록 ──────────────────────────────────────────────
      try {
        fs.mkdirSync(RESULT_DIR, { recursive: true });
        const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${scenarioId}-${ts}.json`;
        const overall  = stepRecords.some(r => r.result === 'fail' || r.result === 'timeout')
          ? 'fail' : 'pass';
        const record = {
          scenarioId,
          overall,
          timestamp: new Date().toISOString(),
          store:     store.snapshot(),
          steps:     stepRecords,
        };
        fs.writeFileSync(path.join(RESULT_DIR, filename), JSON.stringify(record, null, 2));
        // latest 링크 (덮어쓰기)
        fs.writeFileSync(path.join(RESULT_DIR, `${scenarioId}-latest.json`), JSON.stringify(record, null, 2));
        console.log(`[${scenarioId}] deploy_result/${filename} 저장 완료 (overall=${overall})`);
      } catch (e) {
        console.error(`[${scenarioId}] deploy_result 저장 실패:`, e);
      }
    });

    const steps = [...entry.steps].sort((a, b) => a.order - b.order);
    for (const step of steps) {
      test(`Step ${step.order} — ${step.tcId}: ${step.description}`, async ({ page, request }) => {
        test.setTimeout(5 * 60_000);
        currentStep = step;
        try {
          await runScenarioStep({
            page,
            request,
            store,
            scenarioId: runtimeId,
            step,
          });
        } finally {
          currentStep = null;
        }
      });
    }
  });
}
