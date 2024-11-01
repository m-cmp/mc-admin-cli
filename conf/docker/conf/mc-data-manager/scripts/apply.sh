BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
source $BASE_DIR/exec_terraform.sh
# Run Terraform setup for all CSPs asynchronously
run