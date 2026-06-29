/**
 * deploy/params/base/tc/workflow/TC-WF-EL-01.params.ts
 * TC-WF-EL-01: Event Listener 목록 조회
 *
 * 워크플로우 관리 화면(iframe) > Event Listener 탭 진입 후
 * 목록 로드를 확인한다.
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    // 필터링 확인에 사용할 EL 이름 (빈 문자열이면 단순 탭 진입만 확인)
    eventListenerName: '',
  },
} satisfies TCParams;
