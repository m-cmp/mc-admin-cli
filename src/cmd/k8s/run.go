/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package k8s

import (
	"fmt"
	"strings"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Setup and Run M-CMP System",
	Long:  `Setup and Run M-CMP System`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("\n[Setup and Run M-CMP]")
		fmt.Println()

		if K8sFilePath == "" {
			fmt.Println("--file (-f) argument is required but not provided.")
		} else {
			var cmdStr string
			if K8sprovider == common.NotDefined {
				fmt.Print(`--k8sprovider argument is required but not provided.
					e.g.
					--k8sprovider=gke
					--k8sprovider=eks
					--k8sprovider=aks
					--k8sprovider=mcks
					--k8sprovider=minikube
					--k8sprovider=kubeadm
					`)

				return
			}

			// For Kubernetes 1.19 and above
			cmdStr = fmt.Sprintf("kubectl create ns %s --dry-run=client -o yaml | kubectl apply -f -", K8sNamespace)
			// For Kubernetes 1.18 and below
			//cmdStr = fmt.Sprintf("kubectl create ns %s --dry-run -o yaml | kubectl apply -f -", common.CMK8sNamespace)
			common.SysCall(cmdStr)

			// cmdStr = fmt.Sprintf("helm install --namespace %s %s -f %s ../helm-chart --debug", common.CMK8sNamespace, common.CMHelmReleaseName, common.K8sFilePath)
			// if strings.ToLower(k8sprovider) == "gke" {
			// 	cmdStr += " --set metricServer.enabled=false"
			// }
			// //fmt.Println(cmdStr)
			// common.SysCall(cmdStr)

			if strings.ToLower(K8sprovider) == "gke" || strings.ToLower(K8sprovider) == "eks" || strings.ToLower(K8sprovider) == "aks" {
				cmdStr = fmt.Sprintf("helm install --namespace %s %s -f %s ../helm-chart --debug", K8sNamespace, HelmReleaseName, K8sFilePath)
				cmdStr += " --set cb-restapigw.service.type=LoadBalancer"
				cmdStr += " --set cb-webtool.service.type=LoadBalancer"

				if strings.ToLower(K8sprovider) == "gke" || strings.ToLower(K8sprovider) == "aks" {
					cmdStr += " --set metricServer.enabled=false"
				}

				common.SysCall(cmdStr)
			} else {
				cmdStr = fmt.Sprintf("helm install --namespace %s %s -f %s ../helm-chart --debug", K8sNamespace, HelmReleaseName, K8sFilePath)
				common.SysCall(cmdStr)
			}

		}

	},
}

func init() {
	k8sCmd.AddCommand(runCmd)

	pf := runCmd.PersistentFlags()
	pf.StringVarP(&K8sFilePath, "file", "f", DefaultKubernetesConfig, "User-defined configuration file")
	//pf.StringVarP(&K8sprovider, "k8sprovider", "", common.NotDefined, "Kind of Managed K8s services") //@todo

	// runCmd.MarkPersistentFlagRequired("k8sprovider")

	//	cobra.MarkFlagRequired(pf, "file")

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// runCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// runCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
