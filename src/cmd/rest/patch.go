/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package rest

import (
	"fmt"

	"github.com/spf13/cobra"
)

// restPutCmd represents the restPut command
var restPatchCmd = &cobra.Command{
	Use:   "patch",
	Short: "REST API calls with PATCH methods",
	Long: `REST API calls with PATCH methods. For example:

	rest patch https://reqres.in/api/users/2 -d '
	{
		"name": "morpheus",
		"job": "leader"
	}'`,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 1 { // 아규먼트가 없으면 도움말 출력
			fmt.Println(cmd.Help())
			return
		}

		url := args[0]
		resp, err := req.Patch(url)
		if err != nil {
			fmt.Println("Error:", err)
			return
		}

		// 응답 출력
		ProcessResultInfo(resp)
	},
}

func init() {
	restCmd.AddCommand(restPatchCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// restPutCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// restPutCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
