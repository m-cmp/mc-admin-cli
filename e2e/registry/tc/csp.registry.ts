/**
 * deploy/registry/tc/csp.registry.ts
 * CSP 도메인 TC 전체 목록 (44개)
 *
 * Feature 코드:
 *   CONNECTION   — CSP 연결 관리
 *   CREDENTIAL   — CSP 인증 자격증명
 *   IMG          — 서버 이미지 관리
 *   IMPORT-DISK  — 데이터 디스크 가져오기
 *   IMPORT-NET   — VNet 가져오기
 *   IMPORT-SG    — 보안그룹 가져오기
 *   IMPORT-SSH   — SSH 키 가져오기
 *   IMPORT-VM    — VM 가져오기 (5단계 워크플로우)
 *   KEY          — SSH 키 관리
 *   SG           — 보안그룹 관리
 *   SPEC         — 서버 스펙 관리
 *   VPC          — VPC 관리
 */
import type { TCEntry } from '../types';

export const CSP_TC_REGISTRY: TCEntry[] = [

  // ── CONNECTION (3) ───────────────────────────────────────────────────────
  { id: 'TC-CSP-CONNECTION-01', domain: 'csp', feature: 'CONNECTION', title: 'CSP 연결 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-CONNECTION-01-list-connections.spec.ts' },
  { id: 'TC-CSP-CONNECTION-02', domain: 'csp', feature: 'CONNECTION', title: 'CSP 연결 생성', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-CONNECTION-02-create-connection.spec.ts' },
  { id: 'TC-CSP-CONNECTION-03', domain: 'csp', feature: 'CONNECTION', title: 'CSP 연결 삭제', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-CONNECTION-03-delete-connection.spec.ts' },

  // ── CREDENTIAL → TC-INFRA-CSP-* 로 이관 (infra.registry.ts 참조) ──────────

  // ── IMG (4) ──────────────────────────────────────────────────────────────
  { id: 'TC-CSP-IMG-01', domain: 'csp', feature: 'IMG', title: '서버 이미지 목록 표시', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMG-01-server-image-목록-표시.spec.ts' },
  { id: 'TC-CSP-IMG-02', domain: 'csp', feature: 'IMG', title: '이미지 등록 팝업·자동채움·등록', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMG-02-register-image-팝업-선택-자동채움-등록.spec.ts' },
  { id: 'TC-CSP-IMG-03', domain: 'csp', feature: 'IMG', title: '이미지 행 클릭·상세 패널', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMG-03-image-행-클릭-상세-패널.spec.ts' },
  { id: 'TC-CSP-IMG-04', domain: 'csp', feature: 'IMG', title: '이미지 삭제·패널 닫힘', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMG-04-delete-image-패널-닫힘.spec.ts' },

  // ── IMPORT-DISK (2) ──────────────────────────────────────────────────────
  { id: 'TC-CSP-IMPORT-DISK-01', domain: 'csp', feature: 'IMPORT-DISK', title: '데이터디스크 가져오기 버튼·모달 오픈', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-DISK-01-import-datadisk-버튼-모달-오픈.spec.ts' },
  { id: 'TC-CSP-IMPORT-DISK-02', domain: 'csp', feature: 'IMPORT-DISK', title: '연결 선택 후 데이터디스크 가져오기 성공', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-DISK-02-connection-선택-후-datadisk-import-성공.spec.ts' },

  // ── IMPORT-NET (3) ───────────────────────────────────────────────────────
  { id: 'TC-CSP-IMPORT-NET-01', domain: 'csp', feature: 'IMPORT-NET', title: 'VNet 가져오기 버튼·모달 오픈', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-NET-01-import-vnet-버튼-모달-오픈.spec.ts' },
  { id: 'TC-CSP-IMPORT-NET-02', domain: 'csp', feature: 'IMPORT-NET', title: '미관리·등록됨 VNet 구분 표시', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-NET-02-미관리-등록됨-vnet-구분-표시.spec.ts' },
  { id: 'TC-CSP-IMPORT-NET-03', domain: 'csp', feature: 'IMPORT-NET', title: '미관리 VNet 선택 후 가져오기 성공', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-NET-03-미관리-vnet-선택-후-import-성공.spec.ts' },

  // ── IMPORT-SG (3) ────────────────────────────────────────────────────────
  { id: 'TC-CSP-IMPORT-SG-01', domain: 'csp', feature: 'IMPORT-SG', title: '보안그룹 가져오기 버튼·모달 오픈', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-SG-01-import-securitygroup-버튼-모달-오픈.spec.ts' },
  { id: 'TC-CSP-IMPORT-SG-02', domain: 'csp', feature: 'IMPORT-SG', title: '연결 선택 후 보안그룹 가져오기 성공', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-SG-02-connection-선택-후-sg-import-성공.spec.ts' },
  { id: 'TC-CSP-IMPORT-SG-03', domain: 'csp', feature: 'IMPORT-SG', title: '연결 미선택 시 가져오기 경고', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-SG-03-connection-미선택-시-import-경고.spec.ts' },

  // ── IMPORT-SSH (2) ───────────────────────────────────────────────────────
  { id: 'TC-CSP-IMPORT-SSH-01', domain: 'csp', feature: 'IMPORT-SSH', title: 'SSH 키 가져오기 버튼·모달 오픈', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-SSH-01-import-ssh-key-버튼-모달-오픈.spec.ts' },
  { id: 'TC-CSP-IMPORT-SSH-02', domain: 'csp', feature: 'IMPORT-SSH', title: '연결 선택 후 SSH 키 가져오기 성공', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-SSH-02-connection-선택-후-ssh-key-import-성공.spec.ts' },

  // ── IMPORT-VM (5) ────────────────────────────────────────────────────────
  { id: 'TC-CSP-IMPORT-VM-01', domain: 'csp', feature: 'IMPORT-VM', title: 'VM 가져오기 버튼 표시·Step1 모달 오픈', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-VM-01-import-vm-버튼-표시-step1-모달-오픈.spec.ts' },
  { id: 'TC-CSP-IMPORT-VM-02', domain: 'csp', feature: 'IMPORT-VM', title: '연결 선택 후 VM 목록 조회', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-VM-02-connection-선택-후-vm-목록-조회.spec.ts' },
  { id: 'TC-CSP-IMPORT-VM-03', domain: 'csp', feature: 'IMPORT-VM', title: 'VM 선택 후 Step2 전환·의존 자원 상태', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-VM-03-vm-선택-후-step2-전환-의존-자원-상태.spec.ts' },
  { id: 'TC-CSP-IMPORT-VM-04', domain: 'csp', feature: 'IMPORT-VM', title: 'Step3 MCI 이름 입력 후 가져오기 성공', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-VM-04-step3-mci-이름-입력-후-import-성공.spec.ts' },
  { id: 'TC-CSP-IMPORT-VM-05', domain: 'csp', feature: 'IMPORT-VM', title: 'MCI 이름 미입력 경고', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-IMPORT-VM-05-mci-이름-미입력-경고.spec.ts' },

  // ── KEY (3) ──────────────────────────────────────────────────────────────
  { id: 'TC-CSP-KEY-01', domain: 'csp', feature: 'KEY', title: 'SSH 키 목록 표시', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-KEY-01-ssh-key-목록-표시.spec.ts' },
  { id: 'TC-CSP-KEY-02', domain: 'csp', feature: 'KEY', title: 'SSH 키 생성·Private Key Alert 포함', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-KEY-02-ssh-key-생성-private-key-alert-포함.spec.ts' },
  { id: 'TC-CSP-KEY-03', domain: 'csp', feature: 'KEY', title: 'Private Key blur 마스킹·togglePrivateKey', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-KEY-03-private-key-blur-마스킹-toggleprivatekey.spec.ts' },

  // ── SG (4) ───────────────────────────────────────────────────────────────
  { id: 'TC-CSP-SG-01', domain: 'csp', feature: 'SG', title: '보안그룹 목록 표시', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SG-01-security-group-목록-표시.spec.ts' },
  { id: 'TC-CSP-SG-02', domain: 'csp', feature: 'SG', title: '보안그룹 행 클릭·상세 패널·방화벽 규칙', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SG-02-sg-행-클릭-상세-패널-방화벽-규칙.spec.ts' },
  { id: 'TC-CSP-SG-03', domain: 'csp', feature: 'SG', title: '보안그룹 생성·방화벽 룰 포함', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SG-03-create-security-group-방화벽-룰-포함-생성-성공.spec.ts' },
  { id: 'TC-CSP-SG-04', domain: 'csp', feature: 'SG', title: '보안그룹 삭제·패널 닫힘', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SG-04-delete-security-group-패널-닫힘.spec.ts' },

  // ── SPEC (4) ─────────────────────────────────────────────────────────────
  { id: 'TC-CSP-SPEC-01', domain: 'csp', feature: 'SPEC', title: '서버 스펙 목록 표시', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SPEC-01-server-spec-목록-표시.spec.ts' },
  { id: 'TC-CSP-SPEC-02', domain: 'csp', feature: 'SPEC', title: '스펙 등록 팝업·자동채움·등록', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SPEC-02-register-spec-팝업-선택-자동채움-등록.spec.ts' },
  { id: 'TC-CSP-SPEC-03', domain: 'csp', feature: 'SPEC', title: '스펙 행 클릭·상세 패널', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SPEC-03-spec-행-클릭-상세-패널.spec.ts' },
  { id: 'TC-CSP-SPEC-04', domain: 'csp', feature: 'SPEC', title: '스펙 삭제·패널 닫힘', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-SPEC-04-delete-spec-패널-닫힘.spec.ts' },

  // ── VPC (7) ──────────────────────────────────────────────────────────────
  { id: 'TC-CSP-VPC-01', domain: 'csp', feature: 'VPC', title: 'VPC 목록 표시', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-01-vpc-목록-표시.spec.ts' },
  { id: 'TC-CSP-VPC-02', domain: 'csp', feature: 'VPC', title: 'VPC 행 클릭·상세 패널·Subnet 테이블', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-02-vpc-행-클릭-상세-패널-subnet-테이블.spec.ts' },
  { id: 'TC-CSP-VPC-03', domain: 'csp', feature: 'VPC', title: 'VPC 생성·모달·Subnet 포함', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-03-create-vpc-모달-subnet-포함-생성-성공.spec.ts' },
  { id: 'TC-CSP-VPC-04', domain: 'csp', feature: 'VPC', title: 'VPC 삭제·Confirm·패널 닫힘', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-04-delete-vpc-confirm-패널-닫힘.spec.ts' },
  { id: 'TC-CSP-VPC-05', domain: 'csp', feature: 'VPC', title: 'Edit 버튼·Edit Form 전환·Cancel', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-05-edit-버튼-edit-form-전환-cancel.spec.ts' },
  { id: 'TC-CSP-VPC-06', domain: 'csp', feature: 'VPC', title: 'Subnet 추가·postSubnet API 호출', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-06-subnet-추가-postsubnet-api-호출.spec.ts' },
  { id: 'TC-CSP-VPC-07', domain: 'csp', feature: 'VPC', title: 'Subnet 삭제·delSubnet API 호출', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/csp/TC-CSP-VPC-07-subnet-삭제-delsubnet-api-호출.spec.ts' },
];
