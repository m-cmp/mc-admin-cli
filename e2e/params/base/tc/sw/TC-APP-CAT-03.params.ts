/**
 * deploy/params/base/tc/sw/TC-APP-CAT-03.params.ts
 * TC-APP-CAT-03: 외부 검색 결과 표시 (DockerHub/ArtifactHub)
 *
 * 런타임 OUT params:
 *   store.set('searchKeyword', keyword)   — TC-APP-CAT-04에서 사용
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    searchKeyword: 'ghost',
  },
} satisfies TCParams;
