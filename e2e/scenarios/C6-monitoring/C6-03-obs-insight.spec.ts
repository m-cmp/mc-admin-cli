/**
 * deploy/scenarios/C6-03-obs-insight.spec.ts
 * [C6-03] OBS Insight 분석
 *
 * Anomaly Detection 설정 → History 조회 → Prediction(예측) → LLM 서버 오류 분석
 *
 * actor:  SRE 엔지니어
 * status: partial (Step 1 ready / Step 2~4 todo — API discovery 필요)
 *
 * 스텝:
 *   Step 1. TC-OBS-INSIGHT-01  Anomaly Detection 설정     ← mciId 필수
 *   Step 2. TC-OBS-INSIGHT-02  Anomaly History 조회        [todo]
 *   Step 3. TC-OBS-INSIGHT-03  Prediction(예측)            [todo]
 *   Step 4. TC-OBS-INSIGHT-04  Server Error Analysis(LLM)  [todo]
 */
import { bootstrapScenario } from '../shared/createScenarioSuite';

bootstrapScenario('C6-03-obs-insight');
