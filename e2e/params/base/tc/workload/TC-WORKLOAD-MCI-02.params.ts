/**
 * deploy/params/base/tc/workload/TC-WORKLOAD-MCI-02.params.ts
 * TC-WORKLOAD-MCI-02: MCI 파일 전송
 *
 * 런타임 IN params:
 *   store.require('mciId')   — TC-INFRA-DEPLOY-05 OUT
 *   store.require('mciName') — TC-INFRA-DEPLOY-05 OUT
 */
import * as os from 'os';
import * as path from 'path';
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:          'default',
    // mciId, mciName 은 런타임 스토어에서 주입
    localFilePath:  path.join(os.tmpdir(), 'tc-transfer-test.txt'),
    remoteFilePath: '/home/cb-user/tc-transfer-test.txt',
    username:       'cb-user',
    sshPort:        22,
  },
} satisfies TCParams;
