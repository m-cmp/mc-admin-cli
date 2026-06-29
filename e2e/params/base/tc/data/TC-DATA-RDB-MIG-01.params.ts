import type { TCParams } from '../../../types';
import { AWS_RDB, ALIBABA_RDB, DATA_MANAGER_DEFAULTS } from './connections';

export default {
  base: {
    ...DATA_MANAGER_DEFAULTS,
    sourcePoint: AWS_RDB,
    targetPoint: ALIBABA_RDB,
  },
} satisfies TCParams;
