/**
 * deploy/params/base/tc/data/TC-DATA-RDB-01.params.ts
 * TC-DATA-RDB-01 ~ 04: RDBMS Generate / Migrate / Backup / Restore
 */
import type { TCParams } from '../../../types';
import { AWS_RDB, ALIBABA_RDB, DATA_MANAGER_DEFAULTS } from './connections';

export default {
  base: {
    ...DATA_MANAGER_DEFAULTS,
    sourcePoint: AWS_RDB,
    targetPoint: ALIBABA_RDB,
    rdbName:     'tc-rdb-e2e',
    dbType:      'mysql',
    dbVersion:   '8.0',
  },
  variants: {
    aws: {
      sourcePoint: AWS_RDB,
    },
    alibaba: {
      targetPoint: ALIBABA_RDB,
    },
  },
} satisfies TCParams;
