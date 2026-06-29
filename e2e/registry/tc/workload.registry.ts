/**
 * deploy/registry/tc/workload.registry.ts
 * WORKLOAD 도메인 TC 전체 목록 (3개)
 *
 * Feature 코드:
 *   INFRA-K8S    — PMK K8s KubeConfig 관련
 *   WORKLOAD-MCI — MCI 터미널·파일 전송
 *
 * 주의: TC 이름은 INFRA-K8S / WORKLOAD-MCI 이지만 폴더는 mc-web-console/specs/workload/ 이다.
 */
import type { TCEntry } from '../types';

export const WORKLOAD_TC_REGISTRY: TCEntry[] = [
  { id: 'TC-INFRA-K8S-07',      domain: 'workload', feature: 'INFRA-K8S',    title: 'PMK KubeConfig 클립보드 복사', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/workload/TC-INFRA-K8S-07-pmk-kubeconfig-copy.spec.ts' },
  { id: 'TC-WORKLOAD-MCI-01',   domain: 'workload', feature: 'WORKLOAD-MCI', title: 'MCI 터미널 접속·명령 실행',    status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/workload/TC-WORKLOAD-MCI-01-mci-terminal.spec.ts' },
  { id: 'TC-WORKLOAD-MCI-02',   domain: 'workload', feature: 'WORKLOAD-MCI', title: 'MCI 파일 전송',                status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/workload/TC-WORKLOAD-MCI-02-mci-file-transfer.spec.ts' },
];
