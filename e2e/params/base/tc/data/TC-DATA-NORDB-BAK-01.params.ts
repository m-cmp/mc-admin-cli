import type { TCParams } from '../../../types';
import { ALIBABA_NRDB, DATA_MANAGER_DEFAULTS } from './connections';

export default {
  base: {
    ...DATA_MANAGER_DEFAULTS,
    ...ALIBABA_NRDB,
  },
} satisfies TCParams;
