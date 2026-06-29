/**
 * deploy/params/base/tc/data/TC-DATA-OS-01.params.ts
 * TC-DATA-OS-01 ~ 04: Object Storage CRUD
 *
 * 런타임 OUT params (TC-DATA-OS-01):
 *   store.set('bucketName', bucketName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:           'default',
    connectionName: 'aws-ap-northeast-2',
    bucketName:     'tc-bucket-e2e',
    objectKey:      'tc-test-object.txt',
    objectContent:  'E2E 테스트 오브젝트 내용',
  },
  variants: {
    aws: {
      connectionName: 'aws-ap-northeast-2',
      bucketName:     'tc-bucket-e2e-aws',
    },
    gcp: {
      connectionName: 'gcp-asia-northeast3',
      bucketName:     'tc-bucket-e2e-gcp',
    },
  },
} satisfies TCParams;
