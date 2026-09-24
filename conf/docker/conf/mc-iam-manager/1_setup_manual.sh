#!/bin/bash

source ../../.env

init_platform_admin() {
    echo "Initializing platform admin..."
    
    # Use environment variables
    json_data=$(jq -n \
        --arg email "$MC_IAM_MANAGER_PLATFORMADMIN_EMAIL" \
        --arg password "$MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD" \
        --arg username "$MC_IAM_MANAGER_PLATFORMADMIN_ID" \
        '{email: $email, password: $password, username: $username}')
    
    response=$(curl -s -X POST \
        --header 'Content-Type: application/json' \
        --data "$json_data" \
        "$MC_IAM_MANAGER_HOST/api/initial-admin")
    echo "Platform admin initialization response: $response"
}

login() {
    read -p "Enter the platformadmin ID: " MC_IAM_MANAGER_PLATFORMADMIN_ID
    read -s -p "Enter the platformadmin password: " MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD
    echo
    response=$(curl --location --silent --header 'Content-Type: application/json' --data '{
        "id":"'"$MC_IAM_MANAGER_PLATFORMADMIN_ID"'",
        "password":"'"$MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD"'"
    }' "$MC_IAM_MANAGER_HOST/api/auth/login")
    
    echo "Login response: $response"
    
    # Debug: check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo "ERROR: jq is not installed. Please install jq first."
        return 1
    fi
    
    # Debug: check if response is valid JSON
    if ! echo "$response" | jq . > /dev/null 2>&1; then
        echo "ERROR: Invalid JSON response"
        echo "Raw response: $response"
        return 1
    fi
    
    # Debug: check if access_token field exists
    if ! echo "$response" | jq -e '.access_token' > /dev/null 2>&1; then
        echo "ERROR: access_token field not found in response"
        echo "Available fields:"
        echo "$response" | jq 'keys'
        return 1
    fi
    
    MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN="$(echo "$response" | jq -r '.access_token')"
    
    # Debug: verify token was extracted correctly
    if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ] || [ "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" = "null" ]; then
        echo "ERROR: Failed to extract access token"
        echo "Extracted token: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
        return 1
    fi
    
    echo "Access token extracted successfully: ${MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN:0:20}..."
    echo "Login successful"
}

init_predefined_roles() {
    echo "Initializing platform roles..."
    IFS=',' read -ra ROLES <<< "$MC_IAM_MANAGER_PREDEFINED_ROLE"
    for role in "${ROLES[@]}"; do
        echo "Creating role: $role"
        json_data=$(jq -n --arg name "$role" --arg description "$role Role" \
            '{name: $name, description: $description, role_types: ["workspace", "platform"]}')
        response=$(curl -s -X POST \
            --header 'Content-Type: application/json' \
            --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            --data "$json_data" \
            "$MC_IAM_MANAGER_HOST/api/roles")
        echo "Response for role $role: $response"
    done
    echo "Platform roles initialized"
}

# IAM now chains role-menu permission seeding onto POST /api/setup/initial-menus
# server-side, so option 4) below no longer calls init_menu_permissions separately.
# IAM resolves the seed file itself from its own MC_WEB_CONSOLE_MENUYAML (default: the
# bundled copy mounted into the container). Seeds once: if menus already exist it
# answers skipped=true — use option 4b to force a re-seed.
init_menu() {
    echo "Initializing menu data..."
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/setup/initial-menus")
    echo "Menu initialization response: $response"
    if [ "$(echo "$response" | jq -r '.skipped // false' 2>/dev/null)" = "true" ]; then
        echo "Menus already seeded — skipped (option 4b forces a re-seed)"
    else
        echo "Menu data initialized"
    fi
}

# Force re-seed (option 4b): overwrites menus from the seed yaml even if menus exist.
# IAM backs up the current role-menu mappings to asset/menu/backups/ first and
# returns backupPath; DB-edited menus/mappings are overwritten by the yaml.
force_reseed_menu() {
    echo "This will OVERWRITE menus (and re-apply permission.yaml) from the seed yaml."
    echo "Menus/role-menu mappings edited in the DB will be lost (role mappings are backed up first)."
    read -p "Type 'yes' to continue: " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled."
        return 0
    fi
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/setup/initial-menus?force=true")
    echo "Force re-seed response: $response"
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: Force re-seed failed"
        return 1
    fi
    echo "Role permission backup: $(echo "$response" | jq -r '.backupPath // "(none)"')"
    echo "Orphan menus (in DB, not in yaml): $(echo "$response" | jq -r '(.orphanMenusDetected // []) | join(", ")')"
    echo "Missing permission menu ids: $(echo "$response" | jq -r '(.missingPermissionMenuIDs // []) | join(", ")')"
}

# Manual re-seed only (option 4a below) — option 4) no longer calls this
# (init_menu chains it server-side). Seed role-menu mappings via YAML API
# (no filePath — IAM uses MC_WEB_CONSOLE_MENU_PERMISSIONS or mounted
# asset/menu/permission.yaml).
init_menu_permissions() {
    echo "Initializing role-menu permissions from YAML..."

    url="$MC_IAM_MANAGER_HOST/api/setup/initial-role-menu-permission-yaml"
    echo "Calling YAML permission seed without filePath (server resolvePermissionSeedPath)"
    http_and_body=$(curl -s -w "\n%{http_code}" -X GET \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$url")

    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to call initial-role-menu-permission-yaml"
        return 1
    fi

    http_code=$(printf '%s\n' "$http_and_body" | tail -n1)
    response=$(printf '%s\n' "$http_and_body" | sed '$d')

    echo "Menu permission (YAML) initialization response (HTTP $http_code): $response"

    if [ "$http_code" != "200" ]; then
        echo "ERROR: Menu permission (YAML) initialization failed (HTTP $http_code)"
        echo "Ensure IAM image includes YAML seed API and permission.yaml is mounted."
        return 1
    fi

    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: Menu permission (YAML) initialization failed"
        return 1
    fi

    echo "Role-menu permissions initialized from YAML"
    return 0
}

init_api_resources() {
    echo "Initializing API resources..."
    wget -q -O ./api.yaml "$MC_ADMIN_CLI_APIYAML"
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/setup/sync-mcmp-apis")
    echo "API resources initialization response: $response"
    echo "API resources initialized"
}

init_cloud_resources() {
    echo "Initializing cloud resources..."
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: multipart/form-data' \
        --form "file=@./cloud-resource.yaml" \
        "$MC_IAM_MANAGER_HOST/api/resource/file/framework/all")
    echo "Cloud resources initialization response: $response"
    echo "Cloud resources initialized"
}

map_api_cloud_resources() {
    echo "Mapping API-Cloud resources..."
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/resource/mapping/api-cloud")
    echo "API-Cloud resources mapping response: $response"
    echo "API-Cloud resources mapping completed"
}


map_workspace_csp_roles() {
    echo "Mapping workspace roles to CSP IAM roles..."
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/workspace-roles/csp-mapping")
    echo "Workspace-CSP role mapping response: $response"
    echo "Workspace-CSP role mapping completed"
}


sync_projects() {
    echo "=== Starting Project Sync Process ==="
    echo "Target URL: $MC_IAM_MANAGER_HOST/api/setup/sync-projects"
    echo "Access Token: ${MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN:0:20}..."
    
    # Check mc-infra-manager availability
    echo "Checking mc-infra-manager availability..."
    infra_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://mc-infra-manager:1323/tumblebug/readyz")
    infra_http_code=$(echo $infra_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    infra_body=$(echo $infra_response | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "mc-infra-manager health check - HTTP Status: $infra_http_code"
    echo "mc-infra-manager health check - Response: $infra_body"
    
    if [ "$infra_http_code" != "200" ]; then
        echo "ERROR: mc-infra-manager is not healthy (HTTP $infra_http_code)"
        echo "This may cause project sync to fail"
    fi
    
    # Make project sync request
    echo "Making project sync request..."
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/setup/sync-projects")
    
    # Split HTTP status code and response body
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "Project sync HTTP Status: $http_code"
    echo "Project sync Response Body: $response_body"
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to make request to project sync API"
        echo "curl exit code: $?"
        return 1
    fi
    
    # Check HTTP status code
    if [ "$http_code" != "200" ]; then
        echo "ERROR: Project sync failed with HTTP status $http_code"
        return 1
    fi
    
    # Validate JSON response
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        echo "ERROR: Invalid JSON response from project sync API"
        echo "Raw response: $response_body"
        return 1
    fi
    
    # Check success
    if echo "$response_body" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: Project sync failed with error in response"
        echo "Error details:"
        echo "$response_body" | jq '.error'
        return 1
    fi
    
    # Print details on success
    echo "✓ Project sync completed successfully"
    echo "Response details:"
    echo "$response_body" | jq .
    return 0
}

map_workspace_projects() {
    read -p "Enter workspace ID: " workspace_id
    json_data=$(jq -n --arg workspace_id "$workspace_id" --arg all_projects "true" \
        '{workspace_id: $workspace_id, all_projects: $all_projects}')
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$json_data" \
        "$MC_IAM_MANAGER_HOST/api/workspaces/projects/mapping")
    echo "Workspace-Project mapping response: $response"
    echo "Workspace-Project mapping completed"
}

while true; do
    echo "Select an option:"
    echo "0. Exit"
    echo "1. Init Platform And PlatformAdmin"
    echo "2. PlatformAdmin Login"
    echo "3. Init Role Data"
    echo "4. Init Menu Data (first install; skips if menus exist; role-menu YAML permissions chained server-side)"
    echo "4a. Init Menu Role Permissions (YAML) (additive re-seed only)"
    echo "4b. Force re-seed Menu Data (overwrites DB-edited menus; role mappings backed up first)"
    echo "5. Init API Resource Data"
    echo "6. Init Cloud Resource Data"
    echo "7. Map API-Cloud Resources"
    echo "8. Init Workspace Roles"
    echo "9. Map Workspace-CSP Roles"
    echo "10. Sync Projects"
    echo "11. Map Workspace-All Projects"
    
    read -p "Enter your choice (0-8): " choice
    
    case $choice in
        0)
            echo "Exiting..."
            exit 0
            ;;
        1)
            init_platform_admin
            ;;
        2)
            login
            ;;
        3)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                init_predefined_roles
            fi
            ;;
        4)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                init_menu
            fi
            ;;
        4a)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                init_menu_permissions
            fi
            ;;
        4b)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                force_reseed_menu
            fi
            ;;
        5)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                init_api_resources
            fi
            ;;
        7)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                init_cloud_resources
            fi
            ;;
        8)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                map_api_cloud_resources
            fi
            ;;
        9)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 2)"
                echo "Current token value: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
            else
                map_workspace_csp_roles
            fi
            ;;
        10)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 1)"
            else
                sync_projects
            fi
            ;;
        11)
            if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ]; then
                echo "Please login first (option 1)"
            else
                map_workspace_projects
            fi
            ;;
        *)
            echo "Invalid option. Please try again."
            ;;
    esac
    
    echo
done 