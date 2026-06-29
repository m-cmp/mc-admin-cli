/**
 * deploy/params/base/tc/data/TC-DATA-NRDB-01.params.ts
 * TC-DATA-NRDB-01 ~ 04: NoRDBMS Generate / Migrate / Backup / Restore
 */
import type { TCParams } from '../../../types';
import { AWS_NRDB, ALIBABA_NRDB, DATA_MANAGER_DEFAULTS } from './connections';

export default {
  base: {
    ...DATA_MANAGER_DEFAULTS,
    awsNrdb:     AWS_NRDB,
    alibabaNrdb: ALIBABA_NRDB,
  },
  variants: {
    aws: {
      nrdb: AWS_NRDB,
    },
    alibaba: {
      nrdb: ALIBABA_NRDB,
    },
  },
} satisfies TCParams;
