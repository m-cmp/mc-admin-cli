#!/bin/bash

# Define constants for file paths relative to the execution location
AWS_SECRETS_FILE="./data/var/run/data-manager/template/example/AWS/BUILDER/secrets.tfvars"
NCP_SECRETS_FILE="./data/var/run/data-manager/template/example/NCP/BUILDER/secrets.tfvars"
GCP_SECRETS_FILE="./data/var/run/data-manager/template/example/GCP/BUILDER/secrets.json"
GCP_DUMMY_FILE="./data/var/run/data-manager/template/example/GCP/BUILDER/secrets.tfvars"

DEFAULT_PROFILE_FILE="./data/var/run/data-manager/profile/profile.json"

# Function to determine the profile.json file path
get_profile_file() {
  if [[ -f "./profile.json" ]]; then
    PROFILE_FILE="./profile.json"
    DESTINATION_FILE="$DEFAULT_PROFILE_FILE"
    echo "Using profile.json from the current directory: $PROFILE_FILE"
  else
    PROFILE_FILE="$DEFAULT_PROFILE_FILE"
    DESTINATION_FILE=""
    echo "Using profile.json from the default path: $PROFILE_FILE"
  fi
}

# Function to check if the profile.json file exists
check_profile_file_exists() {
  if [[ ! -f "$PROFILE_FILE" ]]; then
    echo "Error: $PROFILE_FILE file not found."
    exit 1
  fi
}

# Function to extract AWS and NCP credentials
extract_aws_ncp_credentials() {
  aws_access_key=$(jq -r '.[0].credentials.aws.accessKey' "$PROFILE_FILE")
  aws_secret_key=$(jq -r '.[0].credentials.aws.secretKey' "$PROFILE_FILE")
  ncp_access_key=$(jq -r '.[0].credentials.ncp.accessKey' "$PROFILE_FILE")
  ncp_secret_key=$(jq -r '.[0].credentials.ncp.secretKey' "$PROFILE_FILE")
}

# Function to extract GCP credentials
extract_gcp_credentials() {
  gcp_credentials=$(jq -r '.[0].credentials.gcp' "$PROFILE_FILE")
}

# Function to create AWS secrets.tfvars file
create_aws_secrets_file() {
  cat <<EOF > "$AWS_SECRETS_FILE"
access_key = "$aws_access_key"
secret_key = "$aws_secret_key"
EOF
  echo "AWS credentials saved to: $AWS_SECRETS_FILE"
}

# Function to create NCP secrets.tfvars file
create_ncp_secrets_file() {
  cat <<EOF > "$NCP_SECRETS_FILE"
access_key = "$ncp_access_key"
secret_key = "$ncp_secret_key"
EOF
  echo "NCP credentials saved to: $NCP_SECRETS_FILE"
}

# Function to create GCP secrets.json file
create_gcp_secrets_file() {
  echo "$gcp_credentials" > "$GCP_SECRETS_FILE"
  echo "GCP credentials saved to: $GCP_SECRETS_FILE"
  touch $GCP_DUMMY_FILE
}

# Function to copy profile.json to the default path if it was used from the current directory
copy_profile_file_if_needed() {
  if [[ -n "$DESTINATION_FILE" ]]; then
    cp "$PROFILE_FILE" "$DESTINATION_FILE"
    echo "profile.json has been copied to $DESTINATION_FILE"
  fi
}

# set_creds function to perform all steps
set_creds() {
  get_profile_file               # Determine profile.json path
  check_profile_file_exists      # Check if profile.json exists
  extract_aws_ncp_credentials    # Extract AWS and NCP credentials
  extract_gcp_credentials        # Extract GCP credentials
  create_aws_secrets_file        # Create AWS secrets file
  create_ncp_secrets_file        # Create NCP secrets file
  create_gcp_secrets_file        # Create GCP secrets file
  copy_profile_file_if_needed    # Copy profile.json if from current directory
  echo "All credential files have been successfully saved."
}
