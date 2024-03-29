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

		if common.FileStr == "" {
			fmt.Println("file is required")
		} else {
			common.FileStr = common.GenConfigPath(common.FileStr, common.MccMode)
			var cmdStr string
			switch common.MccMode {
			case common.ModeDockerCompose:
				common.SysCallDockerComposePs()

				fmt.Println("")
				fmt.Println("[v]Status of M-CMP runtime images")
				cmdStr = fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s images", common.ComposeProjectName, common.FileStr)
				//fmt.Println(cmdStr)
				common.SysCall(cmdStr)
			case common.ModeKubernetes:
				fmt.Println("[v]Status of M-CMP Helm release")
				cmdStr = fmt.Sprintf("helm status --namespace %s %s", common.K8sNamespace, common.HelmReleaseName)
				common.SysCall(cmdStr)
				fmt.Println()
				fmt.Println("[v]Status of M-CMP pods")
				cmdStr = fmt.Sprintf("kubectl get pods -n %s", common.K8sNamespace)
				common.SysCall(cmdStr)
				fmt.Println()
				fmt.Println("[v]Status of M-CMP container images")
				cmdStr = `kubectl get pods -n ` + common.K8sNamespace + ` -o jsonpath="{..image}" |\
				tr -s '[[:space:]]' '\n' |\
				sort |\
				uniq`
				common.SysCall(cmdStr)
			default:

			}
		}
	},
}

func init() {
	dockerCmd.AddCommand(infoCmd)

	pf := infoCmd.PersistentFlags()
	pf.StringVarP(&common.FileStr, "file", "f", common.NotDefined, "User-defined configuration file")
	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// infoCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// infoCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
