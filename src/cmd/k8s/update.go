package k8s

import (
	"fmt"
	"strings"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// updateCmd represents the update command
var updateCmd = &cobra.Command{
	Use:     "update",
	Aliases: []string{"apply"},
	Short:   "Update M-CMP System",
	Long:    `Update M-CMP System`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n[Update M-CMP]")
		fmt.Println()

		if K8sFilePath == "" {
			fmt.Println("file is required")
		} else {

			var cmdStr string
			// switch common.MccMode {
			// case common.ModeDockerCompose:
			// 	fmt.Println("mcc Docker Compose mode does not support 'update/apply' subcommand.")

			// case common.ModeKubernetes:
			cmdStr = fmt.Sprintf("helm upgrade --namespace %s --install %s -f %s ../helm-chart", K8sNamespace, HelmReleaseName, K8sFilePath)
			if strings.ToLower(K8sprovider) == "gke" || strings.ToLower(K8sprovider) == "aks" {
				cmdStr += " --set metricServer.enabled=false"
			}
			//fmt.Println(cmdStr)
			common.SysCall(cmdStr)
			// default:

			// }

		}

	},
}

func init() {
	k8sCmd.AddCommand(updateCmd)

	pf := updateCmd.PersistentFlags()
	pf.StringVarP(&K8sFilePath, "file", "f", DefaultKubernetesConfig, "User-defined configuration file")
	pf.StringVarP(&K8sprovider, "k8sprovider", "", common.NotDefined, "Kind of Managed K8s services")

	//	cobra.MarkFlagRequired(pf, "file")

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// updateCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// updateCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
