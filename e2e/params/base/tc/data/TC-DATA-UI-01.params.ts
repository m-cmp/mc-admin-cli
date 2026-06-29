import type { TCParams } from '../../../types';
import { DATA_MANAGER_DEFAULTS } from './connections';

export default {
  base: {
    ...DATA_MANAGER_DEFAULTS,
    pageUrl: '/webconsole/operations/manage/datamigrations',
  },
} satisfies TCParams;
