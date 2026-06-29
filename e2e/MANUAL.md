# deploy/ 테스트 관리 매뉴얼

> 관련 문서: [README.md](../README.md) · [definitions/GUIDE.md](../definitions/GUIDE.md) · [integration/SCENARIOS.md](../integration/SCENARIOS.md)

이 문서는 `deploy/` 폴더의 TC·시나리오·파라미터 관리 방법을 처음 접하는 사람도 따라할 수 있도록 작성한 실무 안내서다.

---

## 전체 구조 한눈에 보기

```
deploy/
├── MANUAL.md                        ← 이 문서
│
├── registry/                        ← TC·시나리오 전체 목록 (권위 있는 원천)
│   ├── types.ts                     ← 공통 타입 정의
│   ├── index.ts                     ← 전체 목록 통합 + 조회 유틸
│   ├── tc/
│   │   ├── iam.registry.ts          ← IAM 도메인 TC 76개
│   │   ├── csp.registry.ts          ← CSP 도메인 TC 44개
│   │   ├── infra.registry.ts        ← INFRA 도메인 TC 11개
│   │   ├── sw.registry.ts           ← SW 도메인 TC 25개
│   │   ├── data.registry.ts         ← DATA 도메인 TC 18개
│   │   ├── obs.registry.ts          ← OBS 도메인 TC 6개
│   │   ├── cost.registry.ts         ← COST 도메인 TC 5개
│   │   ├── workflow.registry.ts     ← WORKFLOW 도메인 TC 5개
│   │   └── workload.registry.ts     ← WORKLOAD 도메인 TC 3개
│   └── scenario/
│       └── scenarios.registry.ts    ← 시나리오 전체 목록
│
├── tc/                              ← TC spec 파일 (도메인 폴더 아래 배치)
│   ├── iam/
│   ├── infra/
│   ├── sw/
│   ├── data/
│   ├── obs/
│   ├── csp/
│   ├── cost/
│   ├── workflow/
│   └── workload/
│
├── scenarios/                       ← 시나리오 spec 파일
│
└── params/                          ← 파라미터 관리
    ├── types.ts
    ├── loader.ts                    ← 4-layer merge 로더
    ├── runtime/
    │   ├── store.ts                 ← 런타임 IN/OUT 저장소
    │   └── context.ts               ← 시나리오 실행 컨텍스트
    ├── base/
    │   ├── tc/{domain}/             ← TC별 기본 파라미터 (repo 커밋)
    │   └── scenarios/               ← 시나리오별 파라미터 (repo 커밋)
    └── env/                         ← 환경별 파라미터 (.gitignore 대상)
        ├── local.params.ts          ← .gitignore (절대 커밋 금지)
        └── local.params.ts_sample   ← 커밋됨 (구조 참조용, 실제 값 없음)
```

---

## § 1. TC 등록 방법

> TC 이름 형식: `TC-{DOMAIN}-{FEATURE}-{NN}[-{DESCRIPTION}]`
> 예: `TC-IAM-AUTH-01`, `TC-INFRA-MCI-03`, `TC-APP-REP-02`

### 1-1. TC spec 파일을 도메인 폴더에 배치한다

TC 이름에 포함된 도메인이 배치 폴더를 결정한다.

| TC 이름의 DOMAIN | 배치 폴더 |
|---|---|
| `TC-IAM-*` | `deploy/tc/iam/` |
| `TC-INFRA-*` | `deploy/tc/infra/` |
| `TC-APP-*` · `TC-SW-*` | `deploy/tc/sw/` |
| `TC-DATA-*` | `deploy/tc/data/` |
| `TC-OBS-*` | `deploy/tc/obs/` |
| `TC-CSP-*` | `deploy/tc/csp/` |
| `TC-COST-*` | `deploy/tc/cost/` |
| `TC-WORKFLOW-*` · `TC-WF-*` | `deploy/tc/workflow/` |
| `TC-WORKLOAD-*` · `TC-INFRA-K8S-*` | `deploy/tc/workload/` |

**같은 기능이라도 variant(CSP·포맷·역할·아키텍처)가 다를 때**는 단일 spec 파일에서 파라미터로 분기하거나, 파일을 나눈다.

- **파라미터로 분기** (권장): 파일은 하나, `TC_VARIANT` 환경변수로 실행 시 분기
- **파일 분리**: variant당 spec 파일이 따로 있고 레지스트리에 `variants[]`로 등록

### 1-2. TC params 파일을 만든다

`deploy/params/base/tc/{domain}/` 아래에 `{TC-ID}.params.ts` 파일을 만든다.

```typescript
// deploy/params/base/tc/infra/TC-INFRA-SSH-KEY-02.params.ts
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:        'default',
    sshKeyName:  'tc-sshkey-temp',
    description: 'E2E temp SSH key',
  },
  // variant 없으면 variants 생략 가능
} satisfies TCParams;
```

variant가 있는 경우 (CSP별, 포맷별 등):

```typescript
// deploy/params/base/tc/infra/TC-INFRA-MCI-03.params.ts
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:           'default',
    mciName:        'tc-mci-temp',
    connectionName: 'aws-ap-northeast-2',   // 기본값 (aws variant)
    commonSpec:     'aws+ap-northeast-2+t2.small',
  },
  variants: {
    aws:   { connectionName: 'aws-ap-northeast-2',  commonSpec: 'aws+ap-northeast-2+t2.small' },
    azure: { connectionName: 'azure-koreacentral',   commonSpec: 'azure+koreacentral+Standard_B1s' },
    gcp:   { connectionName: 'gcp-asia-northeast3',  commonSpec: 'gcp+asia-northeast3+n1-standard-1' },
  },
} satisfies TCParams;
```

### 1-3. 레지스트리에 TC를 등록한다

해당 도메인의 `deploy/registry/tc/{domain}.registry.ts` 파일을 열고 배열에 항목을 추가한다.

**단일 파일 TC** (variant 없음):
```typescript
{
  id:       'TC-INFRA-SSH-KEY-02',
  domain:   'infra',
  feature:  'SSH-KEY',
  title:    'SSH 키 생성',
  status:   'ready',
  channel:  'api+ui',
  specFile: 'deploy/tc/infra/TC-INFRA-SSH-KEY-02.spec.ts',
},
```

**variant 파일이 여럿인 TC** (TC-APP-REP-02 패턴):
```typescript
{
  id:      'TC-APP-REP-02',
  domain:  'sw',
  feature: 'APP-REP',
  title:   'Repository 신규 생성',
  status:  'ready',
  channel: 'api+ui',
  variants: [
    { key: 'api',       channel: 'api', specFile: 'deploy/tc/sw/TC-APP-REP-02-api.spec.ts' },
    { key: 'ui:helm',   channel: 'ui',  specFile: 'deploy/tc/sw/TC-APP-REP-02-ui-helm.spec.ts' },
    { key: 'ui:docker', channel: 'ui',  specFile: 'deploy/tc/sw/TC-APP-REP-02-ui-docker.spec.ts' },
  ],
},
```

**미구현·bypass TC**:
```typescript
{
  id:      'TC-IAM-WORKSPACE-ASSIGN-01',
  domain:  'iam',
  feature: 'WORKSPACE',
  title:   'Workspace Role 할당 (신규 API)',
  status:  'bypass',
  channel: 'api',
  specFile: 'deploy/tc/iam/TC-IAM-WORKSPACE-ASSIGN-01.spec.ts',
  bypass:  { reason: 'assignWorkspaceRole API 미구현', issue: 'ISSUE-009' },
},
```

### 1-4. status 값 규칙

| status | 의미 | spec 파일 있음? | 실행 가능? |
|---|---|---|---|
| `ready` | 구현 완료, 정상 실행 | ✓ | ✓ |
| `wip` | 구현 중 | ✓ (부분) | △ 일부 |
| `todo` | 구현 예정 | ✗ | ✗ |
| `deprecated` | 사용 중단 | ✓ (구버전) | ✗ |

---

## § 2. 시나리오 등록 방법

### 2-1. 시나리오 ID 규칙

```
{CODE}-{slug}
예: C4-service-create-infra, WF-TC1-infra-create
```

| CODE | 범위 |
|---|---|
| C2 | IAM·사용자 관리 |
| C3 | Workflow 기반 서비스 생성 |
| C4 | 직접 서비스 생성 (no workflow) |
| C5 | 서비스 운영·관리 |
| C6 | 모니터링·로깅·트레이싱 |
| C7 | K8s 클러스터 관리 |
| C8 | 데이터 백업·복구·마이그레이션 |
| C9 | 클라우드 비용 분석 |
| WF | 워크플로우 기반 시나리오 |

### 2-2. 시나리오를 레지스트리에 등록한다

`deploy/registry/scenario/scenarios.registry.ts` 배열에 항목을 추가한다.

```typescript
{
  id:          'C4-service-create-infra',
  code:        'C4',
  title:       '글로벌 멀티클라우드 MCI 직접 구성·배포',
  description: '워크플로우 없이 MCI를 직접 생성하고 SW를 배포한다.',
  status:      'ready',
  actor:       'SRE 엔지니어',
  specFile:    'deploy/scenarios/C4-service-create-infra.spec.ts',
  steps: [
    { order: 1, tcId: 'TC-CSP-CREDENTIAL-03', status: 'ready',  description: 'CSP 자격증명 등록' },
    { order: 2, tcId: 'TC-CSP-CONNECTION-02', status: 'ready',  description: 'CSP 연결 생성' },
    { order: 3, tcId: 'TC-INFRA-MCI-03',      status: 'ready',  description: 'MCI 생성', variant: 'aws' },
    { order: 4, tcId: 'TC-APP-CAT-05',         status: 'bypass', description: 'App Catalog 등록',
      bypass: { reason: 'Catalog API 불안정', issue: 'ISSUE-012' } },
    { order: 5, tcId: 'TC-INFRA-MCI-05',      status: 'ready',  description: 'MCI 삭제 (정리)' },
  ],
},
```

### 2-3. 시나리오 status 규칙

| status | 의미 |
|---|---|
| `ready` | 전체 스텝 실행 가능 |
| `partial` | 일부 스텝 wip/todo 포함, 나머지 실행 가능 |
| `wip` | 작업 중 |
| `todo` | 구현 예정 |
| `deprecated` | 더 이상 사용하지 않음 |

---

## § 3. 파라미터 관리

파라미터는 4개 계층에서 병합된다. 낮은 계층이 기본값, 높은 계층이 덮어쓴다.

```
Layer 1: base TC params        ← deploy/params/base/tc/{domain}/{TC-ID}.params.ts
    ↓
Layer 2: env params            ← deploy/params/env/{TEST_ENV}.params.ts  (.gitignore)
    ↓
Layer 3: scenario override     ← deploy/params/base/scenarios/{scenario-id}.params.ts
    ↓
Layer 4: process.env           ← CI/CD 주입 (최우선)
```

### 3-1. 환경별 파라미터 파일 만들기 (로컬 전용)

예시 파일을 복사하여 실제 값으로 편집한다:

```bash
cp deploy/params/env/local.params.ts_sample deploy/params/env/local.params.ts
# local.params.ts 를 실제 값으로 편집 (절대 커밋 금지)
```

외부 IP 접근이 필요한 환경에서는 `.env.external-ip.example` 을 복사한 뒤 편집한다:

```bash
cp .env.external-ip.example .env.external-ip
# 이후 .env.external-ip 파일을 편집 (실제 IP 값 입력)
```

> **NOTE**: `.env.external-ip` 는 `.gitignore` 에 등록되어 있으므로 git에 커밋되지 않는다.
> repo에는 `.env.external-ip.example` (빈 구조 파일) 만 커밋된다.

```typescript
// deploy/params/env/local.params.ts   ← .gitignore 대상, 절대 커밋 금지
import type { EnvParams } from '../types';

export default {
  env: 'local',
  global: {
    adminId:       'mcmp',
    adminPassword: 'your_password_here',   // ← 여기에 실제 비밀번호
    baseUrl:       'http://localhost:3000',
  },
  tc: {
    'TC-CSP-CREDENTIAL-03': {
      credentialKeyId:    'AKIA...',        // ← 실제 AWS Access Key ID
      credentialKeyValue: '...',            // ← 실제 Secret Access Key
    },
    'TC-DATA-RDB-01': {
      dbPassword: 'RealDb!Pass',
    },
  },
  scenario: {},
} satisfies EnvParams;
```

### 3-2. variant 지정 방법

**TC 단독 실행 시** — `StandaloneContext` 에 variant 전달:
```typescript
// deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
import { StandaloneContext } from '../../params/runtime/context';

const ctx = new StandaloneContext('TC-INFRA-MCI-03', process.env.TC_VARIANT);
const p   = ctx.params;   // base + variant 병합 결과
```

```bash
TC_VARIANT=azure npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
TC_VARIANT=ui:helm npx playwright test deploy/tc/sw/TC-APP-REP-02.spec.ts
```

**시나리오 params에서** — `ScenarioContext` 에 variant 전달 + `steps` 로 per-TC override:
```typescript
// deploy/tc/infra/TC-INFRA-MCI-03.spec.ts (시나리오에서 호출될 때)
import { ScenarioContext } from '../../params/runtime/context';

// SCENARIO_ID 는 시나리오 spec 파일이 process.env 로 전달
const ctx = new ScenarioContext(process.env.SCENARIO_ID!, 'TC-INFRA-MCI-03', 'aws');
const p   = ctx.params;   // base + variant + scenario steps 병합
```

```typescript
// deploy/params/base/scenarios/C4-001.params.ts
import type { ScenarioStaticParams } from '../../types';

export default {
  global: { nsId: 'default' },
  steps: {
    'TC-INFRA-MCI-03': {
      mciName:        'C4-001-mci',
      connectionName: 'aws-ap-northeast-2',   // variant 없이 직접 override
    },
    'TC-APP-DEP-01': {
      appName: 'C4-001-nginx',
    },
  },
} satisfies ScenarioStaticParams;
```

---

## § 4. 런타임 파라미터 (IN/OUT)

시나리오 내에서 **앞 TC가 만든 ID나 이름을 뒤 TC가 사용**해야 할 때 런타임 파라미터를 사용한다.

> **Static params** (§ 3)과의 차이:
> - Static → 실행 **전** 결정된 값 (파일에서 읽음)
> - Runtime → 실행 **중** 생성된 값 (이전 TC가 저장, 다음 TC가 읽음)

### 4-1. TC 종료 시 OUT param 저장하기

```typescript
// deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
import { ScenarioContext } from '../../params/runtime/context';

// 시나리오에서 호출될 때만 store 활성화
const ctx = process.env.SCENARIO_ID
  ? new ScenarioContext(process.env.SCENARIO_ID, 'TC-INFRA-MCI-03', process.env.TC_VARIANT)
  : null;

let createdMciId: string;
let createdMciName: string;

test('MCI 생성', async ({ request }) => {
  // ... MCI 생성 로직 ...
  createdMciId   = body.responseData.id;
  createdMciName = ctx?.params.mciName as string ?? 'tc-mci-temp';
});

// ── TC 종료 시 OUT param 저장 ──────────────────────────────────
test.afterAll(() => {
  if (!ctx) return;
  ctx.store.set('mciId',   createdMciId);
  ctx.store.set('mciName', createdMciName);
  ctx.store.set('nsId',    ctx.params.nsId ?? 'default');
});
```

### 4-2. 다음 TC에서 IN param 읽기

```typescript
// deploy/tc/workload/TC-WORKLOAD-MCI-01.spec.ts
import { ScenarioContext } from '../../params/runtime/context';

const ctx = process.env.SCENARIO_ID
  ? new ScenarioContext(process.env.SCENARIO_ID, 'TC-WORKLOAD-MCI-01')
  : null;

let mciId: string;
let mciName: string;

test.beforeAll(() => {
  if (!ctx) {
    // 단독 실행 시: env fallback
    mciId   = process.env.MCI_ID   ?? 'fallback-mci';
    mciName = process.env.MCI_NAME ?? 'fallback-mci';
    return;
  }
  // 시나리오 실행 시: 이전 TC(TC-INFRA-MCI-03)가 저장한 값을 읽음
  mciId   = ctx.store.require<string>('mciId');
  mciName = ctx.store.require<string>('mciName');
});

test('터미널 접속', async ({ request }) => {
  // mciId, mciName 사용 ...
});
```

> **NOTE**: 선행 TC가 실패하면 `store.set()`이 호출되지 않으므로,
> 후속 TC의 `store.require()` 가 자동으로 에러를 throw한다.
> bypass 또는 cascade 별도 처리 불필요.

### 4-3. 콘솔에서 흐름 확인하기

시나리오 마지막에 `ctx.store.dump()`를 호출하면 스토어 내용이 출력된다:

```
── ScenarioRuntimeStore ──────────────────────
  params  : {
    "mciId": "mci-abc123",
    "mciName": "C4-001-mci",
    "nsId": "default"
  }
────────────────────────────────────────
```

---

## § 5. 실행 방법

### 5-1. TC 단독 실행

```bash
# 기본 (base params)
npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts

# CSP variant 지정
TC_VARIANT=azure npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts

# 민감값 주입 (PW_* 접두사 → loader가 접두사 제거 후 params에 주입)
PW_adminPassword=mypassword TC_VARIANT=aws npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts

# 여러 PW_* 조합
PW_adminId=mcmp PW_adminPassword=secret TC_VARIANT=gcp \
  npx playwright test deploy/tc/infra/TC-INFRA-MCI-03.spec.ts
```

### 5-2. 시나리오 실행

```bash
# 시나리오 전체 실행 (SCENARIO_ID 필수 — 런타임 store 활성화)
SCENARIO_ID=C4-001 \
npx playwright test deploy/scenarios/C4-service-create-infra.spec.ts

# 런타임 store 를 초기화하고 재실행 (이전 상태 제거)
rm -f /tmp/scenario-runtime-C4-001.json
SCENARIO_ID=C4-001 npx playwright test deploy/scenarios/C4-service-create-infra.spec.ts
```

### 5-3. 채널별 실행 (API만 또는 UI만)

```bash
# API 테스트만
npx playwright test deploy/tc/ --grep "API:"

# UI 테스트만 (브라우저 실행)
npx playwright test deploy/tc/ --grep "UI:"
```

### 5-4. 레지스트리 조회 스크립트

```bash
# 전체 TC 통계 출력
npx ts-node -e "
  import { summary } from './deploy/registry';
  console.log(JSON.stringify(summary(), null, 2));
"

# 특정 도메인 TC 목록 출력
npx ts-node -e "
  import { listByDomain } from './deploy/registry';
  listByDomain('infra').forEach(tc => console.log(tc.id, tc.status, tc.title));
"

# bypass 상태인 TC 목록 확인
npx ts-node -e "
  import { listByStatus } from './deploy/registry';
  listByStatus('bypass').forEach(tc =>
    console.log(tc.id, tc.bypass?.reason)
  );
"
```

---

## § 6. 자주 묻는 질문 (FAQ)

**Q. 새 TC를 추가할 때 어디서부터 시작해야 하나?**

1. `deploy/tc/{domain}/` 에 spec 파일 생성
2. `deploy/params/base/tc/{domain}/{TC-ID}.params.ts` 생성
3. `deploy/registry/tc/{domain}.registry.ts` 에 항목 추가 (status: `wip`)
4. 구현 완료 후 status를 `ready`로 변경

---

**Q. 미구현·미지원 TC는 어떻게 처리하나?**

- 레지스트리에 status를 `'wip'` 또는 `'todo'`로 설정
- 시나리오에서 해당 스텝도 동일 status로 표기
- 실행 시 스텝이 `throw new Error()`를 발생시키면 FAIL 처리됨
- 선행 TC 실패 시 후속 TC의 `store.require()`가 자동으로 에러를 throw함

---

**Q. 같은 TC를 시나리오마다 다른 파라미터로 실행하려면?**

`deploy/params/base/scenarios/{scenario-id}.params.ts` 의 `steps` 에 해당 TC 항목을 추가한다.

```typescript
// deploy/params/base/scenarios/C4-002.params.ts
export default {
  global: { nsId: 'default' },
  steps: {
    'TC-INFRA-MCI-03': {
      mciName:        'C4-002-mci-azure',
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+Standard_B1s',
    },
  },
} satisfies ScenarioStaticParams;
```

TC spec 파일에서는 `ScenarioContext` 에 variant 를 직접 전달하거나, `steps` override 값을 사용한다.

---

**Q. TC-APP-REP-02처럼 variant별 파일이 나뉜 경우 레지스트리에 어떻게 등록하나?**

`specFile` 대신 `variants[]`를 사용한다.

```typescript
{
  id: 'TC-APP-REP-02',
  ...
  variants: [
    { key: 'api',       specFile: 'deploy/tc/sw/TC-APP-REP-02-api.spec.ts' },
    { key: 'ui:helm',   specFile: 'deploy/tc/sw/TC-APP-REP-02-ui-helm.spec.ts' },
    { key: 'ui:docker', specFile: 'deploy/tc/sw/TC-APP-REP-02-ui-docker.spec.ts' },
  ],
}
```

실행 시: `TC_VARIANT=api npx playwright test deploy/tc/sw/TC-APP-REP-02-api.spec.ts`

---

**Q. 환경별 민감한 파라미터(비밀번호·IP)는 어디에 두나?**

`deploy/params/env/local.params.ts` 에 두고, 이 파일은 `.gitignore`에 포함되어 있다. repo에는 `deploy/params/env/local.params.ts_sample` 만 커밋된다. CI/CD 환경에서는 `PW_*` 환경변수로 직접 주입한다.

---

**Q. TC 파일 이름에 DOMAIN이 APP-*인데 폴더는 sw/인 이유는?**

기존 코드베이스에서 Application Manager 서비스의 TC는 `TC-APP-*` 으로 명명되었지만 폴더는 `sw/`로 통일되어 있다. 로더(`params/loader.ts`)의 `DOMAIN_MAP`에서 `app → sw`로 매핑하여 처리한다.

---

## 빠른 참조

### TC status 한눈에 보기

| status | 레지스트리 | spec 파일 | 시나리오 처리 |
|---|---|---|---|
| `ready` | 등록 완료 | 완전 구현 | 정상 실행 |
| `wip` | 등록 완료 | 부분 구현 | 실행 시 일부 실패 가능 |
| `todo` | 등록 완료 | 없음 | 실행 시 FAIL |
| `deprecated` | 등록 유지 (하위 호환) | 구버전 | 사용 금지 |

### 환경변수 한눈에 보기

| 변수 | 기본값 | 설명 |
|---|---|---|
| `TC_VARIANT` | *(없음)* | variant 선택 (`aws` · `azure` · `ui:helm` · `ui:docker` …) |
| `SCENARIO_ID` | *(없음)* | 런타임 store 활성화 + 시나리오 파라미터 로드 |
| `PW_adminId` | (base params) | 관리자 계정 ID (PW_ 접두사 → params 에 주입) |
| `PW_adminPassword` | (base params) | 관리자 비밀번호 |
| `PW_credentialKeyId` | (base params) | CSP Credential Key ID |
| `PW_credentialKeyValue` | (base params) | CSP Credential Key Value |
| `PW_{ANY_KEY}` | (base params) | PW_ 접두사 키는 모두 params 에 주입 (접두사 제거됨) |

> `PW_*` 환경변수는 4-레이어 중 최고 우선순위. `env/local.params.ts` 보다도 우선한다.
> CI/CD 파이프라인에서는 시크릿을 `PW_adminPassword=***` 형태로 주입한다.

### 도메인 → 레지스트리 파일 매핑

| 도메인 | 레지스트리 파일 | TC 수 |
|---|---|---|
| iam | `registry/tc/iam.registry.ts` | 76 |
| csp | `registry/tc/csp.registry.ts` | 44 |
| infra | `registry/tc/infra.registry.ts` | 11 |
| sw | `registry/tc/sw.registry.ts` | 25 |
| data | `registry/tc/data.registry.ts` | 18 |
| obs | `registry/tc/obs.registry.ts` | 6 |
| cost | `registry/tc/cost.registry.ts` | 5 |
| workflow | `registry/tc/workflow.registry.ts` | 5 |
| workload | `registry/tc/workload.registry.ts` | 3 |
| **합계** | | **193** |

---

> 최초 작성: 2026-06-19 · 관리: QA 팀
