package docker

import (
	"fmt"

	"github.com/mc-admin-cli/mcc/src/common"
)

// DockerFilePath is a variable that holds path to the docker-compose.yaml.
var DockerFilePath string

const (
	// DefaultDockerComposeConfig is a variable that holds path to docker-compose.yaml
	DefaultDockerComposeConfig = "../conf/docker/docker-compose.yaml"

	// ComposeProjectName is a variable that holds the default COMPOSE_PROJECT_NAME that MC-Admin-Cli will use.
	ComposeProjectName string = "mcc"
)

// SysCallDockerComposePs executes `docker-compose ps` command via system call.
func SysCallDockerComposePs() {
	fmt.Println("\n[v]Status of M-CMP runtimes")
	cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s ps", ComposeProjectName, DockerFilePath)
	common.SysCall(cmdStr)
}
