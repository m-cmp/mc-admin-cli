/**
 * deploy/params/base/tc/workflow/TC-WF-FLOW-03.params.ts
 * TC-WF-FLOW-03: 워크플로우 생성 (정의)
 * TC-WF-FLOW-06: 워크플로우 실행   (같은 파일 공유)
 * TC-WF-FLOW-05: 워크플로우 삭제   (같은 파일 공유)
 *
 * 워크플로우 이름-역할 매핑:
 *   vm-mariadb-backup-import-data-init   — 단일 CSP 인프라 배포 + SW(mariadb) 설치
 *   vm-mariadb-data-init-cleanup         — 단일 CSP 인프라 삭제           ↑ 쌍
 *
 *   multi-csp-vm-deploy                  — 다중 CSP 인프라 배포
 *   multi-csp-vm-cleanup                 — 다중 CSP 인프라 삭제            ↑ 쌍
 *
 *   k8s-mariadb-backup-import-data-init  — 단일 CSP 클러스터 배포 + SW 설치
 *   k8s-mariadb-data-init-cleanup        — 단일 CSP 클러스터 삭제          ↑ 쌍
 *
 *   multi-csp-k8s-cluster-deploy         — 다중 CSP 클러스터 배포
 *   multi-csp-k8s-cluster-cleanup        — 다중 CSP 클러스터 삭제          ↑ 쌍
 *
 * 런타임 OUT params (TC-WF-FLOW-03):
 *   store.set('workflowId',   생성/조회된 workflow ID)
 *   store.set('workflowName', workflowName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    // 기본값 — 시나리오 params(Layer 3) 또는 PW_workflowName(Layer 4)로 덮어씀
    workflowName:        'vm-mariadb-backup-import-data-init',
    workflowDescription: '단일 CSP 인프라 배포 + SW 설치',
  },

  variants: {
    // ── VM 인프라 ────────────────────────────────────────────────────────────
    'infra-single': {
      workflowName:        'vm-mariadb-backup-import-data-init',
      workflowDescription: '단일 CSP 인프라 배포 + mariadb 설치',
    },
    'infra-single-cleanup': {
      workflowName:        'vm-mariadb-data-init-cleanup',
      workflowDescription: '단일 CSP 인프라 삭제',
    },
    'infra-multi': {
      workflowName:        'multi-csp-vm-deploy',
      workflowDescription: '다중 CSP 인프라 배포 (8종)',
    },
    'infra-multi-cleanup': {
      workflowName:        'multi-csp-vm-cleanup',
      workflowDescription: '다중 CSP 인프라 삭제 (8종)',
    },

    // ── K8s 클러스터 ─────────────────────────────────────────────────────────
    'k8s-single': {
      workflowName:        'k8s-mariadb-backup-import-data-init',
      workflowDescription: '단일 CSP 클러스터 배포 + mariadb Helm 설치',
    },
    'k8s-single-cleanup': {
      workflowName:        'k8s-mariadb-data-init-cleanup',
      workflowDescription: '단일 CSP 클러스터 삭제',
    },
    'k8s-multi': {
      workflowName:        'multi-csp-k8s-cluster-deploy',
      workflowDescription: '다중 CSP 클러스터 배포',
    },
    'k8s-multi-cleanup': {
      workflowName:        'multi-csp-k8s-cluster-cleanup',
      workflowDescription: '다중 CSP 클러스터 삭제',
    },
  },
} satisfies TCParams;
