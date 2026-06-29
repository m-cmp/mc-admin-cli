/**
 * deploy/registry/tc/sw.registry.ts
 * SW(Application) 도메인 TC 전체 목록 (25개 엔트리)
 *
 * 주의: TC 이름은 APP-* 이지만 폴더는 mc-web-console/specs/sw/ 이다.
 *
 * Feature 코드:
 *   APP-APPS     — 배포된 앱 목록·상세·운영 액션
 *   APP-CAT      — App Catalog CRUD
 *   APP-DEP      — 애플리케이션 배포 (아키텍처별 variant)
 *   APP-REP      — 레포지토리 CRUD (format별 variant: api / ui:helm / ui:docker)
 *   SW-CATALOG   — SW Catalog 목록·배포·제거
 *
 * Variant 규칙:
 *   TC-APP-REP-02 — 같은 기능(레포 생성)을 채널·포맷별로 3개 파일로 나눔
 *     api      → TC-APP-REP-02-repository-신규-생성-api.spec.ts
 *     ui:helm  → TC-APP-REP-02-repository-신규-생성-ui-helm.spec.ts
 *     ui:docker→ TC-APP-REP-02-repository-신규-생성-ui-docker.spec.ts
 *
 *   TC-APP-DEP-* — 아키텍처별 파일 분리
 *     standalone → TC-APP-DEP-01-vm-standalone.spec.ts
 *     clustering → TC-APP-DEP-02-vm-clustering.spec.ts
 *     k8s        → TC-APP-DEP-03-k8s-helm.spec.ts
 */
import type { TCEntry } from '../types';

export const SW_TC_REGISTRY: TCEntry[] = [

  // ── APP-APPS (4) ─────────────────────────────────────────────────────────
  { id: 'TC-APP-APPS-01', domain: 'sw', feature: 'APP-APPS', title: '배포 상태 목록 갱신·Refresh', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-APPS-01-배포-상태-목록-갱신-refresh.spec.ts' },
  { id: 'TC-APP-APPS-02', domain: 'sw', feature: 'APP-APPS', title: '배포 상세 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-APPS-02-배포-상세-조회.spec.ts' },
  { id: 'TC-APP-APPS-03', domain: 'sw', feature: 'APP-APPS', title: '운영 액션 (restart·stop·uninstall)', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-APPS-03-운영-액션-restart-stop-uninstall.spec.ts' },
  { id: 'TC-APP-APPS-04', domain: 'sw', feature: 'APP-APPS', title: '평점 제출', status: 'wip', channel: 'ui', specFile: 'mc-web-console/specs/sw/TC-APP-APPS-04-rating-제출.spec.ts' },

  // ── APP-CAT (7) ──────────────────────────────────────────────────────────
  { id: 'TC-APP-CAT-01', domain: 'sw', feature: 'APP-CAT', title: '빌트인 Catalog 목록 표시', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-01-빌트인-catalog-목록-표시.spec.ts' },
  { id: 'TC-APP-CAT-02', domain: 'sw', feature: 'APP-CAT', title: 'Catalog 상세 펼침·접힘', status: 'wip', channel: 'ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-02-catalog-상세-펼침-접힘.spec.ts' },
  { id: 'TC-APP-CAT-03', domain: 'sw', feature: 'APP-CAT', title: '외부 검색 결과 표시', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-03-외부-검색-결과-표시.spec.ts' },
  { id: 'TC-APP-CAT-04', domain: 'sw', feature: 'APP-CAT', title: '외부 검색 결과 업로드', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-04-외부-검색-결과-업로드.spec.ts' },
  { id: 'TC-APP-CAT-05', domain: 'sw', feature: 'APP-CAT', title: 'Catalog 신규 등록', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-05-catalog-신규-등록.spec.ts' },
  { id: 'TC-APP-CAT-06', domain: 'sw', feature: 'APP-CAT', title: 'Catalog 수정', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-06-catalog-수정.spec.ts' },
  { id: 'TC-APP-CAT-07', domain: 'sw', feature: 'APP-CAT', title: 'Catalog 삭제', status: 'wip', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-APP-CAT-07-catalog-삭제.spec.ts' },

  // ── APP-DEP (3 — 아키텍처별 variant) ────────────────────────────────────
  {
    id: 'TC-APP-DEP-01',
    domain: 'sw', feature: 'APP-DEP',
    title: 'VM Standalone 배포',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-DEP-01-vm-standalone.spec.ts',
    tags: ['arch:standalone'],
  },
  {
    id: 'TC-APP-DEP-02',
    domain: 'sw', feature: 'APP-DEP',
    title: 'VM Clustering 배포',
    status: 'wip', channel: 'api+ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-DEP-02-vm-clustering.spec.ts',
    tags: ['arch:clustering'],
  },
  {
    id: 'TC-APP-DEP-03',
    domain: 'sw', feature: 'APP-DEP',
    title: 'K8s Helm 배포',
    status: 'wip', channel: 'api+ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-DEP-03-k8s-helm.spec.ts',
    tags: ['arch:k8s'],
  },

  // ── APP-REP (8 엔트리 — 01·03·04·05 단일 / 02는 3-variant) ─────────────
  {
    id: 'TC-APP-REP-01',
    domain: 'sw', feature: 'APP-REP',
    title: 'Repository 목록 조회',
    status: 'wip', channel: 'api+ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-REP-01-repository-목록-조회.spec.ts',
  },
  {
    id: 'TC-APP-REP-02',
    domain: 'sw', feature: 'APP-REP',
    title: 'Repository 신규 생성',
    status: 'wip', channel: 'api+ui',
    // variant 파일 3개 — specFile 대신 variants 사용
    variants: [
      { key: 'api',       channel: 'api', specFile: 'mc-web-console/specs/sw/TC-APP-REP-02-repository-신규-생성-api.spec.ts' },
      { key: 'ui:helm',   channel: 'ui',  specFile: 'mc-web-console/specs/sw/TC-APP-REP-02-repository-신규-생성-ui-helm.spec.ts' },
      { key: 'ui:docker', channel: 'ui',  specFile: 'mc-web-console/specs/sw/TC-APP-REP-02-repository-신규-생성-ui-docker.spec.ts' },
    ],
  },
  {
    id: 'TC-APP-REP-03',
    domain: 'sw', feature: 'APP-REP',
    title: 'Repository 상세 진입',
    status: 'wip', channel: 'ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-REP-03-repository-상세-진입.spec.ts',
  },
  {
    id: 'TC-APP-REP-04',
    domain: 'sw', feature: 'APP-REP',
    title: 'Repository 컴포넌트 삭제',
    status: 'wip', channel: 'api+ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-REP-04-repository-컴포넌트-삭제.spec.ts',
  },
  {
    id: 'TC-APP-REP-05',
    domain: 'sw', feature: 'APP-REP',
    title: 'Repository 삭제',
    status: 'wip', channel: 'api+ui',
    specFile: 'mc-web-console/specs/sw/TC-APP-REP-05-repository-삭제.spec.ts',
  },

  // ── SW-CATALOG (3) ───────────────────────────────────────────────────────
  { id: 'TC-SW-CATALOG-01', domain: 'sw', feature: 'SW-CATALOG', title: 'SW Catalog 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-SW-CATALOG-01-list-sw-catalog.spec.ts' },
  { id: 'TC-SW-CATALOG-02', domain: 'sw', feature: 'SW-CATALOG', title: 'SW 배포', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-SW-CATALOG-02-deploy-sw.spec.ts' },
  { id: 'TC-SW-CATALOG-03', domain: 'sw', feature: 'SW-CATALOG', title: 'SW 제거 (undeploy)', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/sw/TC-SW-CATALOG-03-undeploy-sw.spec.ts' },
];
