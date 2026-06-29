/**
 * deploy/params/base/tc/sw/TC-APP-CAT-05.params.ts
 * TC-APP-CAT-05: Catalog 신규 등록 (Regist 버튼)
 * TC-APP-CAT-06: Catalog 수정   (같은 파일 공유)
 * TC-APP-CAT-07: Catalog 삭제   (같은 파일 공유)
 *
 * Wizard → Package Tab:
 *   Target   : VM
 *   Category : Content Management System
 *   Package  : ghost  (TC-APP-CAT-04 Upload 결과물)
 *   Version  : bookworm (부분 매칭)
 *
 * 런타임 IN params:
 *   store.getOrDefault('uploadedPackageName', base.packageName)   — TC-APP-CAT-04 OUT
 *
 * 런타임 OUT params:
 *   store.set('catalogName', packageName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    target:      'VM',
    category:    'Content Management System',
    packageName: 'ghost',
    version:     'bookworm',    // 버전 드롭다운에서 이 문자열을 포함하는 항목 선택
  },
} satisfies TCParams;
