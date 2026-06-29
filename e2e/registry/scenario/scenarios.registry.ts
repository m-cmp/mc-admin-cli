/**
 * deploy/registry/scenario/scenarios.registry.ts
 * 시나리오 전체 목록
 *
 * Code 체계:
 *   C2  — IAM·사용자 관리 (Onboarding)
 *   C3  — WF 기반 서비스 생성 (정의·수정·실행·EL)
 *   C4  — 직접 서비스 생성 (Infra·K8s배포 → Repository·Catalog → Infra설치·확인 → K8s설치·확인)
 *   C5  — 서비스 운영 관리 (lifecycle·K8s 운영·App 운영)
 *   C6  — 모니터링·로깅·트레이싱
 *   C8  — 데이터 백업·복구·마이그레이션
 *   C9  — 클라우드 비용 분석
 *   C10 — 정리 / Cleanup
 *
 * 상태(status):
 *   ready   — 전체 스텝 실행 가능
 *   partial — 일부 wip/todo 포함, 나머지 실행 가능 (wip/todo 스텝은 FAIL)
 *   wip     — 작업 중
 *   todo    — 구현 예정
 */
import type { ScenarioEntry } from '../types';

export const SCENARIO_REGISTRY: ScenarioEntry[] = [

  // ── C2: IAM 온보딩 ────────────────────────────────────────────────────────
  {
    id: 'C2-01-onboarding-mc-iam-manager-user-create',
    code: 'C2',
    title: 'IAM 온보딩 — 사용자 추가·역할·그룹 할당',
    description: '신규 사용자 생성부터 역할 배정, 그룹 할당, 워크스페이스 접근 확인까지의 전체 흐름.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-admin-setup/C2-01-onboarding-mc-iam-manager-user-create.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-UG-03',           status: 'ready', description: '신규 사용자 생성' },
      { order: 2, tcId: 'TC-IAM-UG-08',           status: 'ready', description: '그룹 생성' },
      { order: 3, tcId: 'TC-IAM-UG-11',           status: 'ready', description: '그룹에 사용자 배정' },
      { order: 4, tcId: 'TC-IAM-RBAC-06',         status: 'ready', description: '사용자에 플랫폼 역할 부여' },
      { order: 5, tcId: 'TC-IAM-WS-05',           status: 'ready', description: '워크스페이스에 사용자 배정' },
      { order: 6, tcId: 'TC-IAM-AUTH-01',         status: 'ready', description: '신규 사용자로 로그인 확인' },
    ],
  },

  {
    id: 'C2-02-onboarding-mc-iam-manager-role-assign',
    code: 'C2',
    title: '관리자 계정 생성·역할 할당·MCI 연동',
    description: '관리자 사용자 생성 후 역할을 부여하고 MCI 접근 권한을 확인한다.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-admin-setup/C2-02-onboarding-mc-iam-manager-role-assign.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-UG-03',           status: 'ready', description: '관리자 사용자 생성' },
      { order: 2, tcId: 'TC-IAM-RBAC-06',         status: 'ready', description: '플랫폼 역할 부여' },
      { order: 3, tcId: 'TC-INFRA-DEPLOY-01',     status: 'ready', description: 'MCI 목록 접근 확인' },
    ],
  },

  {
    id: 'C2-04-onboarding-mc-iam-manager-workspace-mgmt',
    code: 'C2',
    title: 'Workspace 관리 UI 전체 검증',
    description: '워크스페이스 목록·생성·수정·삭제·Projects 탭·테이블 UX를 검증한다.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-admin-setup/C2-04-onboarding-mc-iam-manager-workspace-mgmt.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-WS-01',           status: 'ready', description: '워크스페이스 목록 조회' },
      { order: 2, tcId: 'TC-IAM-WS-02',           status: 'ready', description: '워크스페이스 생성' },
      { order: 3, tcId: 'TC-IAM-WS-08',           status: 'ready', description: '대시보드 카운트 확인' },
      { order: 4, tcId: 'TC-IAM-WS-10',           status: 'ready', description: '추가 모달 UI 확인' },
      { order: 5, tcId: 'TC-IAM-WS-13',           status: 'ready', description: 'Projects 탭 관리' },
      { order: 6, tcId: 'TC-IAM-WS-14',           status: 'ready', description: '테이블 정렬·다중선택' },
      { order: 7, tcId: 'TC-IAM-WS-04',           status: 'ready', description: '워크스페이스 삭제' },
    ],
  },

  {
    id: 'C2-03-onboarding-mc-iam-manager-signup-approval',
    code: 'C2',
    title: '가입 신청 승인 — 관리자 승인 화면 API·UI 검증',
    description: '사용자가 회원가입을 신청하고 관리자가 API 또는 UI로 승인한 후 로그인을 확인한다.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-admin-setup/C2-03-onboarding-mc-iam-manager-signup-approval.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-AUTH-05',           status: 'ready', description: '사용자 회원가입 신청' },
      { order: 2, tcId: 'TC-IAM-USER-LIFECYCLE-01', status: 'ready', description: '관리자 API 승인 후 로그인' },
      { order: 3, tcId: 'TC-IAM-USER-LIFECYCLE-02', status: 'ready', description: '관리자 UI 승인 후 로그인' },
    ],
  },

  // ── C3: Workflow 기반 서비스 생성 ─────────────────────────────────────────
  // Phase 1: 정의
  {
    id: 'C3-01-wf-define',
    code: 'C3',
    title: 'WF 등록 (서비스 생성용·삭제용)',
    description: '서비스 생성 및 삭제용 Workflow를 각각 정의하고 등록한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-01-wf-define.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-03', status: 'ready', description: '서비스 생성용 Workflow 등록', variant: 'create' },
      { order: 2, tcId: 'TC-WF-FLOW-03', status: 'ready', description: '서비스 삭제용 Workflow 등록', variant: 'delete' },
    ],
  },

  // Phase 2: 수정
  {
    id: 'C3-02-wf-modify',
    code: 'C3',
    title: 'WF 조회·수정',
    description: '등록된 Workflow 목록을 조회하고 상세 내용을 수정한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-02-wf-modify.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-02', status: 'ready', description: 'Workflow 목록 조회' },
      { order: 2, tcId: 'TC-WF-FLOW-04', status: 'ready', description: 'Workflow 상세 수정' },
    ],
  },

  // Phase 3: 실행
  {
    id: 'C3-03-wf-run-infra',
    code: 'C3',
    title: 'WF 실행 — 인프라 배포',
    description: '정의된 인프라 생성 Workflow를 RUN 버튼으로 실행하고 로그를 확인한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-03-wf-run-infra.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-06', status: 'ready', description: '인프라 배포 Workflow 실행 (RUN)' },
      { order: 2, tcId: 'TC-WF-FLOW-07', status: 'ready', description: 'Workflow 로그 모달 확인' },
    ],
  },

  {
    id: 'C3-04-wf-run-infra-app',
    code: 'C3',
    title: 'WF 실행 — 인프라 + Application 통합 배포',
    description: '인프라와 애플리케이션을 함께 배포하는 Workflow를 실행하고 로그를 확인한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-04-wf-run-infra-app.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-06', status: 'ready', description: '인프라+App 통합 배포 Workflow 실행 (RUN)', variant: 'infra-app' },
      { order: 2, tcId: 'TC-WF-FLOW-07', status: 'ready', description: 'Workflow 로그 모달 확인' },
    ],
  },

  {
    id: 'C3-05-wf-run-k8s',
    code: 'C3',
    title: 'WF 실행 — K8s 배포',
    description: 'K8s 클러스터를 배포하는 Workflow를 실행한다.',
    status: 'wip',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-05-wf-run-k8s.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-06', status: 'wip', description: 'K8s 배포 Workflow 실행 (RUN)', variant: 'k8s' },
    ],
  },

  // Phase 4: Event Listener
  {
    id: 'C3-06-wf-el-register',
    code: 'C3',
    title: 'Event Listener 등록 (WF 연결)',
    description: 'Workflow와 연결된 Event Listener를 생성하고 이름 중복을 검사한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-06-wf-el-register.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-EL-02', status: 'ready', description: 'Event Listener 생성 (Workflow 연결)' },
      { order: 2, tcId: 'TC-WF-EL-03', status: 'ready', description: 'Event Listener 이름 중복 검사' },
    ],
  },

  {
    id: 'C3-07-wf-el-run',
    code: 'C3',
    title: 'Event Listener로 WF 실행 (GET / POST)',
    description: 'Event Listener를 통해 외부에서 Workflow를 GET/POST 방식으로 실행한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-svc-wf/C3-07-wf-el-run.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-EL-06', status: 'ready', description: 'Event Listener GET Trigger로 Workflow 실행' },
      { order: 2, tcId: 'TC-WF-EL-07', status: 'ready', description: 'Event Listener POST Trigger로 Workflow 실행' },
    ],
  },

  // ── C4: 직접 서비스 생성 ──────────────────────────────────────────────────
  // Phase 1: 인프라 배포

  // C4-01: Multi-CSP MCI 통합 + Clustering NodeGroup
  {
    id: 'C4-01-mci-multi-csp-cluster',
    code: 'C4',
    title: 'MCI 배포 — Multi-CSP 통합 + Clustering SubGroup',
    description: '여러 CSP의 VM을 1개 MCI에 통합 생성하고, Clustering용 NodeGroup에 N개 VM을 추가한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-01-mci-multi-csp-cluster.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-DEPLOY-05', status: 'ready', description: 'mci01 생성 (AWS ng1 첫 번째 subgroup)', variant: 'multi',
        outputParams: ['mciId', 'mciName', 'nsId'] },
      { order: 2, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng2 (Azure) subgroup 추가', variant: 'ng2-azure' },
      { order: 3, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng3 (Alibaba) subgroup 추가', variant: 'ng3-ali' },
      { order: 4, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng4 (GCP) subgroup 추가', variant: 'ng4-gcp' },
      { order: 5, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng5 (NCP) subgroup 추가', variant: 'ng5-ncp' },
      { order: 6, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng6 (NHN) subgroup 추가', variant: 'ng6-nhn' },
      { order: 7, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng7 (Tencent) subgroup 추가', variant: 'ng7-tencent' },
      { order: 8, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng8 (IBM) subgroup 추가', variant: 'ng8-ibm' },
      { order: 9, tcId: 'TC-INFRA-DEPLOY-01', status: 'ready', description: '8개 CSP 전체 VM Running 상태 확인' },
    ],
  },

  // C4-02-k8s-{csp}: K8s 배포 per CSP (9종, 동일 spec 공유)
  // spec 파일: C4-02-k8s-deploy.spec.ts — SCENARIO_ID env var로 CSP 선택
  // Playwright projects 방식으로 CSP별 반복 실행
  {
    id: 'C4-02-k8s-aws',
    code: 'C4',
    title: 'K8s 배포 — AWS',
    description: 'AWS K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'AWS K8s 클러스터 배포 (Dynamic)', variant: 'aws',
        outputParams: ['k8sClusterId', 'k8sName'] },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'AWS KubeConfig 획득', variant: 'aws' },
    ],
  },

  {
    id: 'C4-02-k8s-azure',
    code: 'C4',
    title: 'K8s 배포 — Azure',
    description: 'Azure K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'Azure K8s 클러스터 배포 (Dynamic)', variant: 'azure' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'Azure KubeConfig 획득',              variant: 'azure' },
    ],
  },

  {
    id: 'C4-02-k8s-gcp',
    code: 'C4',
    title: 'K8s 배포 — GCP',
    description: 'GCP K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'GCP K8s 클러스터 배포 (Dynamic)', variant: 'gcp' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'GCP KubeConfig 획득',              variant: 'gcp' },
    ],
  },

  {
    id: 'C4-02-k8s-ali',
    code: 'C4',
    title: 'K8s 배포 — Alibaba',
    description: 'Alibaba K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'Alibaba K8s 클러스터 배포 (Dynamic)', variant: 'ali' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'Alibaba KubeConfig 획득',              variant: 'ali' },
    ],
  },

  {
    id: 'C4-02-k8s-ibm',
    code: 'C4',
    title: 'K8s 배포 — IBM',
    description: 'IBM K8s 클러스터를 배포(Expert)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-04', status: 'ready', description: 'IBM K8s 클러스터 배포 (Expert)', variant: 'ibm' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'IBM KubeConfig 획득',             variant: 'ibm' },
    ],
  },

  {
    id: 'C4-02-k8s-nhn',
    code: 'C4',
    title: 'K8s 배포 — NHN',
    description: 'NHN K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'NHN K8s 클러스터 배포 (Dynamic)', variant: 'nhn' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'NHN KubeConfig 획득',              variant: 'nhn' },
    ],
  },

  {
    id: 'C4-02-k8s-tencent',
    code: 'C4',
    title: 'K8s 배포 — Tencent',
    description: 'Tencent K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'Tencent K8s 클러스터 배포 (Dynamic)', variant: 'tencent' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'Tencent KubeConfig 획득',              variant: 'tencent' },
    ],
  },

  {
    id: 'C4-02-k8s-ncp',
    code: 'C4',
    title: 'K8s 배포 — NCP',
    description: 'NCP K8s 클러스터를 배포(Dynamic)하고 KubeConfig를 획득한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-02-k8s-deploy.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-03', status: 'ready', description: 'NCP K8s 클러스터 배포 (Dynamic)', variant: 'ncp' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'NCP KubeConfig 획득',              variant: 'ncp' },
    ],
  },
  // TODO: 9번째 K8s CSP 항목 추가 (CSP 확정 후)

  // Phase 2: SW Repository·Catalog 구성 (공통)
  {
    id: 'C4-03-sw-repo-create',
    code: 'C4',
    title: 'SW Repository 생성',
    description: '애플리케이션 검색·배포를 위한 SW Repository를 신규 생성한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-03-sw-repo-create.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-REP-02', status: 'ready', description: 'SW Repository 신규 생성' },
    ],
  },

  {
    id: 'C4-04-app-catalog-register',
    code: 'C4',
    title: 'SW 검색 → Catalog 등록',
    description: '외부(DockerHub)에서 애플리케이션을 검색·Upload하고 SW Catalog에 등록한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-04-app-catalog-register.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-CAT-03', status: 'ready', description: '외부 검색 결과 표시 (DockerHub)' },
      { order: 2, tcId: 'TC-APP-CAT-04', status: 'ready', description: 'DockerHub 이미지 → Repository Upload' },
      { order: 3, tcId: 'TC-APP-CAT-05', status: 'ready', description: 'Catalog 신규 등록 (VM 타겟)' },
    ],
  },

  // Phase 3: Infra 설치·확인
  {
    id: 'C4-05-app-deploy-standalone',
    code: 'C4',
    title: 'SW Standalone 배포 (Infra VM 단일)',
    description: 'MCI의 단일 VM에 애플리케이션을 Standalone 방식으로 배포한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-05-app-deploy-standalone.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-DEP-01', status: 'ready', description: 'VM 단일 Standalone 배포' },
    ],
  },

  {
    id: 'C4-06-app-deploy-clustering',
    code: 'C4',
    title: 'SW Clustering 배포 (NodeGroup N개 VM)',
    description: 'C4-01에서 생성한 Clustering NodeGroup(N개 VM)에 애플리케이션을 Clustering 방식으로 배포한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-06-app-deploy-clustering.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-DEP-02', status: 'ready', description: 'NodeGroup Clustering 배포' },
    ],
  },

  {
    id: 'C4-07-infra-app-verify',
    code: 'C4',
    title: 'Infra Application 상태 확인',
    description: 'Infra(MCI VM)에 배포된 애플리케이션의 상태 목록을 조회하고 상세 정보를 확인한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-07-infra-app-verify.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-APPS-01', status: 'ready', description: 'Apps Status 목록 조회 (Infra)' },
      { order: 2, tcId: 'TC-APP-APPS-02', status: 'ready', description: 'Apps Status 상세 팝업 확인 (Infra)' },
    ],
  },

  // Phase 4: K8s 설치·확인
  // C4-08/09는 Playwright projects로 각 K8s 환경(C4-02-k8s-*)마다 반복 실행
  {
    id: 'C4-08-app-deploy-k8s-helm',
    code: 'C4',
    title: 'SW K8s Helm 배포',
    description: 'K8s 클러스터에 Catalog(K8s 타겟)를 등록하고 Helm으로 애플리케이션을 배포한다.',
    status: 'todo',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-08-app-deploy-k8s-helm.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-REP-03',  status: 'todo', description: 'SW Catalog 등록 (K8s 타겟)' },
      { order: 2, tcId: 'TC-APP-DEP-03',  status: 'todo', description: 'SW K8s 배포 (Helm)' },
    ],
  },

  {
    id: 'C4-09-k8s-app-verify',
    code: 'C4',
    title: 'K8s Application 상태 확인',
    description: 'K8s 클러스터에 배포된 애플리케이션의 상태 목록을 조회하고 상세 정보를 확인한다.',
    status: 'todo',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-svc-direct/C4-09-k8s-app-verify.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-APPS-01', status: 'todo', description: 'Apps Status 목록 조회 (K8s)' },
      { order: 2, tcId: 'TC-APP-APPS-02', status: 'todo', description: 'Apps Status 상세 팝업 확인 (K8s)' },
    ],
  },

  // ── C7: 인프라 라이프사이클 ──────────────────────────────────────────────
  {
    id: 'C7-01-mci-lifecycle',
    code: 'C7',
    title: '운영 중 MCI 관리',
    description: '운영 중인 MCI 인프라의 라이프사이클(suspend·reboot·resume)을 관리한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C7-svc-mgmt2/C7-01-mci-lifecycle.spec.ts',
    requiredInputs: ['mciId'],
    steps: [
      { order: 1, tcId: 'TC-INFRA-LC-01a', status: 'ready', description: 'MCI suspend (Running→Stopped)' },
      { order: 2, tcId: 'TC-INFRA-LC-01c', status: 'ready', description: 'MCI reboot  (Stopped→Running)' },
      { order: 3, tcId: 'TC-INFRA-LC-01a', status: 'ready', description: 'MCI suspend (Running→Stopped)' },
      { order: 4, tcId: 'TC-INFRA-LC-01b', status: 'ready', description: 'MCI resume  (Stopped→Running)' },
    ],
  },

  {
    id: 'C7-02-mci-resume',
    code: 'C7',
    title: 'MCI Resume 시나리오',
    description: 'suspend 상태의 MCI를 resume하여 Running으로 복구한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C7-svc-mgmt2/C7-02-mci-resume.spec.ts',
    requiredInputs: ['mciId'],
    steps: [
      { order: 1, tcId: 'TC-INFRA-DEPLOY-02', status: 'ready', description: 'MCI 상태 확인' },
      { order: 2, tcId: 'TC-INFRA-LC-01b',    status: 'ready', description: 'MCI resume (Stopped→Running)' },
      { order: 3, tcId: 'TC-INFRA-DEPLOY-01', status: 'ready', description: 'Running 상태 확인' },
    ],
  },

  {
    id: 'C7-03-k8s-cluster-manage',
    code: 'C7',
    title: 'K8s 클러스터 운영 관리',
    description: 'K8s 클러스터·NodeGroup 목록/상세 조회, Helm 앱 배포, NodeGroup 크기 변경을 수행한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C7-svc-mgmt2/C7-03-k8s-cluster-manage.spec.ts',
    requiredInputs: ['k8sClusterId'],
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-01', status: 'ready', description: 'K8s 클러스터·NodeGroup 목록/상세 조회' },
      { order: 2, tcId: 'TC-INFRA-K8S-05', status: 'ready', description: 'KubeConfig 획득 (kubectl 접속 정보)' },
      { order: 3, tcId: 'TC-APP-DEP-03',   status: 'ready', description: 'K8s Helm 앱 배포' },
      { order: 4, tcId: 'TC-INFRA-K8S-06', status: 'ready', description: 'K8s NodeGroup 크기 변경' },
    ],
  },

  // ── C5: 서비스 확인·확장 ─────────────────────────────────────────────────

  // C5-01: Infra Scale Out — mci01 CSP별 NodeGroup 2개 추가
  {
    id: 'C5-01-infra-scaleout',
    code: 'C5',
    title: 'Infra Scale Out — CSP별 NodeGroup 2개 추가',
    description: 'mci01의 각 CSP subgroup에 nodegroup을 2개씩 추가하여 수평 확장한다. (8 CSP × 2 = 16 subgroup 추가)',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C5-svc-mgmt1/C5-01-infra-scaleout.spec.ts',
    steps: [
      { order: 1,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng1a (AWS) subgroup 추가',    variant: 'ng1a' },
      { order: 2,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng1b (AWS) subgroup 추가',    variant: 'ng1b' },
      { order: 3,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng2a (Azure) subgroup 추가',  variant: 'ng2a' },
      { order: 4,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng2b (Azure) subgroup 추가',  variant: 'ng2b' },
      { order: 5,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng3a (Ali) subgroup 추가',    variant: 'ng3a' },
      { order: 6,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng3b (Ali) subgroup 추가',    variant: 'ng3b' },
      { order: 7,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng4a (GCP) subgroup 추가',    variant: 'ng4a' },
      { order: 8,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng4b (GCP) subgroup 추가',    variant: 'ng4b' },
      { order: 9,  tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng5a (NCP) subgroup 추가',    variant: 'ng5a' },
      { order: 10, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng5b (NCP) subgroup 추가',    variant: 'ng5b' },
      { order: 11, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng6a (NHN) subgroup 추가',    variant: 'ng6a' },
      { order: 12, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng6b (NHN) subgroup 추가',    variant: 'ng6b' },
      { order: 13, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng7a (Tencent) subgroup 추가', variant: 'ng7a' },
      { order: 14, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng7b (Tencent) subgroup 추가', variant: 'ng7b' },
      { order: 15, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng8a (IBM) subgroup 추가',     variant: 'ng8a' },
      { order: 16, tcId: 'TC-INFRA-DEPLOY-07', status: 'ready', description: 'ng8b (IBM) subgroup 추가',     variant: 'ng8b' },
      { order: 17, tcId: 'TC-INFRA-DEPLOY-01', status: 'ready', description: '전체 VM Running 상태 확인' },
    ],
  },

  {
    id: 'C5-04-app-ops-verify',
    code: 'C5',
    title: '애플리케이션 운영 액션',
    description: '배포된 애플리케이션의 상태 목록 갱신·상세 조회 후 운영 액션(Restart/Stop/Uninstall)을 수행한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C5-svc-mgmt1/C5-04-app-ops-verify.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-APPS-01', status: 'ready', description: '배포 상태 목록 갱신·Refresh' },
      { order: 2, tcId: 'TC-APP-APPS-02', status: 'ready', description: '배포 상세 조회' },
      { order: 3, tcId: 'TC-APP-APPS-03', status: 'ready', description: '운영 액션 (Restart / Stop / Uninstall)' },
    ],
  },

  {
    id: 'C5-05-app-rating',
    code: 'C5',
    title: '애플리케이션 Rating 제출',
    description: '사용한 애플리케이션에 대한 Rating(별점)을 제출한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C5-svc-mgmt1/C5-05-app-rating.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-APPS-04', status: 'ready', description: 'Rating 제출' },
    ],
  },

  // ── C6: 모니터링·로깅·트레이싱 ───────────────────────────────────────────

  {
    id: 'C6-01-obs-agent',
    code: 'C6',
    title: 'OBS Agent 관리 — MCI VM (Node 조회·설치·폴링·플러그인·제거)',
    description: '모니터링 대상 MCI VM Node를 조회하고 Agent를 설치·상태확인·플러그인 등록 후 제거한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-01-obs-agent.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-AGENT-01', status: 'ready', description: '등록 가능 Node 조회 (Config)' },
      { order: 2, tcId: 'TC-OBS-AGENT-02', status: 'ready', description: 'Agent 설치' },
      { order: 3, tcId: 'TC-OBS-AGENT-03', status: 'ready', description: 'Agent 설치 상태 폴링' },
      { order: 4, tcId: 'TC-OBS-AGENT-04', status: 'ready', description: '모니터링 플러그인(item) 등록' },
      { order: 5, tcId: 'TC-OBS-AGENT-05', status: 'ready', description: 'Agent 제거' },
    ],
    initialStore: {
      obsTargetMciId:   'mci-aws',
      obsTargetInfraId: 'node-aws-1',
    },
  },

  {
    id: 'C6-02-obs-metric',
    code: 'C6',
    title: 'OBS Metric 조회 (Agent 시계열·CSP·K8s·오버뷰)',
    description: 'InfluxDB Agent 메트릭, CSP API 메트릭, K8s 노드 메트릭, Infra/NS 오버뷰를 조회한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-02-obs-metric.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-METRIC-01', status: 'ready', description: 'Agent 시계열 메트릭 (InfluxDB)' },
      { order: 2, tcId: 'TC-OBS-METRIC-02', status: 'todo',  description: 'CSP API 메트릭 (cb-spider)' },
      { order: 3, tcId: 'TC-OBS-METRIC-03', status: 'todo',  description: 'K8s Cluster 노드 메트릭' },
      { order: 4, tcId: 'TC-OBS-METRIC-04', status: 'todo',  description: 'Infra / NS 레벨 오버뷰' },
    ],
  },

  {
    id: 'C6-03-obs-insight',
    code: 'C6',
    title: 'OBS Insight 분석 (Anomaly·예측·LLM 오류분석)',
    description: 'Anomaly Detection 설정 → History 조회 → Prediction → LLM 기반 서버 오류 분석 전체 흐름.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-03-obs-insight.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-INSIGHT-01', status: 'ready', description: 'Anomaly Detection 설정' },
      { order: 2, tcId: 'TC-OBS-INSIGHT-02', status: 'todo',  description: 'Anomaly History 조회' },
      { order: 3, tcId: 'TC-OBS-INSIGHT-03', status: 'todo',  description: 'Prediction(예측)' },
      { order: 4, tcId: 'TC-OBS-INSIGHT-04', status: 'todo',  description: 'Server Error Analysis (LLM)' },
    ],
  },

  {
    id: 'C6-04-obs-log',
    code: 'C6',
    title: 'OBS Log 조회 (라벨·LogQL 검색)',
    description: 'Loki 라벨 목록을 조회하고 LogQL로 키워드 검색을 수행한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-04-obs-log.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-LOG-01', status: 'ready', description: '라벨 조회' },
      { order: 2, tcId: 'TC-OBS-LOG-02', status: 'todo',  description: '키워드 검색 (LogQL)' },
    ],
  },

  {
    id: 'C6-05-obs-trace',
    code: 'C6',
    title: 'OBS Trace 조회 (Tempo 검색·상세·iframe)',
    description: 'Grafana Tempo에서 Trace를 검색하고 상세 Call Sequence와 iframe 임베드를 확인한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-05-obs-trace.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-TRACE-01', status: 'ready', description: 'Trace 검색 (Tempo)' },
      { order: 2, tcId: 'TC-OBS-TRACE-02', status: 'todo',  description: 'Trace 상세 / Call Sequence' },
      { order: 3, tcId: 'TC-OBS-TRACE-03', status: 'todo',  description: 'Trace iframe 임베드' },
    ],
  },

  {
    id: 'C6-06-obs-trigger',
    code: 'C6',
    title: 'OBS Trigger 관리 (Policy·채널·알림)',
    description: 'Trigger Policy 생성/목록/삭제, 타겟 연결, 알림 채널 설정, History 조회, 임계값 수정 전체 흐름.',
    status: 'todo',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-06-obs-trigger.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-TRIG-01', status: 'todo', description: 'Trigger Policy 생성/목록/삭제' },
      { order: 2, tcId: 'TC-OBS-TRIG-02', status: 'todo', description: '정책 ↔ Node/Infra 타겟 연결' },
      { order: 3, tcId: 'TC-OBS-TRIG-03', status: 'todo', description: '알림 채널 설정' },
      { order: 4, tcId: 'TC-OBS-TRIG-04', status: 'todo', description: 'Trigger / Notification History' },
      { order: 5, tcId: 'TC-OBS-TRIG-05', status: 'todo', description: '정책 수정 (임계값 등)' },
    ],
  },

  // C6-08: PMK K8s Agent 관리 (C6-01의 MCI VM 전용과 분리)
  {
    id: 'C6-08-obs-agent-pmk',
    code: 'C6',
    title: 'OBS Agent 관리 — PMK K8s (설치·상태확인·제거)',
    description: 'PMK K8s 클러스터에 모니터링 Agent를 설치·상태확인·제거한다. (C6-01 MCI VM 버전과 분리)',
    status: 'todo',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring/C6-08-obs-agent-pmk.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-AGENT-01', status: 'todo', description: 'PMK K8s Node 조회 (Config)', variant: 'pmk' },
      { order: 2, tcId: 'TC-OBS-AGENT-02', status: 'todo', description: 'PMK K8s Agent 설치',         variant: 'pmk' },
      { order: 3, tcId: 'TC-OBS-AGENT-03', status: 'todo', description: 'PMK K8s Agent 설치 상태 폴링', variant: 'pmk' },
    ],
  },

  // ── C8: 데이터 백업·복구·마이그레이션 ───────────────────────────────────
  // Object Storage (4종)
  {
    id: 'C8-01-objstore-generate',
    code: 'C8',
    title: 'Object Storage 생성',
    description: 'Object Storage 버킷을 생성하고 초기 데이터를 준비한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-01-objstore-generate.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-OS-01', status: 'ready', description: 'Object Storage 생성 (Generate)' },
    ],
  },

  {
    id: 'C8-02-objstore-migrate',
    code: 'C8',
    title: 'Object Storage Migration',
    description: 'Object Storage 데이터를 다른 버킷으로 마이그레이션한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-02-objstore-migrate.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-OS-02', status: 'ready', description: 'Object Storage 마이그레이션' },
    ],
  },

  {
    id: 'C8-03-objstore-backup',
    code: 'C8',
    title: 'Object Storage Backup',
    description: 'Object Storage 버킷을 백업한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-03-objstore-backup.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-OS-03', status: 'ready', description: 'Object Storage 백업' },
    ],
  },

  {
    id: 'C8-04-objstore-restore',
    code: 'C8',
    title: 'Object Storage Restore',
    description: 'Object Storage 백업에서 데이터를 복원한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-04-objstore-restore.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-OS-04', status: 'ready', description: 'Object Storage 복원' },
    ],
  },

  // RDBMS (4종)
  {
    id: 'C8-05-rdb-generate',
    code: 'C8',
    title: 'RDBMS 데이터 생성',
    description: 'RDBMS에 테스트 데이터를 생성(Generate)한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-05-rdb-generate.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-RDB-01', status: 'ready', description: 'RDBMS 데이터 생성 (Generate)' },
    ],
  },

  {
    id: 'C8-06-rdb-migration',
    code: 'C8',
    title: 'RDBMS Migration',
    description: 'RDBMS 데이터를 다른 인스턴스로 마이그레이션한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-06-rdb-migration.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-RDB-02', status: 'ready', description: 'RDBMS 마이그레이션' },
    ],
  },

  {
    id: 'C8-07-rdb-backup',
    code: 'C8',
    title: 'RDBMS Backup',
    description: 'RDBMS 데이터베이스를 백업한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-07-rdb-backup.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-RDB-03', status: 'ready', description: 'RDBMS 백업' },
    ],
  },

  {
    id: 'C8-08-rdb-restore',
    code: 'C8',
    title: 'RDBMS Restore',
    description: 'RDBMS 백업에서 데이터베이스를 복원한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-08-rdb-restore.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-RDB-04', status: 'ready', description: 'RDBMS 복원' },
    ],
  },

  // NRDBMS (4종)
  {
    id: 'C8-09-nrdb-generate',
    code: 'C8',
    title: 'NRDBMS 데이터 생성',
    description: 'NoRDBMS에 테스트 데이터를 생성(Generate)한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-09-nrdb-generate.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-NRDB-01', status: 'ready', description: 'NoRDBMS 데이터 생성 (Generate)' },
    ],
  },

  {
    id: 'C8-10-nrdb-migration',
    code: 'C8',
    title: 'NRDBMS Migration',
    description: 'NoRDBMS 데이터를 다른 인스턴스로 마이그레이션한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-10-nrdb-migration.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-NRDB-02', status: 'ready', description: 'NoRDBMS 마이그레이션' },
    ],
  },

  {
    id: 'C8-11-nrdb-backup',
    code: 'C8',
    title: 'NRDBMS Backup',
    description: 'NoRDBMS 데이터베이스를 백업한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-11-nrdb-backup.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-NRDB-03', status: 'ready', description: 'NoRDBMS 백업' },
    ],
  },

  {
    id: 'C8-12-nrdb-restore',
    code: 'C8',
    title: 'NRDBMS Restore',
    description: 'NoRDBMS 백업에서 데이터베이스를 복원한다.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data/C8-12-nrdb-restore.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-NRDB-04', status: 'ready', description: 'NoRDBMS 복원' },
    ],
  },

  // ── C9: 클라우드 비용 분석 ────────────────────────────────────────────────
  {
    id: 'C9-01-cost-analysis',
    code: 'C9',
    title: '클라우드 비용 확인',
    description: 'Cost Analysis iframe에서 당월 청구 및 Top5 비용을 확인한다.',
    status: 'ready',
    actor: '과금 관리자',
    specFile: 'deploy/scenarios/C9-cost/C9-01-cost-analysis.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-COSTOPT-BILL-01',   status: 'ready', description: 'API 호스트 조회' },
      { order: 2, tcId: 'TC-COSTOPT-BILL-02',   status: 'ready', description: '당월 청구 조회' },
      { order: 3, tcId: 'TC-COSTOPT-BILL-03',   status: 'ready', description: 'Top5 청구 조회' },
      { order: 4, tcId: 'TC-COSTOPT-IFRAME-01', status: 'ready', description: 'Cost Analysis iframe 확인' },
    ],
  },

  // ── C10: 정리 / Cleanup ───────────────────────────────────────────────────
  {
    id: 'C10-01-wf-infra-delete',
    code: 'C10',
    title: 'WF로 인프라 삭제',
    description: '워크플로우를 통해 MCI 인프라를 자동으로 삭제한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C10-cleanup/C10-01-wf-infra-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-03',      status: 'ready', description: '인프라 삭제 Workflow 정의 확인' },
      { order: 2, tcId: 'TC-WF-FLOW-06',      status: 'ready', description: '인프라 삭제 Workflow 실행' },
      { order: 3, tcId: 'TC-INFRA-DEPLOY-01', status: 'ready', description: 'MCI 삭제 확인' },
    ],
  },

  {
    id: 'C10-02-wf-k8s-delete',
    code: 'C10',
    title: 'WF로 K8s 삭제',
    description: 'K8s 삭제 Workflow를 실행하여 K8s 클러스터를 삭제한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C10-cleanup/C10-02-wf-k8s-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WF-FLOW-03',   status: 'ready', description: 'K8s 삭제 Workflow 존재 확인' },
      { order: 2, tcId: 'TC-WF-FLOW-06',   status: 'ready', description: 'K8s 삭제 Workflow 실행' },
      { order: 3, tcId: 'TC-INFRA-K8S-08', status: 'ready', description: 'K8s 클러스터 삭제 완료 확인', variant: 'tencent' },
    ],
  },

  {
    id: 'C10-03-mci-per-csp-delete',
    code: 'C10',
    title: 'CSP별 MCI 삭제 (자동화)',
    description: 'CSP별 MCI(mci11~mci18)를 순서대로 삭제한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C10-cleanup/C10-03-mci-per-csp-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'AWS MCI(mci11) 삭제',     variant: 'aws' },
      { order: 2, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'Azure MCI(mci12) 삭제',   variant: 'azure' },
      { order: 3, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'GCP MCI(mci13) 삭제',     variant: 'gcp' },
      { order: 4, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'Alibaba MCI(mci14) 삭제', variant: 'ali' },
      { order: 5, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'IBM MCI(mci15) 삭제',     variant: 'ibm' },
      { order: 6, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'NHN MCI(mci16) 삭제',     variant: 'nhn' },
      { order: 7, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'Tencent MCI(mci17) 삭제', variant: 'tencent' },
      { order: 8, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'NCP MCI(mci18) 삭제',     variant: 'ncp' },
    ],
  },

  {
    id: 'C10-04-mci-multi-csp-delete',
    code: 'C10',
    title: 'Multi-CSP MCI 삭제',
    description: 'C4-01-mci-multi-csp-cluster 가 생성한 Multi-CSP MCI(mci-multi)를 삭제한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C10-cleanup/C10-04-mci-multi-csp-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-LC-02', status: 'ready', description: 'Multi-CSP MCI(mci-multi) 삭제', variant: 'multi-csp' },
    ],
  },

  {
    id: 'C10-05-mci-cleanup',
    code: 'C10',
    title: 'mc* MCI 일괄 삭제 (case 분류)',
    description: '이름이 mc로 시작하는 모든 MCI를 Total Servers 수(0/1/2+)로 case 분류하여 일괄 삭제한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C10-cleanup/C10-05-mci-cleanup.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-LC-03', status: 'ready', description: 'mc* MCI 스캔 → case1/2/3 분류 → 전체 삭제' },
    ],
  },

  {
    id: 'C10-06-k8s-per-csp-delete',
    code: 'C10',
    title: 'CSP별 K8s 클러스터(PMK) 삭제',
    description: 'C4-02-k8s-* 가 생성한 CSP별 K8s 클러스터를 순서대로 삭제한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C10-cleanup/C10-06-k8s-per-csp-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-08', status: 'todo',  description: 'AWS PMK 삭제',     variant: 'aws' },
      { order: 2, tcId: 'TC-INFRA-K8S-08', status: 'todo',  description: 'Azure PMK 삭제',   variant: 'azure' },
      { order: 3, tcId: 'TC-INFRA-K8S-08', status: 'todo',  description: 'GCP PMK 삭제',     variant: 'gcp' },
      { order: 4, tcId: 'TC-INFRA-K8S-08', status: 'todo',  description: 'Alibaba PMK 삭제', variant: 'ali' },
      { order: 5, tcId: 'TC-INFRA-K8S-08', status: 'wip',   description: 'IBM PMK 삭제',     variant: 'ibm' },
      { order: 6, tcId: 'TC-INFRA-K8S-08', status: 'todo',  description: 'NHN PMK 삭제',     variant: 'nhn' },
      { order: 7, tcId: 'TC-INFRA-K8S-08', status: 'ready', description: 'Tencent PMK 삭제', variant: 'tencent' },
      { order: 8, tcId: 'TC-INFRA-K8S-08', status: 'ready', description: 'NCP PMK 삭제',     variant: 'ncp' },
    ],
  },
];
