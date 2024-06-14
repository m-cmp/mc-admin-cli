/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package rest

import (
	"fmt"

	"github.com/spf13/cobra"
)

// restDeleteCmd represents the restDelete command
var restDeleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "REST API calls with DELETE methods",
	Long: `REST API calls with DELETE methods. For example:

	rest delete https://reqres.in/api/users/2`,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 1 { // 아규먼트가 없으면 도움말 출력
			fmt.Println(cmd.Help())
			return
		}

		url := args[0]
		resp, err := req.Delete(url)
		if err != nil {
			fmt.Println("Error:", err)
			return
		}

		// 응답 출력
		ProcessResultInfo(resp)
	},
}

func init() {
	restCmd.AddCommand(restDeleteCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// restDeleteCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// restDeleteCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
