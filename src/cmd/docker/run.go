package docker

import (
	"fmt"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// runCmd represents the run command
var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Setup and Run M-CMP System",
	Long:  `Setup and Run M-CMP System`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n[Setup and Run M-CMP]")
		fmt.Println()

		if DockerFilePath == "" {
			fmt.Println("--file (-f) argument is required but not provided.")
		} else {
			var cmdStr string
			cmdStr = fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s up", ComposeProjectName, DockerFilePath)
			//fmt.Println(cmdStr)
			common.SysCall(cmdStr)
		}

	},
}

func init() {
	dockerCmd.AddCommand(runCmd)

	pf := runCmd.PersistentFlags()
	pf.StringVarP(&DockerFilePath, "file", "f", DefaultDockerComposeConfig, "User-defined configuration file")
	// pf.StringVarP(&root.K8sprovider, "k8sprovider", "", common.NotDefined, "Kind of Managed K8s services")

	//	cobra.MarkFlagRequired(pf, "file")

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// runCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// runCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
