package docker

import (
	"fmt"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// stopCmd represents the stop command
var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop M-CMP System",
	Long:  `Stop M-CMP System`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n[Stop M-CMP]")
		fmt.Println()

		if DockerFilePath == "" {
			fmt.Println("file is required")
		} else {
			//	common.FileStr = common.GenConfigPath(common.FileStr, common.MccMode)
			cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s stop %s", ComposeProjectName, DockerFilePath, ServiceName)
			common.SysCall(cmdStr)

			SysCallDockerComposePs()
		}

	},
}

func init() {
	infraCmd.AddCommand(stopCmd)

	pf := stopCmd.PersistentFlags()
	pf.StringVarP(&DockerFilePath, "file", "f", DefaultDockerComposeConfig, "User-defined configuration file")
	//	cobra.MarkFlagRequired(pf, "file")
	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// stopCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// stopCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
