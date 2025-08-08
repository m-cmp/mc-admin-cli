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
- Currently, infra subcommand is only support docker compose base infra install and management.
  - [infra subcommand](./docs/mc-admin-cli-infra.md)
- If you want to checkout how to run the whole subsystem on the single instance on CSP Instance, see [this document](./docs/mc-admin-cli-infra.md).

## Development & Test Environment
- Go 1.23
- Docker version 27.3.1
- Docker Compose version v2.29

## Install Docker & Docker Compose V2

- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

checkout the commands down below.

```shell
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update

sudo apt-get install -y docker-ce docker-ce-cli docker-compose-plugin
```

# Quick Guide
This section describes the minimal process for those who want to set up quickly.   
For more detailed installation guide, please refer to the [Running on Single Instance Guide](https://github.com/m-cmp/mc-admin-cli/blob/main/docs/running-on-instance.md) document.   

First, clone the repository.
```shell
git clone https://github.com/m-cmp/mc-admin-cli.git
cd mc-admin-cli/bin
```

For [mc-date-manager](https://github.com/cloud-barista/mc-data-manager/blob/main/docs/Datamanager-Docker-Guide.md) configuration, you need to copy and edit `profile.json` which will be used for csp credenticals.
```shell
cp ../conf/docker/conf/mc-data-manager/data/var/run/data-manager/profile/sample.json ./profile.json
```

After downloading mc-admin-cli, move to the bin folder and run the installAll.sh shell script.
```shell 
./installAll.sh
```

For [mc-date-manager](https://github.com/cloud-barista/mc-data-manager/blob/main/docs/Datamanager-Docker-Guide.md) configuration, you need to copy the profile.json into mc-data-manager container. Try `./mcc infra stop` and `./mcc infra run` if mc-date-manager keeps unhealthy.
```shell
docker cp profile.json  mc-data-manager:/app/data/var/run/data-manager/profile/profile.json
```
(optionally, remove the profile.json file since it is not secure)

After a while, check that all required containers are in healthy status without any unhealthy status.   
Especially, make sure that the mc-web-console-api container, which runs last, is healthy.
```shell 
./mcc infra info
```

Usually, the work so far is sufficient, but if the web console is not working properly,   
check the logs of the mc-iam-manager-post-initial container below to verify that all configuration tasks have been processed normally.   
If the mc-iam-manager-post-initial operation does not terminate successfully, please run the iam_manager_init.sh shell script in the mc-admin-cli/bin folder.
```shell 
docker logs mc-iam-manager-post-initial
```

Once the mc-web-console-api container becomes healthy, initialize CB-Tumblebug using the following instructions:
- [Quick Start Guide – CB-Tumblebug](https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#quick-start-)
- In the guide, running `init.sh` is the required step.

By default, the web console can be accessed at http://{HostIP}:3001 using the temporary credentials:
- Username: `mcmp`
- Password: `mcmp_password`


If you want to completely initialize the working environment due to other Docker environments or existing tests, please use the cleanAll.sh shell script in the mc-admin-cli/bin folder.   
**[WARNING] All Docker environments and existing work history on the system will be deleted.**
```shell 
$ cd mc-admin-cli/bin
$ ./cleanAll.sh
```


## Firewall Port Information

The following ports should be registered in the firewall if needed:

### **MC-INFRA-CONNECTOR**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-infra-connector | 1024 | TCP | CB-Spider API |

### **MC-INFRA-MANAGER**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-infra-manager | 1323 | TCP | CB-Tumblebug API |
| mc-infra-manager-etcd | 2379, 2380 | TCP | etcd cluster |
| mc-infra-manager-postgres | 6432 | TCP | PostgreSQL DB |

### **MC-IAM-MANAGER**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-iam-manager | 5000 | TCP | IAM Manager API |
| mc-iam-manager-db | 5432 | TCP | PostgreSQL DB |
| mc-iam-manager-kc | 8080 | TCP | Keycloak |
| mc-iam-manager-nginx | 80, 443 | TCP | Nginx (HTTP/HTTPS) |

### **MC-COST-OPTIMIZER**
| Service | Port | Protocol | Description |
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
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-application-manager-jenkins | 9800 | TCP | Jenkins |
| mc-application-manager-sonatype-nexus | 8081, 5500 | TCP | Nexus Repository |
| mc-application-manager | 18084 | TCP | Application Manager API |

### **MC-WORKFLOW-MANAGER**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-workflow-manager-jenkins | 9880 | TCP | Jenkins |
| mc-workflow-manager | 18083 | TCP | Workflow Manager API |

### **MC-DATA-MANAGER**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-data-manager | 3300 | TCP | Data Manager API |

### **MC-WEB-CONSOLE**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-web-console-db | 15432 | TCP | PostgreSQL DB |
| mc-web-console-api | 3000 | TCP | Web Console API |
| mc-web-console-front | 3001 | TCP | Web Console Frontend |

### **MC-OBSERVABILITY**
| Service | Port | Protocol | Description |
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

**Total 39 ports** are configured for external access.

The following ports must be registered in the firewall:
### **Required Firewall Services**
| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| mc-web-console-api | 3000 | TCP | Web Console API |
| mc-web-console-front | 3001 | TCP | Web Console Frontend |
| mc-cost-optimizer-fe | 7780 | TCP | Cost Optimizer Frontend |


<!-- 
# Quick Guide
 Required: Domain, Email
  - SSL and IDP configuration requires certificates. (If you already have certificates in use, substitute them into the nginx configuration values of the iam manager)

1. Certificate Issuance (docker execution)
 Execution location: ./conf/docker
```shell 
sudo docker compose -f docker-compose.cert.yaml up
```
When issuance is successful, pem files are created in the folder with the corresponding domain name.
ex)
 ./container-volume/mc-iam-manager/certs/live/<my domain>fullchain.pem
 ./container-volume/mc-iam-manager/certs/live/<my domain>/privkey.pem

After domain issuance is complete, run docker down (to be used again for future renewals)
```shell 
sudo docker compose -f docker-compose.cert.yaml up
```

2. Execute nginx configuration script
 (If the owner of container-volume is root, change ownership to the appropriate user)
```shell 
  sudo chown -R ubuntu:ubuntu ./container-volume
  cd mc-iam-manager
  ./0_preset_create_nginx_conf.sh
```
 Creates files in container-volume/mc-iam-manager/nginx using template files and configuration information under the mc-iam-manager folder.

3. After completing admin cli docker configuration, start the service with docker compose.
```shell 
sudo docker compose -f docker-compose.yaml
``` -->


---

# Command to build the operator from souce code
```Shell
$ git clone https://github.com/m-cmp/mc-admin-cli.git
$ cd mc-admin-cli/src

(Setup dependencies)
mc-admin-cli/src$ go get -u

(Build a binary for mcc)
mc-admin-cli/src$ go build -o mcc

**Build a binary for mcc using Makerfile depends on your machine\'s os type**
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
  infra       A tool to operate M-CMP system
  help        Help about any command
  rest        rest api call

Flags:
  -h, --help   help for mcc

Use "mcc [command] --help" for more information about a command.
```

For more detailed explanations, see the articles below.   
- [infra sub-command guide](./docs/mc-admin-cli-infra.md)
- [rest sub-command guide](./docs/mc-admin-cli-rest.md)

## docker-compose.yaml
```
The necessary service information for the M-CMP System configuration is defined in the mc-admin-cli/docker-compose-mode-files/docker-compose.yaml file.(By default, it is set to build the desired configuration and data volume in the docker-compose-mode-files folder.)

If you want to change the information for each container you want to deploy, modify the mc-admin-cli/docker-compose-mode-files/docker-compose.yaml file or use the -f option.
```

## infra subcommand
For more information, check out [the infra subcommand document.](./docs/mc-admin-cli-infra.md)


For now, it supports infra's run/stop/info/pull/remove commands.

Use the -h option at the end of the sub-command requiring assistance, or executing 'mcc' without any options will display the help manual.


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

## infra subcommand examples
Simple usage examples for infra subcommand
```
- ./mcc infra pull [-f ../conf/docker/docker-compose.yaml]
- ./mcc infra run [-f ../conf/docker/docker-compose.yaml]  -d
- ./mcc infra info
- ./mcc infra stop [-f ../conf/docker/docker-compose.yaml]
- ./mcc infra remove [-f ../conf/docker/docker-compose.yaml] -v -i

```
## k8s subcommand
**K8S is not currently supported and will be supported in the near future.**

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
For more information, check out [the infra subcommand document.](./docs/mc-admin-cli-api.md)
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
