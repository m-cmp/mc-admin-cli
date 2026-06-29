/**
 * deploy/registry/tc/infra.registry.ts
 * INFRA 도메인 TC 전체 목록
 *
 * Feature 코드:
 *   DEPLOY       — MCI 배포·조회 (TC-INFRA-DEPLOY-XX, Excel 기준)
 *   MCI-LC       — MCI 라이프사이클·삭제 (TC-INFRA-LC-XX)
 *   SSH          — SSH 키 CRUD (TC-INFRA-SSH-XX, Excel 기준)
 *   MCI-WORKLOAD — MCI 워크로드 터미널·파일 (역할별 기능)
 *   CSP          — CSP 자격증명 관리 (Settings > Cloud SPs > Credentials)
 *   PMK          — PMK 조회·생성·KubeConfig·크기변경 (TC-INFRA-K8S-01, 03, 04, 05, 06)
 *   PMK-LC       — PMK NodeGroup·클러스터 삭제 (TC-INFRA-K8S-07, 08)
 *
 * 엑셀 TC ID 매핑:
 *   TC-INFRA-DEPLOY-01 ← 구 TC-INFRA-MCI-01 (MCI 목록 조회)
 *   TC-INFRA-DEPLOY-02 ← 구 TC-INFRA-MCI-02 (MCI 단건 조회)
 *   TC-INFRA-DEPLOY-05 ← 구 TC-INFRA-MCI-03 (MCI 생성 Express, Excel DEPLOY-05)
 *   TC-INFRA-DEPLOY-06 — MCI 생성 Expert 모드
 *   TC-INFRA-LC-01     ← 구 TC-INFRA-MCI-04 (MCI 라이프사이클)
 *   TC-INFRA-LC-02     ← 구 TC-INFRA-MCI-05 (MCI 삭제)
 *   TC-INFRA-SSH-01~03 ← 구 TC-INFRA-SSH-KEY-01~03
 *
 * CSP variant:
 *   TC-INFRA-DEPLOY-05/06 는 CSP별로 다른 param을 사용한다.
 *   deploy/params/base/tc/infra/TC-INFRA-DEPLOY-05.params.ts 의
 *   variants.{aws|azure|gcp|ali|ibm|nhn|tencent} 참조.
 */
import type { TCEntry } from '../types';

export const INFRA_TC_REGISTRY: TCEntry[] = [

  // ── DEPLOY (4) — MCI 목록/단건 조회 + MCI 생성(Express·Expert) ─────────
  {
    id: 'TC-INFRA-DEPLOY-01',
    domain: 'infra', feature: 'DEPLOY',
    title: 'MCI 목록 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-01-list-mci.spec.ts',
  },
  {
    id: 'TC-INFRA-DEPLOY-02',
    domain: 'infra', feature: 'DEPLOY',
    title: 'MCI 단건 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-02-get-mci.spec.ts',
  },
  {
    id: 'TC-INFRA-DEPLOY-05',
    domain: 'infra', feature: 'DEPLOY',
    title: 'MCI 생성',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-03-create-mci.spec.ts',
    tags: ['csp-variant'],
    // CSP variant: TC_VARIANT=aws|azure|gcp|ali|ibm|nhn|tencent 로 실행
  },
  {
    id: 'TC-INFRA-DEPLOY-06',
    domain: 'infra', feature: 'DEPLOY',
    title: 'MCI 생성 Expert 모드 — 오류 상태 확인',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-DEPLOY-06.spec.ts',
    tags: ['mode:expert', 'error-verification'],
    // Expert 모드 선택 시 오류가 발생하는지 확인하는 회귀 테스트
  },
  {
    id: 'TC-INFRA-DEPLOY-07',
    domain: 'infra', feature: 'DEPLOY',
    title: 'MCI 서버 추가 (Add Server — Expert 모드)',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-DEPLOY-07.spec.ts',
    tags: ['csp-variant', 'mode:expert'],
    // MCI Info > Default Tab > Add Server > Deployment Algorithm: expert > +VM
    // IN: mciId (store 또는 p.mciName)
  },

  // ── MCI-LC (3) — MCI 라이프사이클·삭제 ──────────────────────────────────
  {
    id: 'TC-INFRA-LC-01',
    domain: 'infra', feature: 'MCI-LC',
    title: 'MCI 라이프사이클 (suspend·resume·reboot)',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-04-mci-lifecycle.spec.ts',
  },
  {
    id: 'TC-INFRA-LC-02',
    domain: 'infra', feature: 'MCI-LC',
    title: 'MCI 삭제',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-05-delete-mci.spec.ts',
  },
  {
    id: 'TC-INFRA-LC-03',
    domain: 'infra', feature: 'MCI-LC',
    title: 'MCI 일괄 삭제 (mc* 접두사 기준)',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-LC-03.spec.ts',
    tags: ['cleanup'],
  },

  // ── MCI-WORKLOAD (3) ─────────────────────────────────────────────────────
  {
    id: 'TC-INFRA-MCI-WORKLOAD-01',
    domain: 'infra', feature: 'MCI-WORKLOAD',
    title: 'MCI 워크로드 (admin) — 터미널 접속',
    status: 'ready', channel: 'ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-WORKLOAD-01~02-mci-workload-admin.spec.ts',
    tags: ['role:admin'],
  },
  {
    id: 'TC-INFRA-MCI-WORKLOAD-02',
    domain: 'infra', feature: 'MCI-WORKLOAD',
    title: 'MCI 워크로드 (admin) — 파일 전송',
    status: 'ready', channel: 'ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-WORKLOAD-01~02-mci-workload-admin.spec.ts',
    tags: ['role:admin'],
  },
  {
    id: 'TC-INFRA-MCI-WORKLOAD-03',
    domain: 'infra', feature: 'MCI-WORKLOAD',
    title: 'MCI 워크로드 (viewer) — 접근 제한 확인',
    status: 'ready', channel: 'ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-WORKLOAD-03-mci-workload-viewer.spec.ts',
    tags: ['role:viewer'],
  },

  // ── CSP (4) — Settings > Cloud SPs > Credentials 자격증명 관리 ─────────────
  { id: 'TC-INFRA-CSP-01', domain: 'infra', feature: 'CSP', title: 'CSP 자격증명 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-CREDENTIAL-01-list-credentials.spec.ts' },
  { id: 'TC-INFRA-CSP-02', domain: 'infra', feature: 'CSP', title: 'CSP 자격증명 단건 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-CREDENTIAL-02-get-credential.spec.ts' },
  {
    id: 'TC-INFRA-CSP-03',
    domain: 'infra', feature: 'CSP',
    title: 'CSP 자격증명 등록',
    status: 'ready', channel: 'api+ui',
    // variant 'api'  : API 직접 호출 (CredentialHolder 생성)
    // variant 'aws'~ : UI — Settings > Cloud SPs > Credentials > Register Credential
    //                  Provider별 KV 입력 양식이 달라 CSP마다 variant 분리
    variants: [
      { key: 'api',       channel: 'api', specFile: 'mc-web-console/specs/csp/TC-CSP-CREDENTIAL-03-create-credential.spec.ts' },
      { key: 'aws',       channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'gcp',       channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'azure',     channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'alibaba',   channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'ibm',       channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'ncp',       channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'nhn',       channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'kt',        channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'openstack', channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
      { key: 'tencent',   channel: 'ui',  specFile: 'deploy/tc/csp/TC-INFRA-CSP-03-ui.spec.ts' },
    ],
  },
  { id: 'TC-INFRA-CSP-04', domain: 'infra', feature: 'CSP', title: 'CSP 자격증명 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-CREDENTIAL-04-delete-credential.spec.ts' },

  // ── PMK (5) — PMK 조회·생성·KubeConfig·NodeGroup 크기 변경 ─────────────────
  {
    id: 'TC-INFRA-K8S-01',
    domain: 'infra', feature: 'PMK',
    title: 'K8s 클러스터·NodeGroup 목록/상세 조회',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-01.spec.ts',
    tags: ['csp-variant'],
  },
  {
    id: 'TC-INFRA-K8S-06',
    domain: 'infra', feature: 'PMK',
    title: 'K8s NodeGroup 크기 변경',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-06.spec.ts',
    tags: ['csp-variant'],
  },
  {
    id: 'TC-INFRA-K8S-03',
    domain: 'infra', feature: 'PMK',
    title: 'PMK 클러스터 생성 (Dynamic 모드)',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-03.spec.ts',
    tags: ['csp-variant'],
  },
  {
    id: 'TC-INFRA-K8S-04',
    domain: 'infra', feature: 'PMK',
    title: 'PMK 클러스터 생성 (Expert 모드)',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-04.spec.ts',
    tags: ['csp-variant', 'mode:expert'],
  },
  {
    id: 'TC-INFRA-K8S-05',
    domain: 'infra', feature: 'PMK',
    title: 'PMK KubeConfig 획득',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-05.spec.ts',
    tags: ['csp-variant'],
  },

  // ── PMK-LC (2) — PMK NodeGroup·클러스터 삭제 ─────────────────────────────
  {
    id: 'TC-INFRA-K8S-07',
    domain: 'infra', feature: 'PMK-LC',
    title: 'PMK NodeGroup 삭제',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-07.spec.ts',
    tags: ['csp-variant'],
    // minNodeGroupRequired=true 인 CSP는 이 TC를 건너뛰고 K8S-08에서 일괄 삭제
  },
  {
    id: 'TC-INFRA-K8S-08',
    domain: 'infra', feature: 'PMK-LC',
    title: 'PMK 클러스터 삭제',
    status: 'ready', channel: 'ui',
    specFile: 'deploy/tc/infra/TC-INFRA-K8S-08.spec.ts',
    tags: ['csp-variant'],
  },

  // ── SSH (3) ──────────────────────────────────────────────────────────────
  {
    id: 'TC-INFRA-SSH-01',
    domain: 'infra', feature: 'SSH',
    title: 'SSH 키 목록 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-SSH-KEY-01-list-ssh-keys.spec.ts',
  },
  {
    id: 'TC-INFRA-SSH-02',
    domain: 'infra', feature: 'SSH',
    title: 'SSH 키 생성',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-SSH-KEY-02-create-ssh-key.spec.ts',
  },
  {
    id: 'TC-INFRA-SSH-03',
    domain: 'infra', feature: 'SSH',
    title: 'SSH 키 삭제',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-SSH-KEY-03-delete-ssh-key.spec.ts',
  },
];
