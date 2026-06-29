/**
 * deploy/scenarios/C4-svc-direct/C4-01-mci-multi-csp-cluster.spec.ts
 * [C4-01] MCI 배포 — Multi-CSP 통합 + Clustering SubGroup
 *
 * 여러 CSP의 VM을 1개 MCI에 통합 생성하고,
 * Clustering용 NodeGroup에 N개 VM을 Expert 모드로 추가한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-INFRA-DEPLOY-05 (variant:multi)    Multi-CSP VM → 1개 MCI 생성
 *   Step 2. TC-INFRA-DEPLOY-07 (variant:cluster)  Clustering NodeGroup N개 VM 추가 (Expert)
 *   Step 3. TC-INFRA-DEPLOY-01                    모든 VM Running 상태 확인
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C4-01-mci-multi-csp-cluster');
