/**
 * deploy/params/base/tc/sw/TC-APP-REP-02.params.ts
 * TC-APP-REP-02: Repository 신규 생성
 *
 * variant 'api' / 'ui:helm' / 'ui:docker' 세 케이스에 대응
 *
 * 런타임 OUT params:
 *   store.set('helmRepoName',   helmRepoName)
 *   store.set('dockerRepoName', dockerRepoName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    helmRepoName:   'e2e-repo-helm',
    dockerRepoName: 'e2e-repo-docker',
    blobStoreName:  'default',
    writePolicy:    'allow',
  },
  variants: {
    api: {
      // API 케이스: helm + docker 모두 생성
      helmRepoName:   'e2e-repo-helm',
      dockerRepoName: 'e2e-repo-docker',
    },
    'ui:helm': {
      repoName:   'e2e-ui-helm',
      repoFormat: 'helm',
      repoType:   'hosted',
    },
    'ui:docker': {
      repoName:   'e2e-ui-docker',
      repoFormat: 'docker',
      repoType:   'hosted',
      httpPort:   null,
      httpsPort:  null,
    },
  },
} satisfies TCParams;
