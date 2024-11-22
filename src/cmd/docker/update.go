package docker

import (
	"fmt"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// pullCmd represents the pull command
var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update the latest Docker images of the subsystems that make up the M-CMP System.",
	Long:  `Update the latest Docker images of the subsystems that make up the M-CMP System.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n[Update the Docker images of the subsystems that make up the M-CMP System.]")
		//============================
		// Pull
		//============================
		fmt.Println("[Install the latest Docker images of the M-CMP subsystems.]")
		fmt.Println()

		cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s pull %s", ComposeProjectName, DockerFilePath, ServiceName)
		//fmt.Println(cmdStr)
		common.SysCall(cmdStr)

		//============================
		// RUN
		//============================
		fmt.Println("\n\n[Restart based on the installed latest Docker images.]")
		fmt.Println()

		detachModeOption := ""
		if detachFlag {
			detachModeOption = "-d"
		}
		cmdStr = fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s up %s %s", ComposeProjectName, DockerFilePath, detachModeOption, ServiceName)

		//fmt.Println(cmdStr)
		common.SysCall(cmdStr)

	},
}

func init() {
	infraCmd.AddCommand(updateCmd)
}
