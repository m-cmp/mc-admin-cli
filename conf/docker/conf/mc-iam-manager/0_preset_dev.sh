#!/bin/bash

# Script to substitute environment variables in the template file with values from the .env file

# Resolve script execution directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "PROJECT_ROOT: $PROJECT_ROOT"

# .env file path
ENV_FILE="${PROJECT_ROOT}/.env"
IAM_ENV_FILE="${SCRIPT_DIR}/.env"


# Certificate output path (same structure as Let's Encrypt)
# nginx volume mount: ./container-volume/mc-iam-manager/certs:/etc/nginx/certs
CERT_PARENT_DIR="${PROJECT_ROOT}/container-volume/mc-iam-manager"

# --- 3. Create required directories (same structure as Let's Encrypt) ---
echo "Creating necessary directories..."

# Create container-volume directory first (with sudo if needed)
echo "Creating container-volume directory with proper permissions..."

# Get current user info
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)

echo "Current user: ${CURRENT_USER}:${CURRENT_GROUP}"

# Only the certs/ and nginx/ subdirs need to be writable by this script.
# postgres/ and keycloak/ are Docker-managed and may be root-owned from a
# previous run — do not touch them. Newly mkdir'd dirs are user-owned automatically,
# so chown is unnecessary. If mkdir or the writable check fails, the root-owned
# state must be cleared first via cleanAll.sh (which handles sudo interactively).
for _dir in "${CERT_PARENT_DIR}/certs" "${CERT_PARENT_DIR}/nginx"; do
    if ! mkdir -p "$_dir" 2>/dev/null; then
        echo "❌ Error: Cannot create $_dir"
        echo "   A previous Docker run likely left root-owned files in the parent directory."
        echo "   Please run the cleanup script first, then re-run installAll.sh:"
        echo "       cd ${SCRIPT_DIR}/../../bin && ./cleanAll.sh"
        exit 1
    fi
    if [ ! -w "$_dir" ]; then
        echo "❌ Error: $_dir exists but is not writable by ${CURRENT_USER}."
        echo "   Please run the cleanup script first, then re-run installAll.sh:"
        echo "       cd ${SCRIPT_DIR}/../../bin && ./cleanAll.sh"
        exit 1
    fi
done
echo "✓ Certificate and nginx directories ready"


# Template file path
TEMPLATE_FILE="./nginx.template.conf"

# Output file path (improved structure)
OUTPUT_FILE="${PROJECT_ROOT}/container-volume/mc-iam-manager/nginx/nginx.conf"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found: $ENV_FILE"
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: nginx template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Load .env file as environment variables
# Use line-by-line parsing instead of source to safely handle unquoted multi-word
# values (e.g. cron schedules like "0 30 0,6 * * ?") that docker compose .env allows.
echo "Loading environment variables..."

while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        declare "${BASH_REMATCH[1]}=${BASH_REMATCH[2]}"
    fi
done < "$ENV_FILE"

# Validate required environment variables
echo "Validating required environment variables..."

# List of required variables to validate
REQUIRED_VARS=(
    "MC_IAM_MANAGER_PUBLIC_DOMAIN"
    "MC_IAM_MANAGER_KEYCLOAK_DOMAIN"
    "MC_IAM_MANAGER_DATABASE_NAME"
    "MC_IAM_MANAGER_DATABASE_USER"
    "MC_IAM_MANAGER_DATABASE_PASSWORD"
    "MC_IAM_MANAGER_DATABASE_HOST"
    "MC_IAM_MANAGER_PORT"
)

# Validate each required environment variable
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

# Exit if any required variables are missing
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: The following required environment variables are not set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Resolution:"
    echo "1. Verify the .env file exists: $ENV_FILE"
    echo "2. Confirm all required environment variables are defined in .env"
    echo "3. Refer to .env_sample to add any missing environment variables"
    exit 1
fi

# Set default value if MC_IAM_MANAGER_KEYCLOAK_PORT is not set
if [ -z "$MC_IAM_MANAGER_KEYCLOAK_PORT" ]; then
    MC_IAM_MANAGER_KEYCLOAK_PORT=8080
    echo "MC_IAM_MANAGER_KEYCLOAK_PORT is not set; using default value 8080."
fi

echo "✅ All required environment variables loaded successfully."
echo "Loaded environment variables:"
echo "  PUBLIC_DOMAIN: $MC_IAM_MANAGER_PUBLIC_DOMAIN"
echo "  KEYCLOAK_DOMAIN: $MC_IAM_MANAGER_KEYCLOAK_DOMAIN"
echo "  MC_IAM_MANAGER_KEYCLOAK_PORT: $MC_IAM_MANAGER_KEYCLOAK_PORT"
echo "  DATABASE_NAME: $MC_IAM_MANAGER_DATABASE_NAME"
echo "  DATABASE_USER: $MC_IAM_MANAGER_DATABASE_USER"
echo "  DATABASE_HOST: $MC_IAM_MANAGER_DATABASE_HOST"
echo "  MC_IAM_MANAGER_PORT: $MC_IAM_MANAGER_PORT"

# =============================================================================
# Rewrite PUBLIC_HOST variables from http:// to https:// for remote IP/domain
# =============================================================================

_sedi() {
    if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "$@"
    else
        sed -i "$@"
    fi
}

rewrite_http_to_https() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        return 0
    fi
    echo "Rewriting http:// → https:// in ${env_file##*/conf/docker/}..."

    local vars=(
        "MC_IAM_MANAGER_PUBLIC_HOST"
        "MC_OBSERVABILITY_FRONT_PUBLIC_HOST"
        "MC_OBSERVABILITY_GRAFANA_PUBLIC_HOST"
        "MC_COST_OPTIMIZER_FE_PUBLIC_HOST"
        "MC_WORKFLOW_MANAGER_PUBLIC_HOST"
        "MC_DATA_MANAGER_PUBLIC_HOST"
        "MC_APPLICATION_MANAGER_PUBLIC_HOST"
    )

    for var in "${vars[@]}"; do
        if grep -qE "^${var}=http://" "$env_file"; then
            _sedi "s|^${var}=http://|${var}=https://|" "$env_file"
            echo "  ✓ ${var}: http:// → https://"
        fi
    done
}

rewrite_http_to_https "$ENV_FILE"
rewrite_http_to_https "$IAM_ENV_FILE"

# Define certificate directory based on PUBLIC_DOMAIN (same structure as Let's Encrypt)
CERT_DIR="${CERT_PARENT_DIR}/certs/live/${MC_IAM_MANAGER_PUBLIC_DOMAIN}"

# Create certs/live/<domain> directory (same structure as Let's Encrypt)
echo "Creating certificate directory: ${CERT_DIR}"
mkdir -p "${CERT_DIR}" || { echo "Error: Failed to create ${CERT_DIR}"; exit 1; }
echo "✓ Certificate directory created successfully"


## Local environment (certificate) settings
# Determine whether PUBLIC_DOMAIN is an IP address or a hostname
if [[ "${MC_IAM_MANAGER_PUBLIC_DOMAIN}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    IS_IP=true
    SAN_ENTRY="IP:${MC_IAM_MANAGER_PUBLIC_DOMAIN}"
    echo "✓ PUBLIC_DOMAIN is an IP address — skipping /etc/hosts modification"
else
    IS_IP=false
    SAN_ENTRY="DNS:${MC_IAM_MANAGER_PUBLIC_DOMAIN}"
fi

# --- 3. Add domain to hosts file (only if it is a hostname) ---
if [ "$IS_IP" = false ]; then
    HOSTS_FILE="/etc/hosts"
    echo "Checking ${MC_IAM_MANAGER_PUBLIC_DOMAIN} in ${HOSTS_FILE}..."

    if grep -E "^[[:space:]]*127\.0\.0\.1[[:space:]]+${MC_IAM_MANAGER_PUBLIC_DOMAIN}[[:space:]]*$" "${HOSTS_FILE}" > /dev/null; then
        echo "✓ ${MC_IAM_MANAGER_PUBLIC_DOMAIN} already exists in ${HOSTS_FILE}. Skipping."
    else
        echo "Removing any existing entries for ${MC_IAM_MANAGER_PUBLIC_DOMAIN}..."
        sed -i "/[[:space:]]*127\.0\.0\.1[[:space:]]\+${MC_IAM_MANAGER_PUBLIC_DOMAIN}[[:space:]]*$/d" "${HOSTS_FILE}"

        echo "Adding 127.0.0.1 ${MC_IAM_MANAGER_PUBLIC_DOMAIN} to ${HOSTS_FILE}..."
        if echo "127.0.0.1 ${MC_IAM_MANAGER_PUBLIC_DOMAIN}" >> "${HOSTS_FILE}" 2>/dev/null; then
            echo "✓ ${MC_IAM_MANAGER_PUBLIC_DOMAIN} added successfully to ${HOSTS_FILE}."
        else
            echo "⚠️  Failed to add to ${HOSTS_FILE} — run with sudo or manually add:"
            echo "    echo '127.0.0.1 ${MC_IAM_MANAGER_PUBLIC_DOMAIN}' | sudo tee -a ${HOSTS_FILE}"
        fi
    fi
fi


# --- 4. Generate Self-Signed Certificate (with SAN) ---
echo "Generating Self-Signed Certificate for ${MC_IAM_MANAGER_PUBLIC_DOMAIN} (SAN: ${SAN_ENTRY})... ${CERT_DIR}"

# Remove existing certificate files (to issue a fresh one)
if [ -f "${CERT_DIR}/privkey.pem" ]; then
    echo "Removing existing certificate files..."
    rm "${CERT_DIR}/privkey.pem" "${CERT_DIR}/fullchain.pem" 2>/dev/null
fi

openssl genrsa -out "${CERT_DIR}/privkey.pem" 2048
openssl req -new -key "${CERT_DIR}/privkey.pem" -out "${CERT_DIR}/csr.pem" -subj "/CN=${MC_IAM_MANAGER_PUBLIC_DOMAIN}"
openssl x509 -req -days 365 \
    -in "${CERT_DIR}/csr.pem" \
    -signkey "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -extfile <(printf "subjectAltName=${SAN_ENTRY}\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment")
rm "${CERT_DIR}/csr.pem"

if [ -f "${CERT_DIR}/fullchain.pem" ]; then
    echo "Self-Signed Certificate generated successfully at ${CERT_DIR}."
else
    echo "Failed to generate Self-Signed Certificate."
    exit 1
fi



echo "Generating nginx configuration file..."
echo "Template: $TEMPLATE_FILE"
echo "Output:   $OUTPUT_FILE"

# Create output directory only when needed (for relative or absolute paths)
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"
if [ "$OUTPUT_DIR" != "." ] && [ "$OUTPUT_DIR" != "$(pwd)" ]; then
    echo "Creating output directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
fi

# Remove output path if it is an existing directory
if [ -d "$OUTPUT_FILE" ]; then
    echo "Removing existing directory: $OUTPUT_FILE"
    rm -rf "$OUTPUT_FILE"
fi

# Substitute environment variables (processed in a single pass)
if [ -n "$MC_IAM_MANAGER_PUBLIC_DOMAIN" ] && [ -n "$MC_IAM_MANAGER_KEYCLOAK_PORT" ]; then
    sed -e "s/\${MC_IAM_MANAGER_DOMAIN}/$MC_IAM_MANAGER_DOMAIN/g" \
        -e "s/\${MC_IAM_MANAGER_PORT}/$MC_IAM_MANAGER_PORT/g" \
        -e "s/\${MC_IAM_MANAGER_PUBLIC_DOMAIN}/$MC_IAM_MANAGER_PUBLIC_DOMAIN/g" \
        -e "s/\${MC_IAM_MANAGER_KEYCLOAK_DOMAIN}/$MC_IAM_MANAGER_KEYCLOAK_DOMAIN/g" \
        -e "s/\${MC_IAM_MANAGER_KEYCLOAK_PORT}/$MC_IAM_MANAGER_KEYCLOAK_PORT/g" \
        -e "s/\${MC_OBSERVABILITY_GRAFANA_PROXY_PORT}/$MC_OBSERVABILITY_GRAFANA_PROXY_PORT/g" \
        -e "s/\${MC_COST_OPTIMIZER_FE_PROXY_PORT}/$MC_COST_OPTIMIZER_FE_PROXY_PORT/g" \
        -e "s/\${MC_COST_OPTIMIZER_BE_PORT}/$MC_COST_OPTIMIZER_BE_PORT/g" \
        -e "s/\${MC_COST_OPTIMIZER_ALARM_PORT}/$MC_COST_OPTIMIZER_ALARM_PORT/g" \
        -e "s/\${MC_WORKFLOW_MANAGER_PROXY_PORT}/$MC_WORKFLOW_MANAGER_PROXY_PORT/g" \
        -e "s/\${MC_DATA_MANAGER_PROXY_PORT}/$MC_DATA_MANAGER_PROXY_PORT/g" \
        -e "s/\${MC_APPLICATION_MANAGER_PROXY_PORT}/$MC_APPLICATION_MANAGER_PROXY_PORT/g" \
        -e "s/mciam-manager/mc-iam-manager/g" \
        -e "s/mciam-keycloak/mc-iam-manager-kc/g" \
        "$TEMPLATE_FILE" > "$OUTPUT_FILE"
    echo "✓ PUBLIC_DOMAIN substitution done: $MC_IAM_MANAGER_PUBLIC_DOMAIN"
    echo "✓ PORT substitution done: $MC_IAM_MANAGER_KEYCLOAK_PORT"
    echo "✓ Container name substitution done"
else
    echo "Warning: MC_IAM_MANAGER_PUBLIC_DOMAIN or MC_IAM_MANAGER_KEYCLOAK_PORT environment variable is not set."
    cp "$TEMPLATE_FILE" "$OUTPUT_FILE"
fi

echo "nginx configuration file generated successfully: $OUTPUT_FILE"

# Display generated file contents (optional)
echo ""
echo "=== Generated nginx.conf contents ==="
cat "$OUTPUT_FILE"