package apicall

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v2"
)

type Service struct {
	BaseURL string `yaml:"baseurl"`
	Auth    struct {
		Type     string `yaml:"type"`
		Username string `yaml:"username,omitempty"`
		Password string `yaml:"password,omitempty"`
		Token    string `yaml:"token,omitempty"` // For bearer token
	} `yaml:"auth"`
}

type ServiceActions map[string]Action

type Action struct {
	Method       string `yaml:"method"`
	ResourcePath string `yaml:"resourcePath"`
	Description  string `yaml:"description"`
}

type Config struct {
	Services       map[string]Service           `yaml:"services"`
	ServiceActions map[string]map[string]Action `yaml:"serviceActions"`
}

var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update YAML file with API information",
	Run: func(cmd *cobra.Command, args []string) {
		updateConfig()
	},
}
var (
	originApiYamlFile string
	rootPath          = getRootPath()
	services          = map[string]string{
		"mc-infra-manager": "https://raw.githubusercontent.com/cloud-barista/cb-tumblebug/main/src/api/rest/docs/swagger.json",
		"mc-iam-manager":   "https://raw.githubusercontent.com/m-cmp/mc-iam-manager/docs/swagger/swagger.json",
		"mc-web-console":   "https://raw.githubusercontent.com/m-cmp/mc-web-console/main/mc_web_console_api/docs/swagger.json",
	}
)

func getRootPath() string {
	_, b, _, _ := runtime.Caller(0)
	basePath := filepath.Dir(b)
	return basePath[0 : len(basePath)-len("/src/cmd/apicall")]
}

func init() {
	updateCmd.PersistentFlags().StringVarP(&originApiYamlFile, "originApiYamlFile", "O", fmt.Sprintf("%s/conf/api.yaml", rootPath), "Path to the origin YAML configuration file")
	apiCmd.AddCommand(updateCmd)
}

func updateConfig() {
	backupFile := originApiYamlFile + ".backup"
	if err := backupFileIfExists(originApiYamlFile, backupFile); err != nil {
		log.Fatalf("Error creating backup file: %s", err)
	}

	data, err := os.ReadFile(backupFile)
	if err != nil {
		log.Fatalf("Error reading YAML file: %s", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		log.Fatalf("Error unmarshalling YAML file: %s", err)
	}

	for serviceName, url := range services {
		fmt.Printf("Fetching Swagger JSON for service: %s\n", serviceName)
		swaggerData, err := fetchSwaggerJSON(url)
		if err != nil {
			log.Printf("Error fetching Swagger JSON for service %s: %s", serviceName, err)
			continue
		}

		var swagger map[string]interface{}
		if err := json.Unmarshal(swaggerData, &swagger); err != nil {
			log.Printf("Error unmarshalling Swagger JSON for service %s: %s", serviceName, err)
			continue
		}

		if err := updateServiceActions(serviceName, swagger, &config.ServiceActions); err != nil {
			log.Printf("Error updating service actions for %s: %s", serviceName, err)
			continue
		}
	}

	updatedData, err := yaml.Marshal(&config)
	if err != nil {
		log.Fatalf("Error marshalling updated YAML: %s", err)
	}

	if err := os.WriteFile(originApiYamlFile, updatedData, 0644); err != nil {
		log.Fatalf("Error writing updated YAML file: %s", err)
	}

	fmt.Println("YAML configuration updated successfully.")
}

func backupFileIfExists(filePath, backupPath string) error {
	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		fmt.Printf("Creating backup of the existing file: %s\n", filePath)
		input, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("error reading file for backup: %s", err)
		}
		if err := os.WriteFile(backupPath, input, 0644); err != nil {
			return fmt.Errorf("error creating backup file: %s", err)
		}
	}
	return nil
}


func fetchSwaggerJSON(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return body, nil
}

func updateServiceActions(serviceName string, swagger map[string]interface{}, serviceActions *map[string]map[string]Action) error {
	paths := swagger["paths"].(map[string]interface{})
	actions := make(map[string]Action)

	for path, methods := range paths {
		for method, details := range methods.(map[string]interface{}) {
			if strings.HasPrefix(strings.ToLower(method), "parameters") {
				continue
			}

			log.Println(serviceName, method, path)
			operationId := details.(map[string]interface{})["operationId"].(string)
			actionName := convertActionName(operationId)
			actions[actionName] = Action{
				Method:       method,
				ResourcePath: path,
				Description:  details.(map[string]interface{})["description"].(string),
			}

		}
	}

	(*serviceActions)[serviceName] = actions
	return nil
}

func convertActionName(operationId string) string {
	operationId = strings.ReplaceAll(operationId, ":", "-")
	operationId = strings.ReplaceAll(operationId, "`", "")
	operationId = strings.ReplaceAll(operationId, "'", "")

	// 카멜케이스로 변환
	words := strings.Fields(operationId)
	var result strings.Builder
	for _, word := range words {
		result.WriteString(strings.Title(word))
	}
	return result.String()
}
