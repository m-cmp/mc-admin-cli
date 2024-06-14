package apicall

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"sort"
	"strings"

	"github.com/spf13/cobra"
)

var swaggerFile string

type Info struct {
	Title   string `json:"title"`
	Version string `json:"version"`
}

type Path struct {
	Description string   `json:"description"`
	Consumes    []string `json:"consumes"`
	Produces    []string `json:"produces"`
	Tags        []string `json:"tags"`
	Summary     string   `json:"summary"`
	// 여기에 더 필요한 필드를 추가할 수 있습니다.
}

type Paths map[string]map[string]Path

type Swagger struct {
	Swagger  string `json:"swagger"`
	Info     Info   `json:"info"`
	BasePath string `json:"basePath"`
	Paths    Paths  `json:"paths"`
	// 여기에 더 필요한 필드를 추가할 수 있습니다.
}

// pullCmd represents the pull command
var toolCmd = &cobra.Command{
	Use:   "tool",
	Short: "Swagger JSON parsing tool to assist in writing api.yaml files",
	Long:  `Swagger JSON parsing tool to assist in writing api.yaml files`,
	Run: func(cmd *cobra.Command, args []string) {
		//fmt.Println("util")
		parse()
	},
}

func parse() {
	/*
		// JSON 문자열
		data := `{
			"swagger": "2.0",
			"info": {
				"title": "CB-Tumblebug REST API",
				"contact": {
					"name": "API Support",
					"url": "http://cloud-barista.github.io",
					"email": "contact-to-cloud-barista@googlegroups.com"
				},
				"version": "latest"
			},
			"basePath": "/tumblebug",
			"paths": {
				"/cloudInfo": {
					"get": {
						"description": "Get cloud information",
						"consumes": [
							"application/json"
						],
						"produces": [
							"application/json"
						],
						"tags": [
							"[Admin] Multi-Cloud environment configuration"
						],
						"summary": "Get cloud information"
					}
				},
				"/config": {
					"get": {
						"description": "List all configs",
						"consumes": [
							"application/json"
						],
						"produces": [
							"application/json"
						],
						"tags": [
							"[Admin] System environment"
						],
						"summary": "List all configs"
					},
					"post": {
						"description": "Create or Update config (SPIDER_REST_URL, DRAGONFLY_REST_URL, ...)",
						"consumes": [
							"application/json"
						],
						"produces": [
							"application/json"
						],
						"tags": [
							"[Admin] System environment"
						],
						"summary": "Create or Update config",
						"parameters": [
							{
								"description": "Key and Value for configuration",
								"name": "config",
								"in": "body",
								"required": true,
								"schema": {
									"$ref": "#/definitions/common.ConfigReq"
								}
							}
						]
					},
					"delete": {
						"description": "Init all configs",
						"consumes": [
							"application/json"
						],
						"produces": [
							"application/json"
						],
						"tags": [
							"[Admin] System environment"
						],
						"summary": "Init all configs"
					}
				}
			}
		}`
	*/

	// JSON 파일 읽기
	data, err := ioutil.ReadFile(swaggerFile)
	if err != nil {
		fmt.Println("Error reading JSON file:", err)
		return
	}

	// JSON 데이터를 구조체로 언마샬링
	var swagger Swagger
	err = json.Unmarshal(data, &swagger)
	//err := json.Unmarshal([]byte(data), &swagger)
	if err != nil {
		fmt.Println("Error unmarshalling JSON:", err)
		return
	}

	// 기본 정보
	fmt.Println("Swagger Version:", swagger.Swagger)
	fmt.Println("API Title:", swagger.Info.Title)
	fmt.Println("API Version:", swagger.Info.Version)
	fmt.Println("Base Path:", swagger.BasePath)

	/*
		// 각 경로에 대한 정보 출력
		for path, methods := range swagger.Paths {
			//fmt.Println("resourcePath: ", path)
			for method, info := range methods {
				//fmt.Printf("  Method: %s, Description: %s\n", method, info.Description)
				//fmt.Printf("  Method: %s, Summary: %s\n", method, info.Summary)
				fmt.Printf("    summary: %s\n", info.Summary)
				fmt.Printf("      method: %s\n", method)
				fmt.Printf("      resourcePath: %s\n", path)
			}
		}
	*/

	// Path 순으로 출력을 위해 정렬
	var paths []string
	for path := range swagger.Paths {
		paths = append(paths, path)
	}
	sort.Strings(paths)

	tmpActionName := ""
	// 각 경로에 대한 정보 출력
	for _, path := range paths {
		methods := swagger.Paths[path]
		//fmt.Println("Path:", path)
		for method, info := range methods {
			tmpActionName = info.Summary
			tmpActionName = convertActionlName(tmpActionName)

			//fmt.Printf("    summary: %s\n", tmpActionName)
			fmt.Printf("    %s:\n", tmpActionName)
			fmt.Printf("      method: %s\n", method)
			fmt.Printf("      resourcePath: %s\n", path)
			fmt.Printf("      description: %q\n", info.Description)
		}
	}
}

func convertActionlName(tmpActionName string) string {
	//일부 특수 기호들 제거
	tmpActionName = strings.ReplaceAll(tmpActionName, ":", "-")
	tmpActionName = strings.ReplaceAll(tmpActionName, "`", "")
	tmpActionName = strings.ReplaceAll(tmpActionName, "'", "")
	//tmpActionName = strings.ReplaceAll(tmpActionName, "\n", " ")

	//카멜타입으로 변경
	tmpActionName = toCamelCase(tmpActionName)

	return tmpActionName
}

func toCamelCase(str string) string {
	words := strings.Fields(str) // 문자열을 공백을 기준으로 단어로 분할
	var result strings.Builder
	for _, word := range words {
		result.WriteString(strings.Title(word)) // 각 단어의 첫 글자를 대문자로 만듦
	}
	return result.String()
}

func init() {
	apiCmd.AddCommand(toolCmd)
	toolCmd.PersistentFlags().StringVarP(&swaggerFile, "file", "f", "../conf/swagger.json", "Swagger JSON file full path")
}
