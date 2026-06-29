/**
 * TC-WF-EL-06: Event Listener를 통한 Workflow 실행 (GET)
 * eventListenerName이 비어 있으면 store의 elName을 사용
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    eventListenerName: '',
  },
} satisfies TCParams;
