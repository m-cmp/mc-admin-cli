# MCMP E2E 테스트 스펙

MCMP(Multi-Cloud Management Platform) 기능 검증용 E2E 테스트 스펙 모음입니다.

이 폴더는 **테스트 스펙만** 포함합니다.  
실행 환경(Playwright, Node.js 패키지)은 이 폴더 밖에 별도로 설치합니다.

---

## Folder Structure

```
e2e/
├── tc/                    # 도메인별 개별 TC 스펙 파일
│   ├── csp/
│   ├── infra/
│   ├── sw/
│   ├── data/
│   └── workflow/
│
├── scenarios/             # 통합 흐름 시나리오 스펙 파일
│   ├── C2-admin-setup/    # IAM 온보딩
│   ├── C3-svc-wf/         # 워크플로우 기반 서비스 생성
│   ├── C4-svc-direct/     # 직접 서비스 생성
│   ├── C5-svc-mgmt1/      # 서비스 운영 관리
│   ├── C6-monitoring/     # 모니터링/옵저버빌리티
│   ├── C7-svc-mgmt2/      # 인프라 라이프사이클
│   ├── C8-data/           # 데이터 백업/복원/마이그레이션
│   ├── C9-cost/           # 클라우드 비용 분석
│   └── C10-cleanup/       # 인프라 정리
│
├── registry/              # TC·시나리오 카탈로그 (단일 진실 공급원)
├── params/                # 파라미터 시스템 (4-layer merge)
├── shared/                # 공통 유틸리티 (API routes, page URLs)
│
├── playwright.config.ts   # Playwright 설정 + .env 로딩
├── tsconfig.json
├── .env.external-ip.example
└── .env.external-domain.example
```

---

## Prerequisites

- Node.js 18 이상
- npm

---

## Installation

이 폴더 밖의 임의 위치에서 Playwright를 설치합니다.

```bash
mkdir playwright-runner && cd playwright-runner
npm init -y
npm install @playwright/test ts-node typescript dotenv
npx playwright install --with-deps chromium
```

---

## Configuration

이 폴더(`e2e/`) 안에서 접속 환경에 맞는 `.env` 파일을 생성합니다.

### external-ip (IP 직접 접속)

```bash
cp .env.external-ip.example .env.external-ip
```

| 변수 | 설명 | 예시 |
|------|------|------|
| `EXTERNAL_IP` | 서버 IP 주소 | `192.168.1.100` |
| `EXTERNAL_PORT` | 포트 번호 | `3001` |
| `EXTERNAL_HTTPS` | HTTPS 사용 여부 | `false` |
| `ADMIN_ID` | 관리자 계정 ID | `admin` |
| `ADMIN_PASSWORD` | 관리자 계정 비밀번호 | `password` |
| `WORKSPACE_NAME` | 기본 워크스페이스 이름 | `ws01` |
| `PROJECT_NAME` | 기본 프로젝트 이름 | `default` |
| `MCI_ID` | (선택) 고정 MCI ID | `mci-abc123` |

### external-domain (도메인 접속)

```bash
cp .env.external-domain.example .env.external-domain
# 값 수정
```

---

## Run

Playwright가 설치된 위치(playwright-runner/)에서 실행합니다.  
`--config` 로 이 폴더의 설정 파일을, 마지막 인자로 실행할 스펙 경로를 지정합니다.

```bash
E2E=/path/to/mc-admin-cli/e2e
```

### TC 실행

```bash
# 특정 TC
ACCESS_MODE=external-ip npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/tc/infra/TC-INFRA-DEPLOY-06.spec.ts

# TC 도메인 디렉토리 전체
ACCESS_MODE=external-ip npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/tc/sw/

# CSP 변형(variant) 지정
ACCESS_MODE=external-ip TC_VARIANT=aws npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/tc/infra/TC-INFRA-DEPLOY-05.spec.ts
```

### 시나리오 실행

```bash
# 특정 시나리오 디렉토리 전체
ACCESS_MODE=external-ip npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/scenarios/C4-svc-direct/

# 특정 시나리오 단계 파일만
ACCESS_MODE=external-ip npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/scenarios/C2-admin-setup/C2-01-onboarding-mc-iam-manager-user-create.spec.ts

# external-domain 기준 실행
ACCESS_MODE=external-domain npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/scenarios/C3-svc-wf/
```

---

## 녹화 (Recording)

### 1. Codegen — UI 조작을 코드로 자동 생성

브라우저를 열고 직접 조작하면 Playwright 코드가 자동 생성됩니다.

```bash
npx playwright codegen \
  --viewport-size=1920,1080 \
  --ignore-https-errors \
  https://<EXTERNAL_IP>:<EXTERNAL_PORT>/
```

생성된 코드를 복사해 TC spec 파일에 붙여넣어 사용합니다.

### 2. 영상 녹화 — 테스트 실행 과정 캡처

```bash
E2E=/path/to/mc-admin-cli/e2e

ACCESS_MODE=external-ip npx playwright test \
  --config=$E2E/playwright.config.ts \
  --video=on \
  --headed \
  $E2E/tc/infra/TC-INFRA-DEPLOY-05.spec.ts
```

영상 파일(`.webm`)은 `e2e_result/test-results/` 하위에 저장됩니다.

> **타임아웃**: `playwright.config.ts`의 `timeout: 3 * 60 * 1000` 설정으로 테스트당 최대 **3분**까지 녹화됩니다.  
> 기본값은 30초이므로, 더 긴 작업을 녹화하려면 이 값을 조정하세요.

### 3. 실패 시 영상 자동 저장 (기본값)

`playwright.config.ts`의 `video: 'retain-on-failure'` 설정으로 테스트 실패 시에만 영상이 자동 저장됩니다.  
별도 옵션 없이 일반 실행하면 됩니다.

```bash
ACCESS_MODE=external-ip npx playwright test \
  --config=$E2E/playwright.config.ts \
  $E2E/tc/infra/TC-INFRA-DEPLOY-05.spec.ts
```

---

## Reference

TC 등록 방법, 파라미터 시스템, 레지스트리 쿼리 등 상세 내용은 [MANUAL.md](MANUAL.md)를 참고하세요.
