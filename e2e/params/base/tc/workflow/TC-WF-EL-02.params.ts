/**
 * deploy/params/base/tc/workflow/TC-WF-EL-02.params.ts
 * TC-WF-EL-02: Event Listener 생성 (워크플로우 연결)
 * TC-WF-EL-05: GET Trigger URL로 워크플로우 실행 (같은 파일 공유)
 *
 * 워크플로우 관리 화면(iframe) > Event Listener 탭에서
 * EL을 생성하고 대상 워크플로우와 연결한다.
 *
 * 런타임 OUT params (TC-WF-EL-02):
 *   store.set('elName', eventListenerName)   — 생성된 EL 이름
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    // 생성할 Event Listener 이름
    eventListenerName: 'infra-create-el',
    // 연결할 워크플로우 이름 (TC-WF-FLOW-03 workflowName과 동일해야 함)
    workflowName:      'vm-mariadb-backup-import-data-init',
  },
} satisfies TCParams;
