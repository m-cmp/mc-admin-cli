#!/bin/bash
set -euo pipefail

# Script to substitute environment variables in the template file with values from the .env file

# Resolve script execution directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# .env file path
ENV_FILE="$PROJECT_ROOT/.env"

# Template file path
TEMPLATE_FILE="./nginx.template.conf"

# Output file path
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

# Create output directory
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"
mkdir -p "$OUTPUT_DIR" || { echo "Error: Cannot create directory: $OUTPUT_DIR (may be a permission issue)"; exit 1; }

echo "Generating nginx configuration file..."
echo "Template: $TEMPLATE_FILE"
echo "Output:   $OUTPUT_FILE"

# Load .env file safely
echo "Loading environment variables..."

# Read required variables directly from .env file
MC_IAM_MANAGER_PORT=$(grep -m1 "^MC_IAM_MANAGER_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_IAM_MANAGER_DOMAIN=$(grep -m1 "^MC_IAM_MANAGER_DOMAIN=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_IAM_MANAGER_PUBLIC_DOMAIN=$(grep -m1 "^MC_IAM_MANAGER_PUBLIC_DOMAIN=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_IAM_MANAGER_KEYCLOAK_DOMAIN=$(grep -m1 "^MC_IAM_MANAGER_KEYCLOAK_DOMAIN=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_IAM_MANAGER_KEYCLOAK_PORT=$(grep -m1 "^MC_IAM_MANAGER_KEYCLOAK_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_OBSERVABILITY_GRAFANA_PROXY_PORT=$(grep -m1 "^MC_OBSERVABILITY_GRAFANA_PROXY_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_OBSERVABILITY_FRONT_PORT=$(grep -m1 "^MC_OBSERVABILITY_FRONT_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_COST_OPTIMIZER_FE_PROXY_PORT=$(grep -m1 "^MC_COST_OPTIMIZER_FE_PROXY_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)

echo "Loaded environment variables:"
echo "  MC_IAM_MANAGER_DOMAIN: $MC_IAM_MANAGER_DOMAIN"
echo "  MC_IAM_MANAGER_PORT: $MC_IAM_MANAGER_PORT"
echo "  MC_IAM_MANAGER_PUBLIC_DOMAIN: $MC_IAM_MANAGER_PUBLIC_DOMAIN"
echo "  MC_IAM_MANAGER_KEYCLOAK_DOMAIN: $MC_IAM_MANAGER_KEYCLOAK_DOMAIN"
echo "  MC_IAM_MANAGER_KEYCLOAK_PORT: $MC_IAM_MANAGER_KEYCLOAK_PORT"
echo "  MC_OBSERVABILITY_GRAFANA_PROXY_PORT: $MC_OBSERVABILITY_GRAFANA_PROXY_PORT"
echo "  MC_OBSERVABILITY_FRONT_PORT: $MC_OBSERVABILITY_FRONT_PORT"
echo "  MC_COST_OPTIMIZER_FE_PROXY_PORT: $MC_COST_OPTIMIZER_FE_PROXY_PORT"

# Copy template file and substitute environment variables
cp "$TEMPLATE_FILE" "$OUTPUT_FILE" || { echo "Error: Failed to copy template file: $TEMPLATE_FILE → $OUTPUT_FILE"; exit 1; }

if [ -n "$MC_IAM_MANAGER_PORT" ]; then
    sed -i "s/\${MC_IAM_MANAGER_PORT}/$MC_IAM_MANAGER_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_IAM_MANAGER_PORT substitution done: $MC_IAM_MANAGER_PORT"
else
    echo "Warning: MC_IAM_MANAGER_PORT environment variable is not set."
fi

if [ -n "$MC_IAM_MANAGER_PUBLIC_DOMAIN" ]; then
    sed -i "s/\${MC_IAM_MANAGER_PUBLIC_DOMAIN}/$MC_IAM_MANAGER_PUBLIC_DOMAIN/g" "$OUTPUT_FILE"
    echo "✓ MC_IAM_MANAGER_PUBLIC_DOMAIN substitution done: $MC_IAM_MANAGER_PUBLIC_DOMAIN"
else
    echo "Warning: MC_IAM_MANAGER_PUBLIC_DOMAIN environment variable is not set."
fi

if [ -n "$MC_IAM_MANAGER_KEYCLOAK_DOMAIN" ]; then
    sed -i "s/\${MC_IAM_MANAGER_KEYCLOAK_DOMAIN}/$MC_IAM_MANAGER_KEYCLOAK_DOMAIN/g" "$OUTPUT_FILE"
    echo "✓ MC_IAM_MANAGER_KEYCLOAK_DOMAIN substitution done: $MC_IAM_MANAGER_KEYCLOAK_DOMAIN"
else
    echo "Warning: MC_IAM_MANAGER_KEYCLOAK_DOMAIN environment variable is not set."
fi

if [ -n "$MC_IAM_MANAGER_KEYCLOAK_PORT" ]; then
    sed -i "s/\${MC_IAM_MANAGER_KEYCLOAK_PORT}/$MC_IAM_MANAGER_KEYCLOAK_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_IAM_MANAGER_KEYCLOAK_PORT substitution done: $MC_IAM_MANAGER_KEYCLOAK_PORT"
else
    echo "Warning: MC_IAM_MANAGER_KEYCLOAK_PORT environment variable is not set."
fi

if [ -n "$MC_OBSERVABILITY_GRAFANA_PROXY_PORT" ]; then
    sed -i "s/\${MC_OBSERVABILITY_GRAFANA_PROXY_PORT}/$MC_OBSERVABILITY_GRAFANA_PROXY_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_OBSERVABILITY_GRAFANA_PROXY_PORT substitution done: $MC_OBSERVABILITY_GRAFANA_PROXY_PORT"
else
    echo "Warning: MC_OBSERVABILITY_GRAFANA_PROXY_PORT environment variable is not set."
fi

if [ -n "$MC_OBSERVABILITY_FRONT_PORT" ]; then
    sed -i "s/\${MC_OBSERVABILITY_FRONT_PORT}/$MC_OBSERVABILITY_FRONT_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_OBSERVABILITY_FRONT_PORT substitution done: $MC_OBSERVABILITY_FRONT_PORT"
else
    echo "Warning: MC_OBSERVABILITY_FRONT_PORT environment variable is not set."
fi

if [ -n "$MC_COST_OPTIMIZER_FE_PROXY_PORT" ]; then
    sed -i "s/\${MC_COST_OPTIMIZER_FE_PROXY_PORT}/$MC_COST_OPTIMIZER_FE_PROXY_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_COST_OPTIMIZER_FE_PROXY_PORT substitution done: $MC_COST_OPTIMIZER_FE_PROXY_PORT"
else
    echo "Warning: MC_COST_OPTIMIZER_FE_PROXY_PORT environment variable is not set."
fi

MC_COST_OPTIMIZER_BE_PORT=$(grep -m1 "^MC_COST_OPTIMIZER_BE_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_COST_OPTIMIZER_ALARM_PORT=$(grep -m1 "^MC_COST_OPTIMIZER_ALARM_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -n "$MC_COST_OPTIMIZER_BE_PORT" ]; then
    sed -i "s/\${MC_COST_OPTIMIZER_BE_PORT}/$MC_COST_OPTIMIZER_BE_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_COST_OPTIMIZER_BE_PORT substitution done: $MC_COST_OPTIMIZER_BE_PORT"
else
    echo "Warning: MC_COST_OPTIMIZER_BE_PORT environment variable is not set."
fi

if [ -n "$MC_COST_OPTIMIZER_ALARM_PORT" ]; then
    sed -i "s/\${MC_COST_OPTIMIZER_ALARM_PORT}/$MC_COST_OPTIMIZER_ALARM_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_COST_OPTIMIZER_ALARM_PORT substitution done: $MC_COST_OPTIMIZER_ALARM_PORT"
else
    echo "Warning: MC_COST_OPTIMIZER_ALARM_PORT environment variable is not set."
fi

MC_WORKFLOW_MANAGER_PROXY_PORT=$(grep -m1 "^MC_WORKFLOW_MANAGER_PROXY_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_DATA_MANAGER_PROXY_PORT=$(grep -m1 "^MC_DATA_MANAGER_PROXY_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
MC_APPLICATION_MANAGER_PROXY_PORT=$(grep -m1 "^MC_APPLICATION_MANAGER_PROXY_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -n "$MC_WORKFLOW_MANAGER_PROXY_PORT" ]; then
    sed -i "s/\${MC_WORKFLOW_MANAGER_PROXY_PORT}/$MC_WORKFLOW_MANAGER_PROXY_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_WORKFLOW_MANAGER_PROXY_PORT substitution done: $MC_WORKFLOW_MANAGER_PROXY_PORT"
else
    echo "Warning: MC_WORKFLOW_MANAGER_PROXY_PORT environment variable is not set."
fi

if [ -n "$MC_DATA_MANAGER_PROXY_PORT" ]; then
    sed -i "s/\${MC_DATA_MANAGER_PROXY_PORT}/$MC_DATA_MANAGER_PROXY_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_DATA_MANAGER_PROXY_PORT substitution done: $MC_DATA_MANAGER_PROXY_PORT"
else
    echo "Warning: MC_DATA_MANAGER_PROXY_PORT environment variable is not set."
fi

if [ -n "$MC_APPLICATION_MANAGER_PROXY_PORT" ]; then
    sed -i "s/\${MC_APPLICATION_MANAGER_PROXY_PORT}/$MC_APPLICATION_MANAGER_PROXY_PORT/g" "$OUTPUT_FILE"
    echo "✓ MC_APPLICATION_MANAGER_PROXY_PORT substitution done: $MC_APPLICATION_MANAGER_PROXY_PORT"
else
    echo "Warning: MC_APPLICATION_MANAGER_PROXY_PORT environment variable is not set."
fi

# Substitute container names (correct legacy names in template)
sed -i "s/mciam-manager/mc-iam-manager/g" "$OUTPUT_FILE"
sed -i "s/mciam-keycloak/mc-iam-manager-kc/g" "$OUTPUT_FILE"
echo "✓ Container name substitution done"

echo "nginx configuration file generated successfully: $OUTPUT_FILE"

# Display generated file contents (optional)
echo ""
echo "=== Generated nginx.conf contents ==="
cat "$OUTPUT_FILE"
