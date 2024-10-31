
## `mc-admin-cli`의 `infra` 커맨드를 이용한 M-CMP 설치 및 실행 가이드

이 가이드에서는 `mc-admin-cli`의 `infra` 서브 커맨드를 이용하여 `Docker Compose` 기반으로 M-CMP 시스템을 구축 및 실행하는 방법에 대해 소개합니다. 


## 순서
1. 개발환경 준비
1. 필요사항 설치
   1. Docker
   1. Docker Compose
1. mc-admin-cli 소스코드 다운로드
1. 환경설정 확인 및 변경
1. mc-admin-cli 소스코드 빌드
1. mc-admin-cli 이용하여 M-CMP 실행
1. M-CMP 실행상태 확인
1. [참고] 프레임워크별 컨테이너 구성 및 API Endpoint


## 개발환경 준비

[권장사항]
- Ubuntu 20.04

## 필요사항 설치

### Docker 설치
- https://docs.docker.com/engine/install/ubuntu/ 에서 설명하는 방법대로 설치합니다.

<details>
  <summary>[클릭하여 예시 보기]</summary>
  
```bash
# 기존에 Docker 가 설치되어 있었다면 삭제
sudo apt remove docker docker-engine docker.io containerd runc

# Docker 설치를 위한 APT repo 추가
sudo apt update

sudo apt install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# x86_64 / amd64
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

sudo apt install docker-ce docker-ce-cli containerd.io
```
</details>

### Docker Compose 설치
- APT 패키지 매니저를 이용하여 설치합니다.
```bash
sudo apt install docker-compose
```

## mc-admin-cli 소스코드 다운로드
```bash
git clone https://github.com/MZC-CSC/mc-admin-cli.git
```

## 도커 서비스 정의 확인
M-CMP 시스템 구성에 필요한 서비스 정보는 `docker-compose-mode-files` 폴더 하위에 정의되어 있으니 `mc-admin-cli/conf/docker/docker-compose.yaml` 파일의 내용들을 살펴 보고 필요한 경우 수정합니다.

## mc-admin-cli 실행파일 또는 소스코드 빌드
bin 폴더에 최신 실행 파일이 있으니 사용하기 바라며, 소스 빌드가 필요한 경우에는 README에 설명된 go 설치 방법과 build 명령 또는 make 명령의 빌드 방법을 참고합니다.
```bash
cd mc-admin-cli/src
go build -o ../bin/mcc main.go
```

## mc-admin-cli 이용하여 M-CMP 실행
```bash
../bin/mcc infra run -d  # background 모드에서 mcmp 플랫폼을 실행합니다.
```

## M-CMP 실행상태 확인
```bash
../bin/mcc infra info
```


## M-CMP 중지
```bash
../bin/mcc infra stop
```

## M-CMP 삭제
```bash
../bin/mcc infra remove -v -i  # -v 옵션은 volume 도 같이 삭제하며 -i 는 image 도 같이 삭제합니다.
```

## [참고] 프레임워크별 컨테이너 구성 및 Endpoint
| Framework별 Container Name | Endpoint |
|---|---|
| mc-infra-connector | http://{{host}}:1024/spider |
| mc-infra-manager | http://{{host}}:1323/tumblebug |
| mc-iam-manager | http://{{host}}:5000 |
| mc-cost-optimizer-fe | http://{{host}}:7780 |
| mc-application-manager | http://{{host}}:18084 |
| mc-workflow-manager | http://{{host}}:18083 |
| mc-data-manager | http://{{host}}:3300 |
| mc-web-console-api | http://{{host}}:3000 |
| mc-web-console-front | http://{{host}}:3001 |
| mc-observability-chronograf | http://{{host}}:8888 |
| mc-observability-opensearch-dashboards | http://{{host}}:5601 |
