#!/bin/bash

# Set the base directory relative to the script's location
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Define directories for each CSP relative to the script's location
AWS_DIR="./data/var/run/data-manager/template/example/AWS/BUILDER"
GCP_DIR="./data/var/run/data-manager/template/example/GCP/BUILDER"
NCP_DIR="./data/var/run/data-manager/template/example/NCP/BUILDER"

# Function to execute Terraform init, validate, plan, and apply
run_terraform() {
  local dir=$1
  echo "Starting Terraform setup in directory: $dir"

  # Navigate to the specified directory
  cd "$dir" || exit 1

  # Run Terraform commands: init, validate, plan, and apply
  terraform init && \
  terraform validate && \
  terraform plan -var-file="secrets.tfvars" && \
  terraform apply -var-file="secrets.tfvars" -auto-approve
  
  if [[ $? -eq 0 ]]; then
    echo "Terraform setup completed successfully in directory: $dir"
  else
    echo "Terraform setup failed in directory: $dir"
  fi

  # Return to the initial directory
  cd - > /dev/null
}

# Function to execute Terraform destroy
destroy_terraform() {
  local dir=$1
  echo "Starting Terraform destroy in directory: $dir"

  # Navigate to the specified directory
  cd "$dir" || exit 1

  # Run Terraform destroy command
  terraform destroy -var-file="secrets.tfvars" -auto-approve
  
  if [[ $? -eq 0 ]]; then
    echo "Terraform destroy completed successfully in directory: $dir"
  else
    echo "Terraform destroy failed in directory: $dir"
  fi

  # Return to the initial directory
  cd - > /dev/null
}

# Function to run setup for all CSPs
run() {
  run_terraform "$AWS_DIR" &
  run_terraform "$GCP_DIR" &
  run_terraform "$NCP_DIR" &

  # Wait for all background processes to complete
  wait
  echo "All Terraform setup processes completed."
}

# Function to destroy resources for all CSPs
destroy() {
  destroy_terraform "$AWS_DIR" &
  destroy_terraform "$GCP_DIR" &
  destroy_terraform "$NCP_DIR" &

  # Wait for all background processes to complete
  wait
  echo "All Terraform destroy processes completed."
}
