BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
source $BASE_DIR/exec_terraform.sh
# Destroy Terraform resources for all CSPs asynchronously
destroy