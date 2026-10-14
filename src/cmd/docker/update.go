package docker

import (
	"fmt"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// updateCmd represents the update command
var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update the latest Docker images of the subsystems that make up the M-CMP System.",
	Long: `Update the latest Docker images of the subsystems that make up the M-CMP System.
The images are pulled and the containers are restarted in detached mode, so the command
returns when the update is done. Use './mcc infra info' or 'docker logs' to check the services.`,
	SilenceUsage: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("\n[Update the Docker images of the subsystems that make up the M-CMP System.]")
		if DockerFilePath == "" {
			return fmt.Errorf("--file (-f) argument is required but not provided")
		}

		//============================
		// Pull
		//============================
		fmt.Println("[Install the latest Docker images of the M-CMP subsystems.]")
		fmt.Println()

		cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s pull %s", ComposeProjectName, DockerFilePath, ServiceName)
		if err := common.SysCallWithError(cmdStr); err != nil {
			return fmt.Errorf("failed to pull the Docker images: %w", err)
		}

		//============================
		// RUN
		//============================
		fmt.Println("\n\n[Restart based on the installed latest Docker images.]")
		fmt.Println()

		// Always detached: update must return once the containers are restarted.
		// An attached 'up' never exits, and stopping it with Ctrl+C stops the containers.
		cmdStr = fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s up -d %s", ComposeProjectName, DockerFilePath, ServiceName)
		if err := common.SysCallWithError(cmdStr); err != nil {
			return fmt.Errorf("failed to restart the containers: %w", err)
		}
		return nil
	},
}

func init() {
	infraCmd.AddCommand(updateCmd)
}
