/**
 * deploy/params/base/scenarios/C8-001.params.ts
 * C8-001: 데이터 백업·복구·마이그레이션 시나리오 (mc-data-manager)
 */
import type { ScenarioStaticParams } from '../../types';
import { AWS_RDB, ALIBABA_RDB, ALIBABA_NRDB, DATA_MANAGER_DEFAULTS } from '../tc/data/connections';

export default {
  global: {
    dataManagerBaseUrl: DATA_MANAGER_DEFAULTS.dataManagerBaseUrl,
  },
  steps: {
    'TC-DATA-OBJ-MIG-01': {
      dataManagerBaseUrl: DATA_MANAGER_DEFAULTS.dataManagerBaseUrl,
    },
    'TC-DATA-OBJ-BAK-01': {
      dataManagerBaseUrl: DATA_MANAGER_DEFAULTS.dataManagerBaseUrl,
    },
    'TC-DATA-RDB-MIG-01': {
      sourcePoint: AWS_RDB,
      targetPoint: ALIBABA_RDB,
    },
    'TC-DATA-RDB-BAK-01': {
      sourcePoint: AWS_RDB,
    },
    'TC-DATA-NORDB-MIG-01': {
      ...ALIBABA_NRDB,
      mongoHost:     ALIBABA_NRDB.host,
      mongoPort:     ALIBABA_NRDB.port,
      mongoUser:     ALIBABA_NRDB.username,
      mongoPassword: ALIBABA_NRDB.password,
    },
    'TC-DATA-NORDB-BAK-01': {
      ...ALIBABA_NRDB,
    },
  },
} satisfies ScenarioStaticParams;
