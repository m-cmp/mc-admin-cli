/**
 * TC-WF-EL-05: Event Listener 삭제
 * eventListenerName이 비어 있으면 store의 elName을 사용
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    eventListenerName: '',
  },
} satisfies TCParams;
