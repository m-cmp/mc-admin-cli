package docker

import (
	"fmt"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// infoCmd represents the info command
var infoCmd = &cobra.Command{
	Use:   "info",
	Short: "Get information of M-CMP System",
	Long:  `Get information of M-CMP System. Information about containers and container images`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n[Get info for M-CMP runtimes]")
		fmt.Println()

		if common.DockerFilePath == "" {
			fmt.Println("file is required")
		} else {
			var cmdStr string
			common.SysCallDockerComposePs()
			fmt.Println("")
			fmt.Println("[v]Status of M-CMP runtime images")
			cmdStr = fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s images", common.ComposeProjectName, common.DockerFilePath)
			common.SysCall(cmdStr)
		}
	},
}

func init() {
	dockerCmd.AddCommand(infoCmd)

	pf := infoCmd.PersistentFlags()
	pf.StringVarP(&common.DockerFilePath, "file", "f", common.DefaultDockerComposeConfig, "User-defined configuration file")
	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// infoCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// infoCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
