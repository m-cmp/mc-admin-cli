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
- Go 1.23
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

먼저 저장소를 클론합니다.
안정적인 인프라 구축을 위해 최신 개발 버전 대신 `-b` 플래그를 사용하여 특정 [릴리스 버전](https://github.com/m-cmp/mc-admin-cli/releases)을 명시적으로 클론하는 것을 권장합니다.
(예시) v0.4.1
```shell
git clone https://github.com/m-cmp/mc-admin-cli.git -b v0.4.1
cd mc-admin-cli/bin
```

mc-admin-cli를 다운로드한 후, bin 폴더로 이동하여 installAll.sh 셸 스크립트를 실행합니다.
```shell 
./installAll.sh
```

    스크립트 실행 시 도메인과 인증서가 필요하므로 적절한 모드를 선택하여 인증서를 발급하고 nginx 설정 파일을 생성합니다.
    **설치 모드 선택:**
    - **개발자 모드 (로컬 인증)**: 개발 및 테스트 환경용.( 임시자격증명을 활용하는 기능 사용 불가)
    - **프로덕션 모드 (CA 인증)**: 운영 환경용 (도메인 필수. 임시자격증명을 위한 대상 CSP의 작업 필요 )


```shell
./mcc infra run
```
위 명령어를 실행하여 플랫폼 설치를 시작합니다.

잠시 후, 모든 필수 컨테이너가 unhealthy 상태 없이 healthy 상태인지 확인하세요.   
특히 마지막에 실행되는 mc-web-console-api 컨테이너가 healthy 상태인지 확인하세요.
```shell 
./mcc infra info
```

보통 지금까지의 작업으로 충분하지만, 웹 콘솔이 제대로 작동하지 않는 경우,   
아래의 mc-iam-manager-post-initial 컨테이너 로그를 확인하여 모든 설정 작업이 정상적으로 처리되었는지 확인하세요.   
mc-iam-manager-post-initial 작업이 성공적으로 종료되지 않으면 mc-admin-cli/bin 폴더의 iam_manager_init.sh 셸 스크립트를 실행하세요.
```shell 
docker logs mc-iam-manager-post-initial
```
    해당작업은 mc-iam-manager에서 필요한 작업영역(realm, client)생성 및 관리자, role, menu를 설정하는 작업입니다.
    실패한 경우 1_setup_manual.sh 파일을 이용하여 특정 단계를 재실행할 수 있습니다.

mc-web-console-api 컨테이너가 healthy 상태가 되면 다음 지침을 사용하여 CB-Tumblebug를 초기화하세요:
- [빠른 시작 가이드 – CB-Tumblebug](https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#quick-start-)
- 가이드에서 `init.sh` 실행이 필수 단계입니다.

기본적으로 웹 콘솔은 임시 자격 증명을 사용하여 http://{HostIP}:3001에서 접근할 수 있습니다:
- 사용자명: `mcmp`
- 비밀번호: `mcmp_password`


다른 Docker 환경이나 기존 테스트로 인해 작업 환경을 완전히 초기화하고 싶다면 mc-admin-cli/bin 폴더의 cleanAll.sh 셸 스크립트를 사용하세요.   
**[경고] 시스템의 모든 Docker 환경과 기존 작업 기록이 삭제됩니다.**
```shell 
$ cd mc-admin-cli/bin
$ ./cleanAll.sh
```


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

### **MC-IAM-MANAGER**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-iam-manager | 5000 | TCP | IAM Manager API |
| mc-iam-manager-db | 5432 | TCP | PostgreSQL DB |
| mc-iam-manager-kc | 8080 | TCP | Keycloak |
| mc-iam-manager-nginx | 80, 443 | TCP | Nginx (HTTP/HTTPS) |

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
| mc-observability-manager | 18080, 18081 | TCP | Observability Manager |
| mc-observability-maria | 3306 | TCP | MariaDB |
| mc-observability-influx | 8086, 8082 | TCP | InfluxDB |
| mc-observability-chronograf | 8888 | TCP | Chronograf |
| mc-observability-kapacitor | 9092 | TCP | Kapacitor |
| opensearch-node1 | 9200, 9600 | TCP | OpenSearch |
| mc-observability-opensearch-dashboards | 5601 | TCP | OpenSearch Dashboards |
| mc-observability-insight | 9001 | TCP | Observability Insight |
| mc-observability-insight-scheduler | 9002 | TCP | Insight Scheduler |
| mc-observability-mcp-grafana | 8000 | TCP | MCP Grafana |

**총 39개 포트**가 외부 접근용으로 구성되어 있습니다.

다음 포트들은 방화벽에 등록해야 합니다:
### **필수 방화벽 서비스**
| 서비스 | 포트 | 프로토콜 | 설명 |
|---------|------|----------|-------------|
| mc-web-console-api | 3000 | TCP | Web Console API |
| mc-web-console-front | 3001 | TCP | Web Console Frontend |
| mc-cost-optimizer-fe | 7780 | TCP | Cost Optimizer Frontend |


---

# 소스 코드에서 운영자를 빌드하는 명령어
```Shell
$ git clone https://github.com/m-cmp/mc-admin-cli.git
$ cd mc-admin-cli/src

(의존성 설정)
mc-admin-cli/src$ go get -u

(mcc용 바이너리 빌드)
mc-admin-cli/src$ go build -o mcc

**기계의 os 타입에 따라 Makerfile을 사용하여 mcc용 바이너리 빌드**
mc-admin-cli/src$ make
mc-admin-cli/src$ make win
mc-admin-cli/src$ make mac
mc-admin-cli/src$ make linux-arm
mc-admin-cli/src$ make win86
mc-admin-cli/src$ make mac-arm
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


