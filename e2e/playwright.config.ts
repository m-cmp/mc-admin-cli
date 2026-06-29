import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

const accessMode = process.env.ACCESS_MODE || 'external-ip';
dotenv.config({ path: path.resolve(__dirname, `.env.${accessMode}`), override: true });

// 결과 디렉토리: {폴더명}_result (예: deploy → deploy_result, mc-web-console → mc-web-console_result)
const folderName = path.basename(__dirname);
const outDir = process.env.RUN_OUTPUT_DIR
  ? path.resolve(process.env.RUN_OUTPUT_DIR)
  : path.resolve(__dirname, `../${folderName}_result`);

function resolveBaseUrl(): string {
  if (accessMode === 'external-ip') {
    const scheme = process.env.EXTERNAL_HTTPS === 'true' ? 'https' : 'http';
    return `${scheme}://${process.env.EXTERNAL_IP}:${process.env.EXTERNAL_PORT || '3001'}`;
  }
  if (accessMode === 'external-domain') {
    const port = process.env.EXTERNAL_PORT ? `:${process.env.EXTERNAL_PORT}` : '';
    return `https://${process.env.EXTERNAL_DOMAIN}${port}`;
  }
  throw new Error(`Unknown ACCESS_MODE: ${accessMode}`);
}

// ── 세션 그룹 (병렬 실행 단위) ──────────────────────────────────────────────
// 실행 순서 (project.dependencies 기반):
//   C5 → C6 ┐
//            ├→ C7 → C10
//       C9 ──┘
// C5: MCI+K8s 생성·App 배포·Scale out·App 라이프사이클·rating
// C6: 모니터링·트레이싱·로깅
// C7: 인프라 lifecycle (suspend·reboot·resume)
// C9: 클라우드 비용 분석
// C10: cleanup — 모든 세션 완료 후 수동 실행 (npx playwright test --project=session-f-c10-cleanup)
//
// 단일 세션 실행: npx playwright test --project=session-a-c5-svc-expand
// 전체 실행: npx playwright test
const SESSION_GROUPS = [
  {
    // C5: MCI + K8s 생성, App 배포, Scale out, App 라이프사이클, rating
    name: 'session-a-c5-svc-expand',
    testMatch: [
      'scenarios/C5-svc-mgmt1/*.spec.ts',
    ],
  },
  {
    // C6: 모니터링·트레이싱·로깅 (C5의 MCI+K8s 기반)
    name: 'session-b-c6-monitoring',
    testMatch: [
      'scenarios/C6-monitoring/*.spec.ts',
    ],
    dependencies: ['session-a-c5-svc-expand'],
  },
  {
    // C9: 클라우드 비용 분석 (C5의 MCI+K8s 기반, C6과 병렬 가능)
    name: 'session-e-c9-cost',
    testMatch: [
      'scenarios/C9-cost/*.spec.ts',
    ],
    dependencies: ['session-a-c5-svc-expand'],
  },
  {
    // C7: 존재하는 인프라 lifecycle (suspend·reboot·resume)
    // C6·C9 완료 후 실행 — 모니터링·비용분석 중 suspend 방지
    name: 'session-c-c7-lifecycle',
    testMatch: [
      'scenarios/C7-svc-mgmt2/*.spec.ts',
    ],
    dependencies: ['session-b-c6-monitoring', 'session-e-c9-cost'],
  },
  {
    // C10: 삭제·정리 — 수동 실행 전용 (npx playwright test --project=session-f-c10-cleanup)
    name: 'session-f-c10-cleanup',
    testMatch: [
      'scenarios/C10-cleanup/*.spec.ts',
    ],
    dependencies: ['session-b-c6-monitoring', 'session-c-c7-lifecycle', 'session-e-c9-cost'],
  },
];

export default defineConfig({
  testDir: '.',
  // testMatch 미지정 시 모든 tc/**와 scenarios/**를 포함 (project별 testMatch로 분기)
  outputDir: `${outDir}/test-results`,
  timeout: 3 * 60 * 1000,         // 테스트당 최대 3분 (기본 30초 → 확장)
  fullyParallel: false, // 각 project 내부 시나리오는 순차 실행 (스텝 의존성 보존)
  workers: process.env.SESSION ? 1 : 4, // 단일 세션 실행 시 1, 전체 실행 시 4
  reporter: [
    ['list'],
    ['json',  { outputFile: `${outDir}/results.json` }],
    ['html',  { outputFolder: `${outDir}/report`, open: 'never' }],
  ],
  use: {
    baseURL: resolveBaseUrl(),
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
    video: 'retain-on-failure',
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-features=PrivateNetworkAccessChecks,LocalNetworkAccessChecks',
      ],
    },
  },
  projects: SESSION_GROUPS,
});
