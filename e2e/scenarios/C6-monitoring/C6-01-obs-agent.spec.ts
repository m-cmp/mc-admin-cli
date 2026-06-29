/**
 * deploy/scenarios/C6-01-obs-agent.spec.ts
 * [C6-01] OBS Agent 관리
 *
 * 운영 중인 MCI에 모니터링 Agent를 설치·확인·플러그인 등록 후 제거한다.
 *
 * actor:  SRE 엔지니어
 * status: ready
 *
 * 스텝:
 *   Step 1. TC-OBS-AGENT-01  등록 가능 Node 조회(Config)
 *   Step 2. TC-OBS-AGENT-02  Agent 설치                 ← mciId 필수
 *   Step 3. TC-OBS-AGENT-03  Agent 설치 상태 폴링       [todo]
 *   Step 4. TC-OBS-AGENT-04  모니터링 플러그인(item) 등록 [todo]
 *   Step 5. TC-OBS-AGENT-05  Agent 제거                 [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C6-01-obs-agent');
