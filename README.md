# M-CMP ADMIN CLI (mcc)
This repository provides a Multi-Cloud ADMIN CLI. 
The name of this tool is mcc(Multi-Cloud admin CLI).
A sub-system of [M-CMP platform](https://github.com/m-cmp/docs/tree/main) to deploy and manage Multi-Cloud Infrastructures. 

```
[NOTE]
mcc is currently under development.
So, we do not recommend using the current release in production.
Please note that the functionalities of mcc are not stable and secure yet.
If you have any difficulties in using mcc, please let us know.
(Open an issue or Join the M-CMP Slack)
```

## mcc 개요
- M-CMP 시스템의 설치, 실행, 상태정보 제공, 종료, API 호출 등을 지원하는 관리 도구 입니다.
- 현재는 Docker Compose 모드 방식만 제공합니다.
  - [Docker Compose 모드](docs/mcc-docker-compose-mode.md)

## Install Docker & Docker Compose V2
- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- Tested version: Docker version 24.0.7, build afdd53b
- Tested version: Docker Compose version v2.21.0

# Command to build the operator from souce code
```Shell
$ git clone https://github.com/m-cmp/mc-admin-cli.git
$ cd mc-admin-cli/src

(Setup dependencies)
mc-admin-cli/src$ go get -u

(Build a binary for mcc)
mc-admin-cli/src$ go build -o mcc
```

# Commands to use the mcc

## Help
```
mc-admin-cli/src$ ./mcc 

The mcc is a tool to operate Cloud-Barista system. 
  
  For example, you can setup and run, stop, and ... Cloud-Barista runtimes.
  
  - ./mcc pull [-f ../docker-compose-mode-files/docker-compose.yaml]
  - ./mcc run [-f ../docker-compose-mode-files/docker-compose.yaml]
  - ./mcc info
  - ./mcc stop [-f ../docker-compose-mode-files/docker-compose.yaml]
  - ./mcc remove [-f ../docker-compose-mode-files/docker-compose.yaml] -v -i

Usage:
  mcc [command]

Available Commands:
  help        Help about any command
  info        Get information of Cloud-Barista System
  pull        Pull images of Cloud-Barista System containers
  remove      Stop and Remove Cloud-Barista System
  run         Setup and Run Cloud-Barista System
  stop        Stop Cloud-Barista System

Flags:
      --config string   config file (default is $HOME/.mcc.yaml)
  -h, --help            help for mcc
  -t, --toggle          Help message for toggle

Use "mcc [command] --help" for more information about a command.
```

## Run
```
mc-admin-cli/src$ ./mcc run -h

Setup and Run Cloud-Barista System

Usage:
  mcc run [flags]

Flags:
  -f, --file string   Path to Cloud-Barista Docker-compose file (default "*.yaml")
  -h, --help          help for run

Global Flags:
      --config string   config file (default is $HOME/.mcc.yaml)
```

## Stop
```
mc-admin-cli/src$ ./mcc stop -h

Stop Cloud-Barista System

Usage:
  mcc stop [flags]

Flags:
  -f, --file string   Path to Cloud-Barista Docker-compose file (default "*.yaml")
  -h, --help          help for stop

Global Flags:
      --config string   config file (default is $HOME/.mccvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv.yaml)
```


## How to Contribute
- Issues/Discussions/Ideas: Utilize issue of mc-admin-cli
