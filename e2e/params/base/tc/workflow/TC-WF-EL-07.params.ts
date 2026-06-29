/**
 * TC-WF-EL-07: Event Listener를 통한 Workflow 실행 (POST)
 * eventListenerName이 비어 있으면 store의 elName을 사용
 * triggerBody: POST 요청 바디 (key-value)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    eventListenerName: '',
    triggerBody: {},
  },
} satisfies TCParams;
