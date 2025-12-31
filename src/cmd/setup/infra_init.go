package setup

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/mc-admin-cli/mcc/src/common"
	"github.com/spf13/cobra"
)

// infraInitCmd represents the infra-init command
var infraInitCmd = &cobra.Command{
	Use:   "infra-init",
	Short: "Initialize MC-Infra-Manager by registering multi-cloud connection information and common resources",
	Long: `Initialize MC-Infra-Manager with the current running version.

This command registers multi-cloud connection information and common resources (CSP credentials, specs, images, etc.)
by executing the initialization script (init.sh) from the corresponding MC-Infra-Manager version.

This command will:
1. Check if MC-Infra-Manager is running
2. Check the current running MC-Infra-Manager version
3. Download the corresponding MC-Infra-Manager version from GitHub
4. Execute the initialization script (init.sh) to register:
   - Multi-cloud connection information
   - Common resources (specs, images, etc.)

Before running this command, you need to create encrypted credential files.
The command will verify that encrypted credential files are prepared before proceeding.

For detailed information, please refer to:
https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#3-initialize-cb-tumblebug-to-configure-multi-cloud-info`,
	Run: func(cmd *cobra.Command, args []string) {
		runInfraInit()
	},
}

func init() {
	setupCmd.AddCommand(infraInitCmd)
}

// runInfraInit executes the infra manager initialization process
func runInfraInit() {
	fmt.Println("\n[MC-Infra-Manager Initialization]")

	// Store current working directory
	originalDir, err := os.Getwd()
	if err != nil {
		fmt.Printf("Error getting current directory: %v\n", err)
		return
	}

	// Check if MC-Infra-Manager is running
	if !isInfraManagerRunning() {
		fmt.Println("❌ MC-Infra-Manager is not running.")
		fmt.Println("Please start the M-CMP system first:")
		fmt.Println("   ./mcc infra run")
		fmt.Println()
		fmt.Println("Please try again after the system is running.")
		return
	}

	fmt.Println("✅ MC-Infra-Manager is running.")
	fmt.Println("Checking MC-Infra-Manager execution version...")

	// Get current running MC-Infra-Manager version
	version, err := getCurrentInfraManagerVersion()
	if err != nil {
		fmt.Printf("Error getting current MC-Infra-Manager version: %v\n", err)
		return
	}

	gitTag := "v" + version
	fmt.Printf("✅ Version confirmed: %s\n", version)

	// Check if MC-Infra-Manager is healthy
	if !isInfraManagerHealthy() {
		fmt.Println("❌ MC-Infra-Manager is not healthy yet.")
		fmt.Println("Please wait for MC-Infra-Manager to become healthy and try again:")
		fmt.Println("   ./mcc infra info")
		fmt.Println()
		fmt.Println("Please try again after MC-Infra-Manager becomes healthy.")
		return
	}

	fmt.Println("✅ MC-Infra-Manager is healthy.")

	// Show warning message about credential files
	showCredentialWarning(gitTag)

	// Ask for user confirmation
	if !askForConfirmation("Do you want to proceed with MC-Infra-Manager initialization using prepared encrypted credentials?") {
		fmt.Println("Operation cancelled.")
		return
	}

	// Download and initialize MC-Infra-Manager
	err = downloadAndInitTumblebug(version, originalDir)
	if err != nil {
		fmt.Printf("Error during MC-Infra-Manager initialization: %v\n", err)
		// Return to original directory even on error
		os.Chdir(originalDir)
		return
	}

	// Return to original directory
	err = os.Chdir(originalDir)
	if err != nil {
		fmt.Printf("Warning: Could not return to original directory: %v\n", err)
	} else {
		fmt.Printf("\nReturned to original location: %s\n", originalDir)
	}

	fmt.Println("\nMC-Infra-Manager initialization completed.")
}

// isInfraManagerRunning checks if MC-Infra-Manager container is running
func isInfraManagerRunning() bool {
	cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s ps --format json", common.ComposeProjectName, common.DefaultDockerComposeConfig)
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	output, err := cmd.Output()
	if err != nil {
		return false
	}

	// Check if mc-infra-manager service is running
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "mc-infra-manager") && strings.Contains(line, "running") {
			return true
		}
	}

	return false
}

// isInfraManagerHealthy checks if MC-Infra-Manager container is healthy
func isInfraManagerHealthy() bool {
	cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s ps --format json", common.ComposeProjectName, common.DefaultDockerComposeConfig)
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	output, err := cmd.Output()
	if err != nil {
		return false
	}

	// Check if mc-infra-manager service is healthy
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "mc-infra-manager") && strings.Contains(line, "healthy") {
			return true
		}
	}

	return false
}

// getExistingTumblebugVersion gets the version of existing cb-tumblebug directory
func getExistingTumblebugVersion(cbTumblebugDir string) (string, error) {
	// Check if it's a git repository
	gitDir := filepath.Join(cbTumblebugDir, ".git")
	if _, err := os.Stat(gitDir); os.IsNotExist(err) {
		return "", fmt.Errorf("not a git repository")
	}

	// Get current HEAD commit hash
	cmdStr := fmt.Sprintf("cd %s && git rev-parse HEAD", cbTumblebugDir)
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	currentCommit := strings.TrimSpace(string(output))
	if currentCommit == "" {
		return "", fmt.Errorf("unable to get current commit")
	}

	// Get the tag that the current HEAD is pointing to (exact match)
	cmdStr = fmt.Sprintf("cd %s && git describe --exact-match HEAD 2>/dev/null", cbTumblebugDir)
	cmd = exec.Command("/bin/sh", "-c", cmdStr)

	output, err = cmd.Output()
	if err != nil {
		// If no exact tag match, return the commit hash to indicate it's not on a tag
		return currentCommit, nil
	}

	tag := strings.TrimSpace(string(output))
	return tag, nil
}

// showCredentialWarning displays warning about credential files and prerequisites
func showCredentialWarning(gitTag string) {
	cloneCmd := fmt.Sprintf("git clone -b %s https://github.com/cloud-barista/cb-tumblebug.git", gitTag)
	fmt.Printf("\n[ Important Notice ]\n")
	fmt.Printf("MC-Infra-Manager %s version is running.\n", gitTag)
	fmt.Println("Encrypted credential files must be prepared before running MC-Infra-Manager initialization.")
	fmt.Println("If encrypted credential files are not available, please create them first by referring to the guide below.")
	fmt.Printf("   Guide: https://github.com/cloud-barista/cb-tumblebug/tree/%s?tab=readme-ov-file#3-initialize-cb-tumblebug-to-configure-multi-cloud-info\n", gitTag)
	fmt.Printf("   Download: %s\n", cloneCmd)

	fmt.Println()
	fmt.Println("Additionally, MC-Infra-Manager initialization requires the following prerequisites:")
	fmt.Println("  • uv package manager (for Python dependency management)")
	fmt.Println("  • Other system dependencies as needed by the specific version")
	fmt.Println()
	fmt.Println("If any prerequisites are missing, you will receive appropriate error messages")
	fmt.Println("with installation guidance during the initialization process.")
	fmt.Println()
}

// askForConfirmation asks user for confirmation
func askForConfirmation(message string) bool {
	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Printf("%s (y/N): ", message)
		response, err := reader.ReadString('\n')
		if err != nil {
			fmt.Printf("Error reading input: %v\n", err)
			return false
		}

		response = strings.TrimSpace(strings.ToLower(response))
		if response == "y" || response == "yes" {
			return true
		} else if response == "n" || response == "no" || response == "" {
			return false
		}
		fmt.Println("Please enter 'y' for yes or 'n' for no.")
	}
}

// getCurrentInfraManagerVersion gets the current running MC-Infra-Manager version
func getCurrentInfraManagerVersion() (string, error) {
	// First try to get version from docker compose ps
	version, err := getVersionFromDockerCompose()
	if err == nil && version != "" {
		return version, nil
	}

	// Fallback to docker-compose.yaml file
	version, err = getVersionFromDockerComposeFile()
	if err != nil {
		return "", fmt.Errorf("could not determine MC-Infra-Manager version: %v", err)
	}

	return version, nil
}

// getVersionFromDockerCompose gets version from running docker compose ps
func getVersionFromDockerCompose() (string, error) {
	cmdStr := fmt.Sprintf("COMPOSE_PROJECT_NAME=%s docker compose -f %s ps --format json", common.ComposeProjectName, common.DefaultDockerComposeConfig)
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	// Parse JSON output to find mc-infra-manager service
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "mc-infra-manager") && strings.Contains(line, "cloudbaristaorg/cb-tumblebug:") {
			// Extract version from image name
			re := regexp.MustCompile(`cloudbaristaorg/cb-tumblebug:([0-9]+\.[0-9]+\.[0-9]+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 1 {
				return matches[1], nil
			}
		}
	}

	return "", fmt.Errorf("version not found in docker compose ps output")
}

// getVersionFromDockerComposeFile gets version from docker-compose.yaml file
func getVersionFromDockerComposeFile() (string, error) {
	file, err := os.Open(common.DefaultDockerComposeConfig)
	if err != nil {
		return "", err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "image: cloudbaristaorg/cb-tumblebug:") {
			// Extract version from image line
			re := regexp.MustCompile(`cloudbaristaorg/cb-tumblebug:([0-9]+\.[0-9]+\.[0-9]+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 1 {
				return matches[1], nil
			}
		}
	}

	return "", fmt.Errorf("version not found in docker-compose.yaml")
}

// downloadAndInitTumblebug downloads and initializes Tumblebug
func downloadAndInitTumblebug(version, originalDir string) error {
	// Convert version to GitHub tag format (add 'v' prefix)
	gitTag := "v" + version

	// Create target directory
	targetDir := filepath.Join(os.Getenv("HOME"), "go", "src", "github.com", "cloud-barista")
	cbTumblebugDir := filepath.Join(targetDir, "cb-tumblebug")

	fmt.Printf("Downloading MC-Infra-Manager %s version from GitHub...\n", gitTag)
	fmt.Printf("Target directory: %s\n", cbTumblebugDir)

	// Check if directory already exists
	if _, err := os.Stat(cbTumblebugDir); err == nil {
		return handleExistingDirectory(cbTumblebugDir, gitTag, targetDir, originalDir)
	}

	// Create directory structure
	err := os.MkdirAll(targetDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create target directory: %v", err)
	}

	// Change to target directory
	err = os.Chdir(targetDir)
	if err != nil {
		return fmt.Errorf("failed to change to target directory: %v", err)
	}

	// Clone the repository with specific tag
	cloneCmd := fmt.Sprintf("git clone -b %s https://github.com/cloud-barista/cb-tumblebug.git", gitTag)
	fmt.Printf("Executing command: %s\n", cloneCmd)

	err = common.SysCallWithError(cloneCmd)
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v", err)
	}

	// Initialize MC-Infra-Manager
	fmt.Printf("\nExecuting MC-Infra-Manager initialization in %s folder...\n", cbTumblebugDir)
	return initializeTumblebug(cbTumblebugDir, originalDir)
}

// handleExistingDirectory handles the case when cb-tumblebug directory already exists
func handleExistingDirectory(cbTumblebugDir, gitTag, targetDir, originalDir string) error {
	// Check the version of existing directory
	existingVersion, err := getExistingTumblebugVersion(cbTumblebugDir)
	if err != nil {
		// If we can't determine the version, treat it as different version
		fmt.Printf("Existing MC-Infra-Manager directory found in %s folder, but unable to determine version.\n", cbTumblebugDir)
		fmt.Printf("Current running version: %s\n", gitTag)
		return showMenuAndHandleChoice(cbTumblebugDir, gitTag, targetDir, originalDir, "unknown", true)
	}

	// Check if the existing version is exactly the same as the running version
	if existingVersion == gitTag {
		// Same version and on the correct tag
		fmt.Printf("Same version of MC-Infra-Manager (%s) already exists and is correctly checked out in %s folder.\n", gitTag, cbTumblebugDir)
		return showMenuAndHandleChoice(cbTumblebugDir, gitTag, targetDir, originalDir, existingVersion, false)
	} else {
		// Different version or not on the correct tag
		fmt.Printf("Different version of MC-Infra-Manager found in %s folder.\n", cbTumblebugDir)
		fmt.Printf("Current running version: %s\n", gitTag)
		fmt.Printf("Existing directory version: %s\n", existingVersion)

		// Check if the tag exists in the repository but is not checked out
		if isTagExistsInRepo(cbTumblebugDir, gitTag) {
			fmt.Printf("The running version (%s) exists in the repository but is not currently checked out.\n", gitTag)
			fmt.Printf("Please use 'cd %s && git checkout %s' to switch to the correct version.\n", cbTumblebugDir, gitTag)
			fmt.Printf("Alternatively, you can select one of the options below to switch to the current tag version.")
		}

		return showMenuAndHandleChoice(cbTumblebugDir, gitTag, targetDir, originalDir, existingVersion, true)
	}
}

// isTagExistsInRepo checks if a specific tag exists in the repository
func isTagExistsInRepo(cbTumblebugDir, gitTag string) bool {
	cmdStr := fmt.Sprintf("cd %s && git tag -l %s", cbTumblebugDir, gitTag)
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	output, err := cmd.Output()
	if err != nil {
		return false
	}

	return strings.TrimSpace(string(output)) == gitTag
}

// showMenuAndHandleChoice shows menu and handles user choice
func showMenuAndHandleChoice(cbTumblebugDir, gitTag, targetDir, originalDir, existingVersion string, isDifferentVersion bool) error {
	reader := bufio.NewReader(os.Stdin)

	for {
		if isDifferentVersion {
			fmt.Println("\nPlease select an option:")
			fmt.Println("1. Delete and download fresh")
			fmt.Println("2. Switch to current version and continue initialization")
			fmt.Println("3. Switch to current version and exit")
			fmt.Println("0. Exit")
			fmt.Print("Enter your choice (0-3): ")
		} else {
			fmt.Println("\nPlease select an option:")
			fmt.Println("1. Delete and download fresh")
			fmt.Println("2. Use existing files")
			fmt.Println("0. Exit")
			fmt.Print("Enter your choice (0-2): ")
		}

		response, err := reader.ReadString('\n')
		if err != nil {
			return fmt.Errorf("error reading input: %v", err)
		}

		choice := strings.TrimSpace(response)
		switch choice {
		case "1":
			return removeAndDownloadFresh(cbTumblebugDir, gitTag, targetDir, originalDir)
		case "2":
			if isDifferentVersion {
				// Switch to the correct version and execute
				err := switchToVersion(cbTumblebugDir, gitTag)
				if err != nil {
					fmt.Printf("Error switching to version %s: %v\n", gitTag, err)
					return err
				}
				fmt.Printf("\nExecuting MC-Infra-Manager initialization in %s folder...\n", cbTumblebugDir)
				return initializeTumblebug(cbTumblebugDir, originalDir)
			} else {
				// Use existing files
				fmt.Printf("\nExecuting MC-Infra-Manager initialization in %s folder...\n", cbTumblebugDir)
				return initializeTumblebug(cbTumblebugDir, originalDir)
			}
		case "3":
			if isDifferentVersion {
				// Switch to the correct version and exit
				err := switchToVersion(cbTumblebugDir, gitTag)
				if err != nil {
					fmt.Printf("Error switching to version %s: %v\n", gitTag, err)
					return err
				}
				fmt.Printf("Successfully switched to version %s. You can now run the initialization manually.\n", gitTag)
				return nil
			} else {
				fmt.Println("Invalid choice. Please enter 0, 1, or 2.")
			}
		case "0":
			fmt.Println("Operation cancelled.")
			return fmt.Errorf("operation cancelled by user")
		default:
			if isDifferentVersion {
				fmt.Println("Invalid choice. Please enter 0, 1, 2, or 3.")
			} else {
				fmt.Println("Invalid choice. Please enter 0, 1, or 2.")
			}
		}
	}
}

// switchToVersion switches the repository to the specified version
func switchToVersion(cbTumblebugDir, gitTag string) error {
	fmt.Printf("Switching to version %s...\n", gitTag)

	cmdStr := fmt.Sprintf("cd %s && git checkout %s", cbTumblebugDir, gitTag)
	cmd := exec.Command("/bin/sh", "-c", cmdStr)

	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("failed to checkout version %s: %v", gitTag, err)
	}

	fmt.Printf("Successfully switched to version %s\n", gitTag)
	fmt.Printf("Output: %s\n", string(output))
	return nil
}

// removeAndDownloadFresh removes existing directory and downloads fresh copy
func removeAndDownloadFresh(cbTumblebugDir, gitTag, targetDir, originalDir string) error {
	// Remove existing directory
	err := os.RemoveAll(cbTumblebugDir)
	if err != nil {
		return fmt.Errorf("failed to remove existing directory: %v", err)
	}

	// Change to target directory
	err = os.Chdir(targetDir)
	if err != nil {
		return fmt.Errorf("failed to change to target directory: %v", err)
	}

	// Clone fresh copy
	cloneCmd := fmt.Sprintf("git clone -b %s https://github.com/cloud-barista/cb-tumblebug.git", gitTag)
	fmt.Printf("Executing command: %s\n", cloneCmd)

	err = common.SysCallWithError(cloneCmd)
	if err != nil {
		return fmt.Errorf("failed to clone repository: %v", err)
	}

	fmt.Printf("\nExecuting MC-Infra-Manager initialization in %s folder...\n", cbTumblebugDir)
	return initializeTumblebug(cbTumblebugDir, originalDir)
}

// initializeTumblebug initializes MC-Infra-Manager by running setup.env and init.sh
func initializeTumblebug(cbTumblebugDir, originalDir string) error {
	fmt.Printf("Starting MC-Infra-Manager initialization: %s\n", cbTumblebugDir)

	// Create a script that will run in isolation
	script := fmt.Sprintf(`#!/bin/bash
set -e

# Change to cb-tumblebug directory
cd "%s"

echo "Current location: $(pwd)"

# Source setup.env if it exists
# Note: Currently commented out as it causes errors during initialization
# if [ -f "conf/setup.env" ]; then
#     echo "Executing setup.env file..."
#     source conf/setup.env
#     echo "setup.env execution completed"
# else
#     echo "Warning: conf/setup.env file not found."
# fi

# Run init.sh if it exists
if [ -f "init/init.sh" ]; then
    echo "Executing init.sh file..."
    chmod +x init/init.sh
    # Run init.sh with proper stdin/stdout/stderr handling
    ./init/init.sh
    echo "init.sh execution completed"
else
    echo "Error: init/init.sh file not found."
    exit 1
fi

echo "MC-Infra-Manager initialization completed."
`, cbTumblebugDir)

	// Write script to temporary file
	tmpScript := filepath.Join(os.TempDir(), "tumblebug_init.sh")
	err := os.WriteFile(tmpScript, []byte(script), 0755)
	if err != nil {
		return fmt.Errorf("failed to create temporary script: %v", err)
	}
	defer os.Remove(tmpScript)

	// Execute the script in a new shell with proper stdin/stdout/stderr handling
	fmt.Println("Executing MC-Infra-Manager initialization in separate shell...")
	fmt.Println("Note: You will be prompted for user input during the initialization process.")

	cmd := exec.Command("/bin/bash", tmpScript)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin // This ensures stdin is properly connected

	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("failed to execute initialization script: %v", err)
	}

	return nil
}

