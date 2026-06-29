/**
 * deploy/params/base/tc/workload/TC-WORKLOAD-MCI-01.params.ts
 * TC-WORKLOAD-MCI-01: MCI 터미널 접속·명령 실행
 *
 * 런타임 IN params:
 *   store.require('mciId')   — TC-INFRA-DEPLOY-05 OUT
 *   store.require('mciName') — TC-INFRA-DEPLOY-05 OUT
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:     'default',
    // mciId, mciName 은 런타임 스토어에서 주입
    command:  'echo hello-e2e && uptime',
    username: 'cb-user',
    sshPort:  22,
  },
} satisfies TCParams;
