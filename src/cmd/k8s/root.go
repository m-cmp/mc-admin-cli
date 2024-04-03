/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package k8s

import (
	"fmt"

	"github.com/spf13/cobra"
)

var K8sprovider string
var K8sFilePath string

// restCmd represents the rest command
var k8sCmd = &cobra.Command{
	Use: "k8s",
	//Short: "Installing and managing cloud-migrator's infrastructure",
	//Long:  `Build the environment of the infrastructure required for cloud-migrator and monitor the running status of the infrastructure.`,
	Short: "A tool to operate Cloud-Migrator system",
	Long: `The mayfly is a tool to operate Cloud-Migrator system.
For example, you can setup and run, stop, and ... Cloud-Migrator runtimes.

- ./mayfly pull [-f ../docker-compose-mode-files/docker-compose.yaml]
- ./mayfly run [-f ../docker-compose-mode-files/docker-compose.yaml]
- ./mayfly info
- ./mayfly stop [-f ../docker-compose-mode-files/docker-compose.yaml]
- ./mayfly remove [-f ../docker-compose-mode-files/docker-compose.yaml] -v -i

	     `,
	Run: func(cmd *cobra.Command, args []string) {
		//fmt.Println(cmd.UsageString())
		fmt.Println(cmd.Help())
	},
}

func init() {
	k8sCmd.AddCommand(k8sCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// restCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// restCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
