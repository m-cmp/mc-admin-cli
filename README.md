# M-CMP ADMIN CLI (mcc)
This repository provides a Multi-Cloud ADMIN CLI.    
The name of this tool is mcc(Multi-Cloud admin CLI).    
A sub-system of [M-CMP platform](https://github.com/m-cmp) to deploy and manage Multi-Cloud Infrastructures.    


```
[NOTE]
mcc is currently under development.
So, we do not recommend using the current release in production.
Please note that the functionalities of mcc are not stable and secure yet.
If you have any difficulties in using mcc, please let us know.
(Open an issue or Join the M-CMP Slack)
```

## mcc Overview
- Management tool that supports the installation, execution, status information provision, termination, and API calls of the M-CMP system.
- Currently, only the Docker Compose mode is supported.
  - [Docker Compose mode](./docs/mcc-docker-compose-mode.md)

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

(Build a binary for mcc using Makerfile depends on your machine's os type)
mc-admin-cli/src$ make
mc-admin-cli/src$ make win
mc-admin-cli/src$ make mac
mc-admin-cli/src$ make linux-arm
mc-admin-cli/src$ make win86
mc-admin-cli/src$ make mac-arm
```

# How to use the mcc

```
mc-admin-cli/bin$ ./mcc -h

The mcc is a tool to operate Cloud-Barista system. 
  
Usage:
  mcc [command]

Available Commands:
  api         Call the M-CMP system's Open APIs as services and actions
  docker      A tool to operate M-CMP system
  help        Help about any command
  rest        rest api call

Flags:
  -h, --help   help for mcc

Use "mcc [command] --help" for more information about a command.
```

For more detailed explanations, see the articles below.   
- [docker sub-command guide](./docs/mc-admin-cli-docker-compose-mode.md)
- [rest sub-command guide](./docs/mc-admin-cli-rest.md)

## docker-compose.yaml
```
The necessary service information for the M-CMP System configuration is defined in the mc-admin-cli/docker-compose-mode-files/docker-compose.yaml file.(By default, it is set to build the desired configuration and data volume in the docker-compose-mode-files folder.)

If you want to change the information for each container you want to deploy, modify the mc-admin-cli/docker-compose-mode-files/docker-compose.yaml file or use the -f option.
```

## docker subcommand
For more information, check out [the docker subcommand document.](./docs/mc-admin-cli-docker-compose-mode.md)


For now, it supports docker's run/stop/info/pull/remove commands.

Use the -h option at the end of the sub-command requiring assistance, or executing 'mcc' without any options will display the help manual.


```
Usage:
  mcc docker [flags]
  mcc docker [command]

Available Commands:
  info        Get information of M-CMP System
  pull        Pull images of M-CMP System containers
  remove      Stop and Remove M-CMP System
  run         Setup and Run M-CMP System
  stop        Stop M-CMP System

Flags:
  -h, --help   help for docker

Use "mcc docker [command] --help" for more information about a command.
```

## docker subcommand examples
Simple usage examples for docker subcommand
```
 ./mcc docker pull [-f ../docker-compose-mode-files/docker-compose.yaml]   
 ./mcc docker run [-f ../docker-compose-mode-files/docker-compose.yaml]   
 ./mcc docker info   
 ./mcc docker stop [-f ../docker-compose-mode-files/docker-compose.yaml]   
 ./mcc docker remove [-f ../docker-compose-mode-files/docker-compose.yaml] -v -i   

```
## k8s subcommand
K8S is not currently supported and will be supported in the near future.

## rest subcommand
The rest subcommands are developed around the basic features of REST to make it easy to use the open APIs of M-CMP-related frameworks from the CLI.
For now, it supports get/post/delete/put/patch commands.

For more information, check out [the rest subcommand document.](./docs/mc-admin-cli-rest.md)

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

## rest command examples
Simple usage examples for rest commands

```
./mcc rest get -u default -p default http://localhost:1323/tumblebug/health
./mcc rest post https://reqres.in/api/users -d '{
                "name": "morpheus",
                "job": "leader"
        }'
```

## api subcommand
The api subcommands are developed to make it easy to use the open APIs of M-CMP-related frameworks from the CLI.

```
Call the action of the service defined in api.yaml. 

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

## api subcommand examples
Simple usage examples for api subcommand.

```
./mcc api --help
./mcc api --list
./mcc api --service spider --list
./mcc api --service spider --action ListCloudOS
./mcc api --service spider --action GetCloudDriver --pathParam driver_name:AWS
./mcc api --service spider --action GetRegionZone --pathParam region_name:ap-northeast-3 --queryString ConnectionName:aws-config01
```