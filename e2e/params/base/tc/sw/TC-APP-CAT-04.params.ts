/**
 * deploy/params/base/tc/sw/TC-APP-CAT-04.params.ts
 * TC-APP-CAT-04: 외부 검색 결과 업로드 (DockerHub → 내부 패키지 레지스트리)
 *
 * 런타임 IN params:
 *   store.getOrDefault('searchKeyword', base.searchKeyword)   — TC-APP-CAT-03 OUT
 *
 * 런타임 OUT params:
 *   store.set('uploadedPackageName', name)   — TC-APP-CAT-05에서 사용
 *   store.set('uploadedTag', tag)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    searchKeyword: 'ghost',
    sourceType:    'DockerHub',        // 'DockerHub' | 'ArtifactHub'
    uploadTag:     'bookworm',         // Upload Application 팝업에서 선택할 Tag (부분 매칭)
    packageName:   'ghost',            // 업로드 후 패키지 목록에서 확인할 이름
  },
} satisfies TCParams;
