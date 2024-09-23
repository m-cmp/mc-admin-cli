package apicall

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"math/rand"

	"github.com/spf13/cobra"
	"github.com/tidwall/gjson"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

var swaggerFile string

// pullCmd represents the pull command
var parseCmd = &cobra.Command{
	Use:   "tool",
	Short: "Swagger JSON file parsing",
	Long:  `Swagger JSON file parsing to assist in writing api.yaml files`,
	Run: func(cmd *cobra.Command, args []string) {
		parseJson()
	},
}

func parseJson() {
	// swagger.json 파일 읽기
	data, err := os.ReadFile(swaggerFile)
	if err != nil {
		log.Fatalf("파일 읽기 오류: %s", err)
	}

	json := string(data)

	// 기본 정보 추출
	title := gjson.Get(json, "info.title")
	version := gjson.Get(json, "info.version")
	host := gjson.Get(json, "host")
	basePath := gjson.Get(json, "basePath")

	fmt.Println("API Title:", title.String())
	fmt.Println("API Version:", version.String())
	fmt.Println("Host:", host.String())
	fmt.Println("Base Path:", basePath.String())

	// paths 하위의 URI, method 및 operationId 추출
	paths := gjson.Get(json, "paths").Map()

	tempMap := make(map[string]interface{})

	for path, methods := range paths {
		//fmt.Println("URI:", path)
		for method, details := range methods.Map() {
			operationId := details.Get("operationId")
			if strings.ToLower(method) == "parameters" {
				continue
			}

			//fmt.Printf("  Method: %s, OperationId: %s\n", method, operationId.String())
			tmpActionName := convertActionlName(operationId.String())
			if tmpActionName == "" {
				tmpActionName = toCamelCase(path, "/")
			}

			_, ok := tempMap[tmpActionName]
			if ok {
				tmpActionName = putRandNum(tmpActionName)
			}

			fmt.Printf("    %s:\n", tmpActionName)
			fmt.Printf("      method: %s\n", method)
			fmt.Printf("      resourcePath: %s\n", path)
			fmt.Printf("      description: %q\n", details.Get("description").String())
		}
	}
}

func putRandNum(origin string) string {
	rand.Seed(time.Now().UnixNano())
	randomNumber := rand.Intn(10000)
	randomNumberStr := fmt.Sprintf("%04d", randomNumber)
	return origin + randomNumberStr
}
func convertActionlName(tmpActionName string) string {
	//일부 특수 기호들 제거
	tmpActionName = strings.ReplaceAll(tmpActionName, ":", "-")
	tmpActionName = strings.ReplaceAll(tmpActionName, "`", "")
	tmpActionName = strings.ReplaceAll(tmpActionName, "'", "")
	//tmpActionName = strings.ReplaceAll(tmpActionName, "\n", " ")

	//카멜타입으로 변경
	tmpActionName = toCamelCase(tmpActionName, " ")

	return tmpActionName
}

func toCamelCase(str, delim string) string {
	words := strings.Split(str, delim)
	var result strings.Builder
	caser := cases.Title(language.English)
	for _, word := range words {
		result.WriteString(caser.String(word)) // 각 단어의 첫 글자를 대문자로 만듦
	}
	return result.String()
}

func init() {
	apiCmd.AddCommand(parseCmd)
	parseCmd.PersistentFlags().StringVarP(&swaggerFile, "file", "f", "../conf/swagger.json", "Swagger JSON file full path")
}
