/**
 * TC-WF-EL-03: Event Listener 이름 중복 검사
 * eventListenerName이 비어 있으면 store의 elName을 사용
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    eventListenerName: '',
  },
} satisfies TCParams;
