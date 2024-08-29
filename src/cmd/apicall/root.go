/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package apicall

import (
	"errors"
	"fmt"
	"io/ioutil"
	"strings"

	"github.com/go-resty/resty/v2"
	"github.com/mc-admin-cli/mcc/src/cmd"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var configFile string

var serviceName string
var actionName string

// var method string
var isInit bool
var isListMode bool
var isVerbose bool
var pathParam string
var queryString string

var client = resty.New()
var req = client.R()
var sendData string
var inputFileData string
var outputFile string

// auth : About changing credentials from the CLI
var username string
var password string
var authToken string

type ServiceInfo struct {
	BaseURL      string `yaml:"baseurl"`
	Auth         Auth   `yaml:"auth"`
	ResourcePath string `yaml:"resourcePath"`
	Method       string `yaml:"method"`
}

// basic : username / password
// bearer : token
type Auth struct {
	Type     string `yaml:"type"`
	Username string `yaml:"username,omitempty"`
	Password string `yaml:"password,omitempty"`
	Token    string `yaml:"token,omitempty"`
}

var serviceInfo ServiceInfo

// apiCmd represents the svc command
var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "Call the M-CMP system's Open APIs as services and actions",
	Long: `Call the action of the service defined in api.yaml. For example :

./mcc api --help
./mcc api --list
./mcc api --service spider --list
./mcc api --service spider --action ListCloudOS
./mcc api --service spider --action GetCloudDriver --pathParam driver_name:AWS
./mcc api --service spider --action GetRegionZone --pathParam region_name:ap-northeast-3 --queryString ConnectionName:aws-config01
`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		//fmt.Printf("len(args) : %d\n", len(args))
		//fmt.Printf("cmd.Flags().NFlag() : %d\n", cmd.Flags().NFlag())
		//fmt.Printf("cmd.HasSubCommands() : %v\n", !cmd.HasSubCommands())

		isInit = false
		// tool 서브 커맨드가 입력되었을 때에는 도움말을 출력하지 않음.
		if len(args) == 0 && cmd.Flags().NFlag() == 0 && cmd.HasSubCommands() {
			fmt.Println(cmd.Help())
			return
		}

		//fmt.Println("============ 아규먼트 :  " + strconv.Itoa(len(args)))
		//fmt.Println("============ 플래그 수 :  " + strconv.Itoa(cmd.Flags().NFlag()))

		//viper.AddConfigPath("../conf")
		viper.SetConfigFile(configFile)

		// 설정 파일 읽어오기
		err := viper.ReadInConfig()
		if err != nil {
			fmt.Printf("Error reading config file: %s\n", err)
			return
		}
		isInit = true

		//fmt.Println("cliSpecVersion : ", viper.GetString("cliSpecVersion"))
		//fmt.Println("Loaded configurations:", viper.AllSettings())
		if isVerbose {
			client.SetDebug(true)
			//spew.Dump(viper.AllSettings())
		}
	},

	Run: func(cmd *cobra.Command, args []string) {
		if !isInit {
			return
		}

		//
		// list 명령어 처리
		//
		if isListMode {
			if isVerbose {
				fmt.Println("List Mode")
			}
			if serviceName == "" {
				showServiceList()
			} else if actionName == "" {
				showActionList(serviceName)
			} else {
				fmt.Printf("Both the service and action were specified.\nThe list no longer exists to lookup.\n")
			}

			return
		}

		// 호출할 서비스 정보 처리
		errParse := parseRequestInfo()
		if errParse != nil {
			fmt.Println(errParse)
			return
		}

		if isVerbose {
			//spew.Dump(serviceInfo)

			fmt.Println("")
			fmt.Println("Base URL:", serviceInfo.BaseURL)
			fmt.Println("Auth Type:", serviceInfo.Auth.Type)
			fmt.Println("Username:", serviceInfo.Auth.Username)
			fmt.Println("Password:", serviceInfo.Auth.Password)
			fmt.Println("Token:", serviceInfo.Auth.Token)
			fmt.Println("ResourcePath:", serviceInfo.ResourcePath)
			fmt.Println("Method:", serviceInfo.Method)
		}

		fmt.Println("\nservice calling...")
		errRest := callRest()
		if errRest != nil {
			fmt.Println(errRest)
			return
		}
	},
}

// 서비스 목록 조회
func showServiceList() {
	services := viper.GetStringMap("services")

	fmt.Printf("============\n")
	fmt.Printf("Service list\n")
	fmt.Printf("============\n")

	for serviceName := range services {
		fmt.Println(serviceName)
	}
}

// 서비스 하위의 액션 목록 조회
func showActionList(serviceName string) {
	spiderActions := viper.GetStringMap("serviceActions." + serviceName)

	fmt.Printf("==============================\n")
	fmt.Printf("[%s] Service Actions list\n", serviceName)
	fmt.Printf("==============================\n")
	for actionName := range spiderActions {
		fmt.Println(actionName)
	}
}

// 입력 값 기반으로 호출할 서비스 정보를 정리함.
func parseRequestInfo() error {
	// 서비스 검증
	if serviceName == "" {
		return errors.New("no service is specified to call")
	}

	if !viper.IsSet("services." + serviceName) {
		//return errors.New("information about the service [" + serviceName + "] you are trying to call does not exist")
		return errors.New("the name of the service[" + serviceName + "] you want to call is not on the list of supported services.\nPlease check the api.yaml configuration file or the list of available services")
	}

	// 액션 검증
	if actionName == "" {
		return errors.New("no action name is specified to call")
	}

	if !viper.IsSet("serviceActions." + serviceName + "." + actionName) {
		return errors.New("the requested action[" + actionName + "] does not exist for the service[" + serviceName + "] you are trying to call\nPlease check the api.yaml configuration file or the list of available actions for the service you want to call.")
	}

	// 서비스 정보 파싱
	err := viper.UnmarshalKey("services."+serviceName, &serviceInfo)
	if err != nil {
		return err
	}

	// 인증 정보를 CLI로 전달 받았을 경우 처리
	if authToken != "" {
		serviceInfo.Auth.Token = authToken
	}
	if username != "" {
		serviceInfo.Auth.Username = username
	}
	if password != "" {
		serviceInfo.Auth.Password = password
	}

	if serviceInfo.BaseURL == "" {
		return errors.New("couldn't find the BaseURL information for the service to call\nPlease check the api.yaml configuration file")
	}

	// 액션 정보 파싱
	err = viper.UnmarshalKey("serviceActions."+serviceName+"."+actionName, &serviceInfo)
	if err != nil {
		return err
	}

	if serviceInfo.ResourcePath == "" {
		return errors.New("couldn't find the ResourcePath information for the action to call\nPlease check the api.yaml configuration file")
	}

	// 가변 URI 처리
	errParam := parsePathParam()
	if errParam != nil {
		//fmt.Println(errParam)
		return errParam
	}

	// 쿼리 문자열 처리
	if queryString != "" {
		// queryString 값이 ?로 시작하는지 확인
		startsWithQuestionMark := strings.HasPrefix(queryString, "?")

		// ResourcePath가 ?로 끝나는 경우
		if strings.HasSuffix(serviceInfo.ResourcePath, "?") {
			if startsWithQuestionMark {
				serviceInfo.ResourcePath = serviceInfo.ResourcePath + queryString[1:]
			} else {
				serviceInfo.ResourcePath = serviceInfo.ResourcePath + queryString
			}
		} else {
			if startsWithQuestionMark {
				serviceInfo.ResourcePath = serviceInfo.ResourcePath + queryString
			} else {
				serviceInfo.ResourcePath = serviceInfo.ResourcePath + "?" + queryString
			}
		}
	}

	return nil
}

// 가변 경로를 처리 함.
func parsePathParam() error {
	if isVerbose {
		fmt.Println("pathParam:", pathParam)
		fmt.Println("ResourcePath:", serviceInfo.ResourcePath)
		fmt.Println("checking path paramter infomation...")
	}

	//Path 파라메터 처리
	if strings.Contains(serviceInfo.ResourcePath, "{") {
		if pathParam == "" {
			return errors.New("couldn't find uri path parameter(key:value) information for URI PATH\nThis URI requires the following path parameter information\n" + serviceInfo.ResourcePath)
		}

		//가변 경로 처리
		pathParams := make(map[string]string)
		params := strings.Fields(pathParam)
		for _, param := range params {
			keyValue := strings.Split(param, ":")
			if len(keyValue) == 2 {
				//key := strings.ToLower(keyValue[0])
				key := keyValue[0]
				value := keyValue[1]
				pathParams[key] = value
			}
		}

		// resourcePath의 키를 대소문자 구분하여 치환
		for key, value := range pathParams {
			//lowerKey := strings.ToLower(key)
			placeholder := "{" + key + "}"
			//serviceInfo.ResourcePath = strings.Replace(serviceInfo.ResourcePath, placeholder, value, -1)
			serviceInfo.ResourcePath = strings.Replace(serviceInfo.ResourcePath, placeholder, value, -1)
		}

		if strings.Contains(serviceInfo.ResourcePath, "{") {
			return errors.New("couldn't find all uri path parameter(key:value) information for URI PATH\nThis URI requires the following addtional path parameter information\nkey names used for URI mapping are case sensitive.\n" + serviceInfo.ResourcePath)
		}
	}

	if isVerbose {
		fmt.Println("ResourcePath:", serviceInfo.ResourcePath)
	}
	return nil
}

func SetBasicAuth() {
	// Set basic authentication
	if serviceInfo.Auth.Username != "" && serviceInfo.Auth.Password != "" {
		if isVerbose {
			fmt.Println("setting basic auth")
			fmt.Println("username : " + serviceInfo.Auth.Username)
			fmt.Println("password : " + serviceInfo.Auth.Password)
		}
		client.SetBasicAuth(serviceInfo.Auth.Username, serviceInfo.Auth.Password)
	}
}

// Authentication
func SetAuth() {
	switch strings.ToLower(serviceInfo.Auth.Type) {
	case "none", "":
		// 인증이 필요 없는 경우 아무 것도 하지 않음
	case "basic":
		// Set basic authentication
		SetBasicAuth()
	case "bearer":
		// Set Bearer authentication
		if serviceInfo.Auth.Token != "" {
			if isVerbose {
				fmt.Println("Setting bearer auth")
				fmt.Println("Token : " + serviceInfo.Auth.Token)
			}
			client.SetAuthToken(serviceInfo.Auth.Token)
		}
	default:
		SetBasicAuth() // Set basic authentication
		//fmt.Println("Unknown authentication type:", serviceInfo.Auth.Type)
	}
}

// func SetReqData(req *resty.Request) {
func SetReqData() error {
	if inputFileData != "" {
		if isVerbose {
			fmt.Printf("use [%s] data file\n" + inputFileData)
		}

		// 파일에서 데이터 읽기
		data, err := ioutil.ReadFile(inputFileData)
		if err != nil {
			return err
		}
		req.SetBody(data)
	} else {
		if isVerbose {
			fmt.Printf("request data : %s\n" + sendData)
		}
		req.SetBody(sendData)
	}

	return nil
}

func ProcessResultInfo(resp *resty.Response) {
	if isVerbose {
		fmt.Println("  Headers:")
		for key, values := range resp.Header() {
			for _, value := range values {
				fmt.Printf("%s: %s\n", key, value)
			}
		}
		fmt.Println("")
	}

	fmt.Println(string(resp.Body()))
}

// REST API를 호출한다.
func callRest() error {
	var resp *resty.Response
	var err error

	SetAuth()          // 인증 처리
	err = SetReqData() // 전송 데이터 처리
	if err != nil {
		return err
	}

	//출력 파일 지정
	if outputFile != "" {
		req.SetOutput(outputFile)
	}

	url := serviceInfo.BaseURL + serviceInfo.ResourcePath

	switch strings.ToLower(serviceInfo.Method) {
	case "get":
		resp, err = req.Get(url)
	case "post":
		resp, err = req.Post(url)
	case "put":
		resp, err = req.Put(url)
	case "delete":
		resp, err = req.Delete(url)
	case "patch":
		resp, err = req.Patch(url)
	}

	if err != nil {
		return err
	}
	ProcessResultInfo(resp)

	return nil
}

func init() {
	apiCmd.PersistentFlags().StringVarP(&configFile, "config", "c", "../conf/api.yaml", "config file (default is ../conf/api.yaml)")

	// Add flags for basic authentication
	apiCmd.PersistentFlags().StringVarP(&username, "authUser", "", "", "Username for basic authentication") // - sets the basic authentication header in the HTTP request
	apiCmd.PersistentFlags().StringVarP(&password, "authPassword", "", "", "Password for basic authentication")

	// 인증 토큰 설정
	apiCmd.PersistentFlags().StringVarP(&authToken, "authToken", "", "", "sets the auth token of the 'Authorization' header for all HTTP requests.(The default auth scheme is 'Bearer')")
	//apiCmd.PersistentFlags().StringVarP(&authScheme, "authScheme", "", "", "sets the auth scheme type in the HTTP request.(Exam. OAuth)(The default auth scheme is Bearer)")

	apiCmd.PersistentFlags().StringVarP(&serviceName, "service", "s", "", "Service to perform")
	apiCmd.PersistentFlags().StringVarP(&actionName, "action", "a", "", "Action to perform")
	// apiCmd.PersistentFlags().StringVarP(&method, "method", "m", "", "HTTP Method")
	apiCmd.PersistentFlags().BoolVarP(&isVerbose, "verbose", "v", false, "Show more detail information")
	apiCmd.PersistentFlags().StringVarP(&pathParam, "pathParam", "p", "", "Variable path info set \"key1:value1 key2:value2\" for URIs")
	apiCmd.PersistentFlags().StringVarP(&queryString, "queryString", "q", "", "Use if you have a query string to add to URIs")

	apiCmd.Flags().BoolVarP(&isListMode, "list", "l", false, "Show Service or Action list")
	apiCmd.PersistentFlags().StringVarP(&sendData, "data", "d", "", "Data to send to the server")
	apiCmd.PersistentFlags().StringVarP(&inputFileData, "file", "f", "", "Data to send to the server from file")
	apiCmd.PersistentFlags().StringVarP(&outputFile, "output", "o", "", "<file> Write to file instead of stdout")

	cmd.RootCmd.AddCommand(apiCmd)
}
