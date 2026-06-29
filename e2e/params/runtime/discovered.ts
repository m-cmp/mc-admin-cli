/**
 * deploy/params/runtime/discovered.ts
 * 시나리오 실행 중 발견된 파라미터의 영속 관리 (Layer 2.5)
 *
 * 저장 경로: {outDir}/{scenarioId}/discovered.json
 * - 시나리오 완료(afterAll) 시 store 스냅샷 전체를 저장한다.
 * - 다음 실행 beforeAll에서 로드하여 store에 주입한다 (이미 있는 값은 덮지 않음).
 * - 용도: mciId, k8sClusterId 등 UI에서 발견한 값을 다음 실행에서 재사용.
 */
import * as fs   from 'fs';
import * as path from 'path';

export function discoveredPath(outDir: string, scenarioId: string): string {
  return path.join(outDir, scenarioId, 'discovered.json');
}

export function saveDiscovered(
  outDir: string,
  scenarioId: string,
  params: Record<string, unknown>,
): void {
  const p = discoveredPath(outDir, scenarioId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(params, null, 2), 'utf8');
}

export function loadDiscovered(
  outDir: string,
  scenarioId: string,
): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(discoveredPath(outDir, scenarioId), 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}
