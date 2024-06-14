
## RESTful 명령 사용 가이드

이 가이드에서는 `mc-admin-cli`의 `rest` 서브 커맨드를 이용하여 `RESTful` 기반으로 M-CMP 시스템의 Open API를 실행하는 방법에 대해 소개합니다.    

`rest` 서브 커맨드는 M-CMP 시스템의 간단한 REST API 호출을 위해 가볍게 제공되는 유틸성 기능입니다.


## 순서
1. 실행파일 다운로드
1. rest 명령어 사용법



## 실행파일 다운로드
실행 파일을 이용하거나 git 소스를 내려 받아서 실행 가능합니다.   
아래 방법으로 실행 파일을 다운로드하거나 README를 참고하여 최신 소스 코드를 빌드하세요.   

```bash
$ wget https://github.com/cloud-barista/mc-admin-cli/raw/main/bin/mcc
$ chmod +x mcc
```


## rest 명령어 사용법 

RESTful의 기본적인 get/post/delete/put/patch 명령을 지원하며 `mcc rest -h` 명령으로 rest 서브 커멘드에서 제공하는 기능들에 대해서 자세히 살펴 볼 수 있습니다.

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

M-CMP 시스템의 프레임워크들은 REST API 사용시 인증이 필요한 프레임워크와 인증이 필요 없는 프레임워크가 존재하는데 인증이 필요한 경우 REST API에 Bearer 인증을 사용하고있습니다.   
REST API를 호출할 때 인증이 필요한 경우에는 --user와 --password 플래그를 이용해서 Bearer 인증을 설정할 수 있으며, 다른 인증 방식이 필요한 경우에는 --authScheme 와 --authToken 플래그를 활용하세요.


### header 설정 예시
헤더 설정이 필요한 경우 -H 또는 --header 플래그를 이용해서 원하는 헤더의 설정이 가능합니다.
```
$ ./mcc rest --header "Content-Type:application/json"
```

### get 메소드 예시
mc-infra-connector 의 cloudos rest api 호출
```
$ ./mcc rest get http://localhost:1024/spider/cloudos

[실행결과]   
{"cloudos":["AWS","AZURE","GCP","ALIBABA","TENCENT","IBM","OPENSTACK","CLOUDIT","NCP","NCPVPC","NHNCLOUD","KTCLOUD","KTCLOUDVPC","DOCKER","MOCK","CLOUDTWIN"]}
```

mc-infra-manager 의 aws-eu-south-2 리전 조회 rest api 호출
```
$ ./mcc rest get http://localhost:1024/spider/region/aws-eu-south-2

[실행결과]   
{"RegionName":"aws-eu-south-2","ProviderName":"AWS","KeyValueInfoList":[{"Key":"Region","Value":"eu-south-2"},{"Key":"Zone","Value":"eu-south-2a"}],"AvailableZoneList":null}
```


### 인증 정보 설정 예시
-u 또는 --user 플래그와 -p 또는 --password 플래그를 이용해서 호출하는 REST 명령에 Bearer 인증 정보를 설정할 수 있습니다.
```
$ ./mcc rest get -u default -p default http://localhost:1323/tumblebug/readyz

[실행결과]   
2024/06/13 13:41:59.924202 WARN RESTY Using Basic Auth in HTTP mode is not secure, use HTTPS
{"message":"CB-Tumblebug is ready"}
```

### JSON Data 전달 예시
-d 또는 --data 플래그를 이용해서 POST 방식 등의 JSON 데이터를 서버에 전달할 수 있습니다.


mc-infra-manager에 aws-test-seoul 리전 등록
```
$ ./mcc rest post  --header "Content-Type:application/json" http://localhost:1024/spider/region -d '{"RegionName":"aws-test-seoul1","ProviderName":"AWS","KeyValueInfoList":[{"Key":"Region","Value":"ap-northeast-2"},{"Key":"Zone","Value":"ap-northeast-2a"}]}'

[실행결과]   
{"RegionName":"aws-test-seoul1","ProviderName":"AWS","KeyValueInfoList":[{"Key":"Region","Value":"ap-northeast-2"},{"Key":"Zone","Value":"ap-northeast-2a"}],"AvailableZoneList":null}
```


만약, JSON 데이터를 직접 전달하지 않고 전달할 JSON Data가 파일에 저장되어 있다면 -f 또는 --file 옵션으로 전달할 데이터의 파일을 지정할 수도 있습니다.
[seoul.json]
```
{"RegionName":"aws-test-seoul1","ProviderName":"AWS","KeyValueInfoList":[{"Key":"Region","Value":"ap-northeast-2"},{"Key":"Zone","Value":"ap-northeast-2a"}]}'
```

seoul.json 파일을 이용해서 리전 등록
```
$ ./mcc rest post  --header "Content-Type:application/json" http://localhost:1024/spider/region --file ./seoul.json

[실행결과]   
{"RegionName":"aws-test-seoul1","ProviderName":"AWS","KeyValueInfoList":[{"Key":"Region","Value":"ap-northeast-2"},{"Key":"Zone","Value":"ap-northeast-2a"}],"AvailableZoneList":null}
```

### REST 응답 값을 파일로 저장
-o 또는 --output 플래그를 이용하면 rest api 호출 결과를 파일로 저장할 수 있습니다.    
mc-infra-manager의 aws-eu-south-2 리전 조회 rest api 호출 결과를 result.json으로 저장
```
$ ./mcc rest get http://localhost:1024/spider/region/aws-eu-south-2 --output result.json

$ cat result.json
{"RegionName":"aws-eu-south-2","ProviderName":"AWS","KeyValueInfoList":[{"Key":"Region","Value":"eu-south-2"},{"Key":"Zone","Value":"eu-south-2a"}],"AvailableZoneList":null}
```