/**
 * TC-WF-EL-04: Event Listener 상세 수정
 * eventListenerName이 비어 있으면 store의 elName을 사용
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    eventListenerName: '',
  },
} satisfies TCParams;
