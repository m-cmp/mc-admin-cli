# M-CMP ADMIN CLI (mcc)
이 저장소는 멀티 클라우드 관리 CLI를 제공합니다.    
이 도구의 이름은 mcc(Multi-Cloud admin CLI)입니다.    
멀티 클라우드 인프라를 배포하고 관리하기 위한 [M-CMP 플랫폼](https://github.com/m-cmp)의 하위 시스템입니다.    


```
[참고]
mcc는 현재 개발 중입니다.
따라서 현재 릴리스를 프로덕션에서 사용하는 것을 권장하지 않습니다.
mcc의 기능들이 아직 안정적이고 안전하지 않다는 점을 참고하시기 바랍니다.
mcc 사용에 어려움이 있으시면 알려주시기 바랍니다.
(이슈를 열거나 M-CMP Slack에 참여하세요)
```

## mcc 개요
- M-CMP 시스템의 설치, 실행, 상태 정보 제공, 종료 및 API 호출을 지원하는 관리 도구입니다.
- 현재 infra 서브커맨드는 docker compose 기반 인프라 설치 및 관리만 지원합니다.
  - [infra 서브커맨드](./docs/mc-admin-cli-infra.md)
- CSP 인스턴스에서 전체 하위 시스템을 단일 인스턴스에서 실행하는 방법을 확인하려면 [이 문서](./docs/mc-admin-cli-infra.md)를 참조하세요.

## 개발 및 테스트 환경
- Go 1.25.0 (최소 요구 버전)
- Docker version 27.3.1
- Docker Compose version v2.29

## Docker 및 Docker Compose V2 설치

- [Ubuntu에서 Docker Engine 설치](https://docs.docker.com/engine/install/ubuntu/)

아래 명령어를 확인하세요.

```shell
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update

sudo apt-get install -y docker-ce docker-ce-cli docker-compose-plugin
```

# 빠른 가이드
이 섹션은 빠르게 설정하고 싶은 분들을 위한 최소한의 과정을 설명합니다.   
더 자세한 설치 가이드를 원하시면 [단일 인스턴스에서 실행하기 가이드](https://github.com/m-cmp/mc-admin-cli/blob/main/docs/running-on-instance.md) 문서를 참조하세요.

## Step 1. 저장소 클론

안정적인 인프라 구축을 위해 최신 개발 버전 대신 `-b` 플래그를 사용하여 특정 [릴리스 버전](https://github.com/m-cmp/mc-admin-cli/releases)을 명시적으로 클론하는 것을 권장합니다.
```shell
git clone https://github.com/m-cmp/mc-admin-cli.git -b v0.5.0
cd mc-admin-cli/bin
```

기여자의 경우 최신 개발 브랜치를 클론하세요.
```shell
git clone https://github.com/m-cmp/mc-admin-cli.git
cd mc-admin-cli/bin
```

## Step 1-1. mcc 바이너리 동작 확인 (선택)

진행 전 배포된 바이너리가 현재 시스템에서 실행되는지 확인하세요:
```shell
./mcc --version
```

아래와 같은 오류가 발생하면:
```
./mcc: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.34' not found
```
배포된 바이너리가 현재 OS보다 높은 GLIBC 버전을 필요로 합니다 (예: Ubuntu 20.04는 GLIBC 2.31 제공). 아래 [정적 바이너리 빌드](#정적-바이너리-빌드)를 참고하여 소스에서 직접 빌드 후 이 단계로 돌아오세요.

## Step 2. 배포 모드 선택

환경에 맞는 모드를 선택하세요. `installAll.sh`가 대화형으로 안내하며, `.env` 파일을 수동으로 편집할 필요가 없습니다.

| | **Mode A — 로컬 / 개발** | **Mode B — 운영** |
|---|---|---|
| 도메인 | 로컬 이름 (기본값: `mciam.local`) | 공개 FQDN (예: `iam.example.com`) |
| TLS 인증서 | 자가서명 (자동 생성) | Let's Encrypt certbot |
| DNS | `/etc/hosts` 자동 추가 | 공개 DNS A-레코드 → 서버 IP |
| installAll.sh 플래그 | `--mode dev` | `--mode prod` |
| 브라우저 경고 | 인증서 경고 (개발 환경에서 허용) | 경고 없음 (공인 CA) |

**Mode B 사전 조건** — `installAll.sh` 실행 전에 도메인의 DNS A-레코드가 이 서버의 공인 IP를 가리키고 있어야 합니다.

## Step 3. installAll.sh 실행

`installAll.sh`는 자동으로 다음 작업을 수행합니다:
1. `.env` 파일이 없으면 `.env.setup` 템플릿에서 자동 생성
2. Mode(A/B)와 도메인을 대화형으로 입력받거나 CLI 플래그로 처리
3. 환경 파일에 도메인 값 자동 주입
4. TLS 인증서 생성(Mode A: 자가서명, Mode B: Let's Encrypt) 및 nginx 설정 생성

```shell
# 대화형 모드 — Mode, 도메인, 실행 모드를 순서대로 안내
./installAll.sh

# 비대화형: Mode A — 기본 도메인(mciam.local), 백그라운드 시작
./installAll.sh --mode dev --run background

# 비대화형: Mode A — 커스텀 로컬 도메인
./installAll.sh --mode dev --domain myhost.local --run background

# 비대화형: Mode B — 실제 도메인, 백그라운드 시작
./installAll.sh --mode prod --domain iam.example.com --run background

# 설정 파일만 생성, 컨테이너 시작 건너뜀
./installAll.sh --mode dev --run skip
```

## Step 4. 플랫폼 시작

Step 3에서 `--run skip`을 사용한 경우 지금 모든 컨테이너를 시작하세요:
```shell
./mcc infra run
```

## Step 5. 시작 상태 확인

모든 컨테이너가 healthy 상태가 될 때까지 몇 분 기다린 후 아래 항목을 확인하세요.

**(a) 컨테이너 상태 — 모든 컨테이너 healthy, mc-web-console-api 마지막 확인:**
```shell
./mcc infra info
```
`unhealthy` 항목이 없어야 합니다. `mc-iam-manager-post-initial`은 `Exited (0)`으로 표시되는 것이 정상입니다.

**(b) mc-infra-manager readyz 확인:**
```shell
./mcc rest get -u default -p default http://localhost:1323/tumblebug/readyz
```
기대 응답: `{"message":"CB-Tumblebug is ready","ready":true}`

**(c) Keycloak OIDC discovery 확인 (`<DOMAIN>`을 `MC_IAM_MANAGER_PUBLIC_DOMAIN` 값으로 교체):**
```shell
curl -k https://<DOMAIN>/auth/realms/mciam/.well-known/openid-configuration | grep issuer
```
기대 응답: `"issuer": "https://<DOMAIN>/auth/realms/mciam"` — 반드시 `https://`로 시작하고 `/auth/`가 포함되어야 합니다.

**(d) mc-iam-manager-post-initial 8단계 설정 완료 확인:**
```shell
docker logs mc-iam-manager-post-initial | tail -5
```
마지막 출력 기대값:
```
=== Automated setup completed successfully ===
[Success] MC-IAM-Manager initialization completed successfully!
```
컨테이너가 비정상 종료되었거나 성공 메시지가 없으면 초기화 스크립트를 재실행하세요:
```shell
./iam_manager_init.sh
```
또는 `conf/docker/conf/mc-iam-manager/1_setup_manual.sh`를 사용하여 개별 단계를 수동으로 실행할 수 있습니다.

**(e) iframe HTTPS 프록시 엔드포인트 확인 (웹 콘솔 임베드 뷰 사용):**
```shell
curl -kI https://<DOMAIN>:33002    # Grafana 대시보드 프록시
curl -kI https://<DOMAIN>:7781     # Cost Optimizer FE 프록시
```
기대 응답: 두 엔드포인트 모두 `HTTP/2 200`

## Step 6. CB-Tumblebug 초기화 및 웹 콘솔 접속

`mc-web-console-api` 컨테이너가 healthy 상태가 되면 다음 지침을 사용하여 CB-Tumblebug를 초기화하세요:
- [빠른 시작 가이드 – CB-Tumblebug](https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#quick-start-)
- 가이드에서 `init.sh` 실행이 필수 단계입니다.

기본 자격 증명으로 웹 콘솔에 접속하세요:
- **Mode A**: `https://mciam.local:3001` (자가서명 인증서 경고 수락)
- **Mode B**: `https://<DOMAIN>:3001`
- 사용자명: `mcmp`
- 비밀번호: `mcmp_password`

## Step 7. 환경 초기화

다른 Docker 환경이나 기존 테스트로 인해 작업 환경을 완전히 초기화하고 싶다면:   
**[경고] 시스템의 모든 Docker 환경과 기존 작업 기록이 삭제됩니다.**
```shell
cd mc-admin-cli/bin
./cleanAll.sh
```


## TLS 인증서 자동갱신 (Mode B)

Mode B(Let's Encrypt) 실행 시 certbot이 `systemd certbot.timer`를 통해 하루 2회 자동갱신을 시도합니다. 만료 30일 전부터 갱신이 시작됩니다.

### Webroot 방식 전환 (최초 1회 필요)

Mode B는 갱신 중에도 nginx가 계속 실행될 수 있도록 **webroot** 인증 방식을 사용합니다. 기존 `standalone` 방식으로 설치된 경우 아래 명령으로 한 번 전환해야 합니다:

```shell
sudo certbot certonly \
  --webroot \
  -w <mc-admin-cli 경로>/conf/docker/container-volume/certbot/www \
  -d <your-domain> \
  --force-renewal
```

전환 확인:

```shell
sudo grep "authenticator" /etc/letsencrypt/renewal/<your-domain>.conf
# 기대값: authenticator = webroot
```

### Deploy Hook — 갱신 후 nginx 자동 reload

인증서 갱신 후 nginx 컨테이너에 새 인증서를 즉시 적용하기 위한 deploy hook을 한 번 설치합니다:

```shell
sudo cp conf/docker/scripts/certbot-deploy-hook.sh \
     /etc/letsencrypt/renewal-hooks/deploy/reload-nginx-docker.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx-docker.sh
```

### 자동갱신 검증

```shell
sudo certbot renew --dry-run
# 기대값: "all simulated renewals succeeded"
```

---

## 방화벽 포트 정보

필요한 경우 다음 포트들을 방화벽에 등록해야 합니다:

### **MC-INFRA-CONNECTOR**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-infra-connector | 1024 | TCP | CB-Spider API |

### **MC-INFRA-MANAGER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-infra-manager | 1323 | TCP | CB-Tumblebug API |
| mc-infra-manager-etcd | 2379, 2380 | TCP | etcd 클러스터 |
| mc-infra-manager-postgres | 6432 | TCP | PostgreSQL DB |
| mc-infra-manager-openbao | 8200 | TCP | OpenBao (Vault fork, 시크릿 저장소) |

### **MC-IAM-MANAGER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-iam-manager | 5000 | TCP | IAM Manager API |
| mc-iam-manager-db | 5432 | TCP | PostgreSQL DB |
| mc-iam-manager-kc | 8080 | TCP | Keycloak |
| mc-iam-manager-nginx | 80, 443 | TCP | Nginx (HTTP 리다이렉트 + HTTPS) |
| mc-iam-manager-nginx | 3001 | TCP | 웹 콘솔 프론트엔드 (HTTPS 프록시) |
| mc-iam-manager-nginx | 33002 | TCP | Grafana (iframe 전용 HTTPS 역방향 프록시) |
| mc-iam-manager-nginx | 7781 | TCP | Cost Optimizer FE (iframe 전용 HTTPS 역방향 프록시) |

### **MC-COST-OPTIMIZER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-cost-optimizer-fe | 7780 | TCP | Cost Optimizer Frontend |
| mc-cost-optimizer-be | 9090 | TCP | Cost Optimizer Backend |
| mc-cost-optimizer-cost-collector | 8881 | TCP | Cost Collector |
| mc-cost-optimizer-cost-processor | 18082 | TCP | Cost Processor |
| mc-cost-optimizer-cost-selector | 8083 | TCP | Cost Selector |
| mc-cost-optimizer-alarm-service | 9000 | TCP | Alarm Service |
| mc-cost-optimizer-asset-collector | 8091 | TCP | Asset Collector |
| mc-cost-optimizer-db | 3307 | TCP | MariaDB |

### **MC-APPLICATION-MANAGER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-application-manager-jenkins | 9800 | TCP | Jenkins |
| mc-application-manager-sonatype-nexus | 8081, 5500 | TCP | Nexus Repository |
| mc-application-manager | 18084 | TCP | Application Manager API |

### **MC-WORKFLOW-MANAGER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-workflow-manager-jenkins | 9880 | TCP | Jenkins |
| mc-workflow-manager | 18083 | TCP | Workflow Manager API |

### **MC-DATA-MANAGER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-data-manager | 3300 | TCP | Data Manager API |

### **MC-WEB-CONSOLE**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-web-console-db | 15432 | TCP | PostgreSQL DB |
| mc-web-console-api | 3000 | TCP | Web Console API |
| mc-web-console-front | 3001 | TCP | Web Console Frontend |

### **MC-OBSERVABILITY**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-observability-manager | 18080 | TCP | Observability Manager |
| mc-observability-infra | 33000 | TCP | Observability Infrastructure |
| mc-observability-rabbitmq | 5672, 1883, 15672 | TCP | RabbitMQ (AMQP, MQTT, 관리 콘솔) |
| mc-observability-maria | 3306 | TCP | MariaDB |
| mc-observability-influx | 8086 | TCP | InfluxDB |
| mc-observability-influx-2 | 8087 | TCP | InfluxDB 2 |
| mc-observability-loki | 3100 | TCP | Loki 로그 수집기 |
| mc-observability-tempo | 3200, 4317, 4318 | TCP | Tempo 분산 추적 |
| mc-observability-grafana | 33001 | TCP | Grafana |
| mc-observability-insight | 9001 | TCP | Observability Insight |
| mc-observability-insight-scheduler | 9002 | TCP | Insight Scheduler |
| mc-observability-mcp-grafana | 8000 | TCP | MCP Grafana 서버 (LLM 기반 분석) |
| mc-observability-mcp-mariadb | 8001 | TCP | MCP MariaDB 서버 (LLM 기반 분석) |
| mc-observability-mcp-influx | 8002 | TCP | MCP InfluxDB 서버 (LLM 기반 분석) |

**총 49개 포트**가 외부 접근용으로 구성되어 있습니다.

다음 포트들은 방화벽에 등록해야 합니다:
### **필수 방화벽 서비스**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-iam-manager-nginx | 80, 443 | TCP | Nginx 진입점 (HTTP 리다이렉트 + HTTPS 웹 콘솔) |
| mc-iam-manager-nginx | 3001 | TCP | 웹 콘솔 프론트엔드 (HTTPS) |
| mc-iam-manager-nginx | 33002 | TCP | Grafana iframe 프록시 (HTTPS) — Mode B |
| mc-iam-manager-nginx | 7781 | TCP | Cost Optimizer FE iframe 프록시 (HTTPS) — Mode B |
| mc-web-console-api | 3000 | TCP | Web Console API |
| mc-cost-optimizer-fe | 7780 | TCP | Cost Optimizer Frontend (직접 HTTP) |


---

# 트러블슈팅

## 설치 후 `mc-iam-manager`가 계속 unhealthy 상태일 때

`./mcc infra info`에서 `mc-iam-manager`가 **unhealthy**로 표시되고,
`docker logs mc-iam-manager-post-initial`의 마지막 줄이 `ERROR: 1_setup_auto.sh Script execution failed`라면,
`mc-iam-manager`가 완전히 기동되기 전에 post-init 컨테이너가 먼저 실행된 것입니다.

**복구 절차:**

```bash
# 1. 모든 사전 조건 컨테이너가 healthy인지 확인
cd bin && ./mcc infra info

# 2. 종료된 post-init 컨테이너를 제거한 뒤 재실행 (멱등성 보장 — 반복 실행 안전)
docker rm mc-iam-manager-post-initial 2>/dev/null
./mcc infra run -s mc-iam-manager-post-initial
docker logs -f mc-iam-manager-post-initial
# 8단계 각각이 ✓ 로 완료되어야 합니다

# 3. 헬스 상태 확인
curl -s http://localhost:5000/readyz | jq .
# 기대 결과: "status": "healthy"
```

---

# 소스에서 빌드

## 정적 바이너리 빌드

배포된 `bin/mcc` 실행 시 GLIBC 버전 오류가 발생하는 경우 (예: Ubuntu 20.04 또는 GLIBC 2.34 미만 환경) 소스에서 정적으로 빌드하세요:

```shell
cd mc-admin-cli/src
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ../bin/mcc
```

`CGO_ENABLED=0`으로 빌드하면 GLIBC 의존성 없는 완전 정적 바이너리가 생성됩니다. GLIBC 버전과 무관하게 모든 Linux 배포판에서 실행됩니다.

> **최소 Go 버전**: 1.21 이상. Go가 없는 경우 https://go.dev/dl/ 에서 설치하세요.

## 플랫폼별 빌드 (Makefile)

```shell
cd mc-admin-cli/src

# 의존성 설치 / 업데이트
go get -u

# 현재 플랫폼으로 빌드 (기본: linux amd64)
make

# 다른 타겟으로 크로스 컴파일
make win        # Windows amd64
make mac        # macOS amd64
make linux-arm  # Linux arm64
make win86      # Windows 386
make mac-arm    # macOS arm64
```

# mcc 사용 방법

```
mc-admin-cli/bin$ ./mcc -h

mcc는 Cloud-Barista 시스템을 운영하기 위한 도구입니다. 
  
Usage:
  mcc [command]

Available Commands:
  api         Call the M-CMP system's Open APIs as services and actions
  infra       A tool to operate M-CMP system
  help        Help about any command
  rest        rest api call

Flags:
  -h, --help   help for mcc

Use "mcc [command] --help" for more information about a command.
```

더 자세한 설명은 아래 문서를 참조하세요.   
- [infra 서브커맨드 가이드](./docs/mc-admin-cli-infra.md)
- [rest 서브커맨드 가이드](./docs/mc-admin-cli-rest.md)

## docker-compose.yaml
```
M-CMP 시스템 구성에 필요한 서비스 정보는 mc-admin-cli/docker-compose-mode-files/docker-compose.yaml 파일에 정의되어 있습니다.(기본적으로 docker-compose-mode-files 폴더에 원하는 구성과 데이터 볼륨을 빌드하도록 설정되어 있습니다.)

배포하려는 각 컨테이너의 정보를 변경하려면 mc-admin-cli/docker-compose-mode-files/docker-compose.yaml 파일을 수정하거나 -f 옵션을 사용하세요.
```

## infra 서브커맨드
자세한 정보는 [infra 서브커맨드 문서](./docs/mc-admin-cli-infra.md)를 확인하세요.


현재 infra의 run/stop/info/pull/remove 명령어를 지원합니다.

도움이 필요한 서브커맨드 끝에 -h 옵션을 사용하거나 옵션 없이 'mcc'를 실행하면 도움말이 표시됩니다.


```
Usage:
  mcc infra [flags]
  mcc infra [command]

Available Commands:
  info        Get information of M-CMP System
  pull        Pull images of M-CMP System containers
  remove      Stop and Remove M-CMP System
  run         Setup and Run M-CMP System
  stop        Stop M-CMP System

Flags:
  -h, --help   help for infra

Use "mcc infra [command] --help" for more information about a command.
```

## infra 서브커맨드 예제
infra 서브커맨드의 간단한 사용 예제
```
- ./mcc infra pull [-f ../conf/docker/docker-compose.yaml]
- ./mcc infra run [-f ../conf/docker/docker-compose.yaml]  -d
- ./mcc infra info
- ./mcc infra stop [-f ../conf/docker/docker-compose.yaml]
- ./mcc infra remove [-f ../conf/docker/docker-compose.yaml] -v -i

```
## k8s 서브커맨드
**K8S는 현재 지원되지 않으며 가까운 시일 내에 지원될 예정입니다.**

## rest 서브커맨드
rest 서브커맨드는 CLI에서 M-CMP 관련 프레임워크의 오픈 API를 쉽게 사용할 수 있도록 REST의 기본 기능을 중심으로 개발되었습니다.
현재 get/post/delete/put/patch 명령어를 지원합니다.

자세한 정보는 [rest 서브커맨드 문서](./docs/mc-admin-cli-rest.md)를 확인하세요.

```
rest api call

Usage:
  mcc rest [flags]
  mcc rest [command]

Available Commands:
  delete      REST API calls with DELETE methods
  get         REST API calls with GET methods
  patch       REST API calls with PATCH methods
  post        REST API calls with POST methods
  put         REST API calls with PUT methods

Flags:
      --authScheme string   sets the auth scheme type in the HTTP request.(Exam. OAuth)(The default auth scheme is Bearer)
      --authToken string    sets the auth token of the 'Authorization' header for all HTTP requests.(The default auth scheme is 'Bearer')
  -d, --data string         Data to send to the server
  -f, --file string         Data to send to the server from file
  -I, --head                Show response headers only
  -H, --header strings      Pass custom header(s) to server
  -h, --help                help for rest
  -p, --password string     Password for basic authentication
  -u, --user string         Username for basic authentication
  -v, --verbose             Show more detail information

Use "mcc rest [command] --help" for more information about a command.
```

## rest 명령어 예제
rest 명령어의 간단한 사용 예제

```
./mcc rest get -u default -p default http://localhost:1323/tumblebug/health
./mcc rest post https://reqres.in/api/users -d '{
                "name": "morpheus",
                "job": "leader"
        }'
```

## api 서브커맨드
자세한 정보는 [infra 서브커맨드 문서](./docs/mc-admin-cli-api.md)를 확인하세요.
api 서브커맨드는 CLI에서 M-CMP 관련 프레임워크의 오픈 API를 쉽게 사용할 수 있도록 개발되었습니다.

```
api.yaml에 정의된 서비스의 액션을 호출합니다. 

Usage:
  mcc api [flags]
  mcc api [command]

Available Commands:
  tool        Swagger JSON parsing tool to assist in writing api.yaml files

Flags:
  -a, --action string        Action to perform
  -c, --config string        config file (default "../conf/api.yaml")
  -d, --data string          Data to send to the server
  -f, --file string          Data to send to the server from file
  -h, --help                 help for api
  -l, --list                 Show Service or Action list
  -m, --method string        HTTP Method
  -p, --pathParam string     Variable path info set "key1:value1 key2:value2" for URIs
  -q, --queryString string   Use if you have a query string to add to URIs
  -s, --service string       Service to perform
  -v, --verbose              Show more detail information

Use "mcc api [command] --help" for more information about a command.
```

## api 서브커맨드 예제
api 서브커맨드의 간단한 사용 예제.

```
./mcc api --help
./mcc api --list
./mcc api --service spider --list
./mcc api --service spider --action ListCloudOS
./mcc api --service spider --action GetCloudDriver --pathParam driver_name:AWS
./mcc api --service spider --action GetRegionZone --pathParam region_name:ap-northeast-3 --queryString ConnectionName:aws-config01
```


