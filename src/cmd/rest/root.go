/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package rest

import (
	"fmt"

	"strings"

	"github.com/mc-admin-cli/mcc/src/cmd"

	"github.com/go-resty/resty/v2"
	"github.com/spf13/cobra"
)

var client = resty.New()
var req = client.R()

var headers []string
var username string
var password string
var isShowHeaders bool
var sendData string
var fileData string
var isVerbose bool
var authToken string
var authScheme string

// restCmd represents the rest command
var restCmd = &cobra.Command{
	Use:   "rest",
	Short: "rest api call",
	Long:  `rest api call`,
	//Args:  cobra.ExactArgs(1),

	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		//fmt.Println(isVerbose)
		//fmt.Println("============ 아규먼트 :  " + strconv.Itoa(len(args)))
		if len(args) != 0 { //하위 커맨드가 실행된 경우에만 실행 그 외에는 도움말만 실행
			if isVerbose {
				req.EnableTrace()
			}
			SetAuthToken() // Authorization: <auth-scheme> <auth-token-value>  // default auth-scheme : Bearer
			SetBasicAuth() // Authorization: Basic <base64-encoded-value>
			SetHeaders()
			SetReqData()

			if isVerbose {
				fmt.Println("==============================")
			}
		}
	},

	Run: func(cmd *cobra.Command, args []string) {
		//fmt.Println(cmd.UsageString())
		//fmt.Println("============ REST 메인 호출됨!!!!  ")
		fmt.Println(cmd.Help()) // root.go에서는 도움말만 출력 함.
	},
}

func SetBasicAuth() {
	// Set basic authentication
	if username != "" && password != "" {
		if isVerbose {
			fmt.Println("username : " + username)
			fmt.Println("password : " + password)
		}
		client.SetBasicAuth(username, password)
	}
}

func SetAuthToken() {
	if authScheme != "" {
		if isVerbose {
			fmt.Printf("sets the auth scheme type : [%s]\n", authScheme)
		}
		client.SetAuthScheme(authScheme)
	}

	if authToken != "" {
		if isVerbose {
			fmt.Printf("sets the auth token of the `Authorization` header : [%s]\n", authToken)
		}
		client.SetAuthToken(authToken)
	}
}

// func SetHeaders(req *resty.Request) {
func SetHeaders() {
	if isVerbose {
		if len(headers) > 0 {
			fmt.Println("Setting headers... count:", len(headers))
		} // end if
	} // end if isVerbose

	// Set headers
	for _, h := range headers {
		headerParts := strings.SplitN(h, ":", 2)
		if len(headerParts) != 2 {
			fmt.Println("Invalid header format:", h)
			continue
		}
		req.Header.Set(strings.TrimSpace(headerParts[0]), strings.TrimSpace(headerParts[1]))
		if isVerbose {
			fmt.Printf("%s : %s\n", strings.TrimSpace(headerParts[0]), strings.TrimSpace(headerParts[1]))
		}
	} // end for
}

// func SetReqData(req *resty.Request) {
func SetReqData() {
	if isVerbose {
		fmt.Println("request data : \n" + sendData)
	}
	req.SetBody(sendData)
}

func ProcessResultInfo(resp *resty.Response) {
	// 응답 출력
	if isVerbose {
		ShowTraceInfo(resp)
	} else {
		if isShowHeaders {
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
}

func ShowTraceInfo(resp *resty.Response) {
	// Explore trace info
	fmt.Println("Request Trace Info:")
	ti := resp.Request.TraceInfo()
	fmt.Println("  DNSLookup     :", ti.DNSLookup)
	fmt.Println("  ConnTime      :", ti.ConnTime)
	fmt.Println("  TCPConnTime   :", ti.TCPConnTime)
	fmt.Println("  TLSHandshake  :", ti.TLSHandshake)
	fmt.Println("  ServerTime    :", ti.ServerTime)
	fmt.Println("  ResponseTime  :", ti.ResponseTime)
	fmt.Println("  TotalTime     :", ti.TotalTime)
	fmt.Println("  IsConnReused  :", ti.IsConnReused)
	fmt.Println("  IsConnWasIdle :", ti.IsConnWasIdle)
	fmt.Println("  ConnIdleTime  :", ti.ConnIdleTime)
	fmt.Println("  RequestAttempt:", ti.RequestAttempt)
	fmt.Println("  RemoteAddr    :", ti.RemoteAddr.String())
	fmt.Println()

	// Explore response object
	fmt.Println("Response Info:")
	fmt.Println("  Headers:")
	for key, values := range resp.Header() {
		for _, value := range values {
			fmt.Printf("%s: %s\n", key, value)
		}
	}

	fmt.Println("  Status Code:", resp.StatusCode())
	fmt.Println("  Status     :", resp.Status())
	fmt.Println("  Proto      :", resp.Proto())
	fmt.Println("  Time       :", resp.Time())
	fmt.Println("  Received At:", resp.ReceivedAt())
	fmt.Println("  Body       :\n", resp)
	fmt.Println()
}

func init() {
	cmd.RootCmd.AddCommand(restCmd)

	// Add flags for headers
	restCmd.PersistentFlags().StringSliceVarP(&headers, "header", "H", []string{}, "Pass custom header(s) to server")

	// Add flags for basic authentication
	restCmd.PersistentFlags().StringVarP(&username, "user", "u", "", "Username for basic authentication") // - sets the basic authentication header in the HTTP request
	restCmd.PersistentFlags().StringVarP(&password, "password", "p", "", "Password for basic authentication")

	// 인증 토큰 설정
	restCmd.PersistentFlags().StringVarP(&authToken, "authToken", "", "", "sets the auth token of the 'Authorization' header for all HTTP requests.(The default auth scheme is 'Bearer')")
	restCmd.PersistentFlags().StringVarP(&authScheme, "authScheme", "", "", "sets the auth scheme type in the HTTP request.(Exam. OAuth)(The default auth scheme is Bearer)")

	// Add flag to show response headers
	restCmd.PersistentFlags().BoolVarP(&isShowHeaders, "head", "I", false, "Show response headers only")

	// Add flag for post data
	restCmd.PersistentFlags().StringVarP(&sendData, "data", "d", "", "Data to send to the server")
	restCmd.PersistentFlags().StringVarP(&fileData, "file", "f", "", "Data to send to the server from file")

	restCmd.PersistentFlags().BoolVarP(&isVerbose, "verbose", "v", false, "Show more detail information")

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// restCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// restCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
