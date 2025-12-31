# MC-Infra-Manager Initialization Sub Command Guide

## Overview
Added a new `infra-init` command under the `setup` subcommand to automatically initialize MC-Infra-Manager with the currently running version. This feature ensures version compatibility and provides a streamlined initialization process for registering multi-cloud connection information and common resources.

## Prerequisites and Reference Information
This feature is an experimental add-on designed to make the `Initialize MC-Infra-Manager to configure Multi-Cloud info` process more stable and convenient after all infrastructure has been built using the `./mcc infra run` command.

The essential file required to properly execute the `infra-init` command is an encrypted credential file, which is created through the following CB-Tumblebug process:
```
👉 Create your cloud credentials:
   ./init/genCredential.sh
   → Then edit ~/.cloud-barista/credentials.yaml with your CSP info.

👉 Encrypt the credentials file:
   ./init/encCredential.sh
```

If the above method does not create the file properly or if you need detailed information about the MC-Infra-Manager initialization process, please refer to the [CB-Tumblebug Multi-Cloud Configuration Guide](https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#3-initialize-cb-tumblebug-to-configure-multi-cloud-info) documentation.

Additionally, since CB-Tumblebug (used by MC-Infra-Manager) uses uv internally, it is recommended to install uv in advance.
```
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
```
For more detailed information, please refer to the CB-Tumblebug documentation.

The `infra-init` command must be executed with the user account added to the Docker group to run mcc without sudo.
```
$ sudo usermod -aG docker $USER
$ newgrp docker
```

## Key Features

1. **Execution Status Check**: Verify if MC-Infra-Manager is running
2. **Version Check**: Check the currently running MC-Infra-Manager version (from docker compose ps or docker-compose.yaml)
3. **Health Status Check**: Verify if MC-Infra-Manager is in healthy state
4. **Guidance Message**: Provide related information and procedure guidance after version confirmation
5. **User Confirmation**: Confirm preparation of encrypted credential files
6. **MC-Infra-Manager Folder Check**: Check the exact Git tag (version) state of existing cb-tumblebug folder
7. **Smart Version Management**: Differentiated processing based on Git checkout state
8. **Intuitive Menu System**: Provide optimized selection options for each situation
9. **Download**: Download the version matching the currently running MC-Infra-Manager from GitHub (CB-Tumblebug repository)
10. **Execution Guidance**: Display information about the folder to be executed
11. **Initialization**: Execute init.sh to register multi-cloud connection information and common resources (with user input support)
12. **Return**: Return to the original working directory

## Enhanced Capabilities

### 1. Health Status Validation
- Checks if MC-Infra-Manager container is in healthy state before proceeding
- Prevents initialization attempts on unstable containers
- Provides clear guidance when container is not ready
- Suggests using `./mcc infra info` to check system status

### 2. Advanced Git Version Management
- **Precise Tag State Verification**: Verify that the current HEAD points exactly to a tag using `git describe --exact-match HEAD`
- **Git Checkout Functionality**: Switch to the desired version using `git checkout` command
- **Tag Existence Check**: Verify that the desired tag exists in the repository

### 3. Smart Directory Handling
- **Same Version (Exact Tag Checkout)**:
  ```
  1. Delete and download fresh
  2. Use existing files
  0. Exit
  ```

- **Different Version or Tag Not Checked Out**:
  ```
  1. Delete and download fresh
  2. Switch to current version and continue initialization
  3. Switch to current version and exit
  0. Exit
  ```

### 4. User Experience Improvements
- **Clear Guidance Messages**: Provide specific explanations for each situation
- **Git Command Guide**: Present manual resolution methods
- **English Interface**: All messages unified in English
- **Intuitive Menu**: Improve user experience with number-based selection
- **MC-Infra-Manager Terminology**: All user-facing messages use MC-Infra-Manager instead of CB-Tumblebug

## Technical Implementation

### New Functions Added
- `isInfraManagerRunning()`: Container running status validation
- `isInfraManagerHealthy()`: Container health status validation
- `getCurrentInfraManagerVersion()`: Get current running version from docker compose or docker-compose.yaml
- `getVersionFromDockerCompose()`: Extract version from running docker compose ps output
- `getVersionFromDockerComposeFile()`: Extract version from docker-compose.yaml file
- `getExistingTumblebugVersion()`: Precise Git tag state checking
- `isTagExistsInRepo()`: Tag existence verification
- `showMenuAndHandleChoice()`: Context-aware menu system
- `switchToVersion()`: Git checkout functionality
- `downloadAndInitTumblebug()`: Download and initialize MC-Infra-Manager
- `initializeTumblebug()`: Execute init.sh script

### Error Handling
- Graceful handling of Git repository issues
- Clear error messages with resolution guidance
- Automatic directory restoration on errors
- Proper error return to original directory even on failure

### Initialization Process
- Creates a temporary bash script for isolated execution
- Changes to cb-tumblebug directory
- Executes `init/init.sh` directly (setup.env is currently commented out)
- Proper stdin/stdout/stderr handling for user input during initialization

## Usage

```bash
# Basic usage
./mcc setup infra-init

# The command will:
# 1. Check if MC-Infra-Manager is running and healthy
# 2. Detect the current running version
# 3. Validate existing directory Git state
# 4. Provide appropriate options based on the situation
# 5. Execute initialization with proper version matching
```

## Benefits

1. **Version Safety**: Ensures exact version compatibility between running container and initialization script
2. **User Convenience**: Automated version detection and management
3. **Flexibility**: Multiple options for different scenarios
4. **Reliability**: Health checks and proper error handling
5. **Maintainability**: Clean, modular code structure
6. **Multi-Cloud Setup**: Registers multi-cloud connection information and common resources (CSP credentials, specs, images, etc.)

## Example Scenarios

### Scenario 1: Fresh Installation
```bash
[MC-Infra-Manager Initialization]

✅ MC-Infra-Manager is running.
Checking MC-Infra-Manager execution version...
✅ Version confirmed: 0.11.21
✅ MC-Infra-Manager is healthy.

[ Important Notice ]
MC-Infra-Manager v0.11.21 version is running.
Encrypted credential files must be prepared before running MC-Infra-Manager initialization.

Downloading MC-Infra-Manager v0.11.21 version from GitHub...
Target directory: /home/ubuntu/go/src/github.com/cloud-barista/cb-tumblebug
```

### Scenario 2: Existing Directory with Wrong Version
```bash
Different version of MC-Infra-Manager found in /home/ubuntu/go/src/github.com/cloud-barista/cb-tumblebug folder.
Current running version: v0.11.21
Existing directory version: v0.11.18
The running version (v0.11.21) exists in the repository but is not currently checked out.

Please select an option:
1. Delete and download fresh
2. Switch to current version and continue initialization
3. Switch to current version and exit
0. Exit
Enter your choice (0-3):
```

### Scenario 3: MC-Infra-Manager Not Running
```bash
[MC-Infra-Manager Initialization]

❌ MC-Infra-Manager is not running.
Please start the M-CMP system first:
   ./mcc infra run

Please try again after the system is running.
```

### Scenario 4: MC-Infra-Manager Not Healthy
```bash
[MC-Infra-Manager Initialization]

✅ MC-Infra-Manager is running.
Checking MC-Infra-Manager execution version...
✅ Version confirmed: 0.11.21
❌ MC-Infra-Manager is not healthy yet.
Please wait for MC-Infra-Manager to become healthy and try again:
   ./mcc infra info

Please try again after MC-Infra-Manager becomes healthy.
```

## Troubleshooting

### API Password Configuration
If MC-Infra-Manager's API Password(`TB_API_PASSWORD`) is not set, the string value `"default"` is used as the password, so no error occurs. However, if MC-Infra-Manager is running with a custom API Password, the API Password between the downloaded version and the running version may not match, which can cause errors.

Therefore, when executing the `./mcc setup infra-init` command, if an `Unauthorized` error occurs as shown below, please check the `TB_API_PASSWORD` configuration value:

```
"Error during resource loading: 401 Client Error: Unauthorized for url: http://localhost:1323/tumblebug/loadAssets"
```

MC-Infra-Manager API Password uses Hash verification method. For detailed information, please refer to the [TB API Password Configuration Guide](https://github.com/cloud-barista/cb-tumblebug/tree/main/cmd/bcrypt) documentation.

In mc-admin-cli's `./conf/docker/docker-compose.yaml` file, the `mc-infra-manager` service is defined, and the `TB_API_PASSWORD` environment variable can be set in the `environment` section.
For the current CB-Tumblebug (used by MC-Infra-Manager), if the `TB_API_PASSWORD` environment variable is not set, the string `default` is used as the `TB_API_PASSWORD` value.

Therefore, the quickest solution is to comment out the `TB_API_PASSWORD` environment variable in the `mc-infra-manager` service defined in the `./conf/docker/docker-compose.yaml` file if it is set, and then restart the service.

### Version Detection Issues
If the version cannot be detected from docker compose ps, the command will fall back to reading the docker-compose.yaml file. Ensure that the docker-compose.yaml file contains the correct image version for mc-infra-manager.

### Permission Issues
Make sure the user has proper permissions to:
- Execute docker commands (user should be in docker group)
- Create directories in `$HOME/go/src/github.com/cloud-barista/`
- Execute git commands
- Run bash scripts

### Prerequisites Missing
If initialization fails due to missing prerequisites (such as `uv`), the error message will provide guidance. Install the required prerequisites and try again.
