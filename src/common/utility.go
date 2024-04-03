package common

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
)

// FileStr is a variable that holds path to the docker-compose.yaml.
var FileStr string

//var CommandStr string
//var TargetStr string

// MccMode is a variable that holds current mcc's mode.
var MccMode string

// DockerFilePath is a variable that holds path to the docker-compose.yaml.
var DockerFilePath string

// K8sFilePath is a variable that holds path to the helm-chart's values.yaml.
var K8sFilePath string

const (
	// ModeDockerCompose is a variable that holds string indicating Docker Compose mode.
	ModeDockerCompose = "DockerCompose"

	// ModeKubernetes is a variable that holds string indicating Kubernetes mode.
	ModeKubernetes = "Kubernetes"

	// DefaultDockerComposeConfig is a variable that holds path to docker-compose.yaml
	DefaultDockerComposeConfig = "../docker-compose-mode-files/docker-compose.yaml"

	// DefaultKubernetesConfig is a variable that holds path to helm-chart/values.yaml
	DefaultKubernetesConfig string = "../helm-chart/values.yaml"

	// NotDefined is a variable that holds the string "Not_Defined"
	NotDefined string = "Not_Defined"

	// ComposeProjectName is a variable that holds the default COMPOSE_PROJECT_NAME that CM-Mayfly will use.
	ComposeProjectName string = "mcc"

	// K8sNamespace is a variable that holds the K8s namespace that CM-Mayfly will use.
	K8sNamespace string = "mcc"

	// HelmReleaseName is a variable that holds the K8s Helm release name that CM-Mayfly will use.
	HelmReleaseName string = "mcc"
)

// SysCall executes user-passed command via system call.
func SysCall(cmdStr string) {
	//cmdStr := "docker-compose -f " + common.FileStr + " up"
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	cmdReader, _ := cmd.StdoutPipe()
	cmd.Stderr = cmd.Stdout

	err := cmd.Start()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	scanner := bufio.NewScanner(cmdReader)
	for scanner.Scan() {
		fmt.Printf("%s\n", scanner.Text())
	}

	err = cmd.Wait()
	if err != nil {
		fmt.Println(err)
		//os.Exit(1)
	}

}

// SysCallDockerComposePs executes `docker-compose ps` command via system call.
func SysCallDockerComposePs() {
	fmt.Println("\n[v]Status of M-CMP runtimes")
	//cmdStr := "COMPOSE_PROJECT_NAME=mcc docker-compose -f " + FileStr + " ps"
	cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s ps", ComposeProjectName, FileStr)
	SysCall(cmdStr)
}

// GenConfigPath receives path-to-config-file and mcc-mode, and returns path-to-config-file.
func GenConfigPath(fileStr string, mode string) string {
	returnStr := fileStr
	switch mode {
	case ModeDockerCompose:
		if fileStr == NotDefined {
			returnStr = DefaultDockerComposeConfig
		}
	case ModeKubernetes:
		if fileStr == NotDefined {
			returnStr = DefaultKubernetesConfig
		}
	default:

	}
	fmt.Println("[Config path] " + returnStr)
	fmt.Println()
	return returnStr
}
