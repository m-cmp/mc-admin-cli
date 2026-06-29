import type { TCParams } from '../../../types';
import { ALIBABA_NRDB, DATA_MANAGER_DEFAULTS } from './connections';

export default {
  base: {
    ...DATA_MANAGER_DEFAULTS,
    ...ALIBABA_NRDB,
    mongoHost:     ALIBABA_NRDB.host,
    mongoPort:     ALIBABA_NRDB.port,
    mongoUser:     ALIBABA_NRDB.username,
    mongoPassword: ALIBABA_NRDB.password,
  },
} satisfies TCParams;
