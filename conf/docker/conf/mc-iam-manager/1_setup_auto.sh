#!/bin/bash

# Prevent UID variable conflict — use .env.setup file
source .env

# Automated setup function
auto_setup() {
    echo "=== Starting automated setup process ==="
    
    # 1. Platform admin initialization
    echo "Step 1: Initializing platform admin..."
    init_platform_admin
    if [ $? -ne 0 ]; then
        echo "ERROR: Platform admin initialization failed"
        return 1
    fi
    echo "✓ Platform admin initialized successfully"
    
    # 2. Login
    echo "Step 2: Logging in..."
    login
    if [ $? -ne 0 ]; then
        echo "ERROR: Login failed"
        return 1
    fi
    echo "✓ Login successful"
    
    # 3. Role data initialization
    echo "Step 3: Initializing predefined roles..."
    init_predefined_roles
    if [ $? -ne 0 ]; then
        echo "ERROR: Role initialization failed"
        return 1
    fi
    echo "✓ Predefined roles initialized successfully"
    
    # 4. Menu data initialization
    echo "Step 4: Initializing menu data..."
    init_menu
    if [ $? -ne 0 ]; then
        echo "ERROR: Menu initialization failed"
        return 1
    fi
    echo "✓ Menu data initialized successfully"
    
    # 5. API resource data initialization
    echo "Step 5: Initializing API resources..."
    init_api_resources
    if [ $? -ne 0 ]; then
        echo "ERROR: API resources initialization failed"
        return 1
    fi
    echo "✓ API resources initialized successfully"

    # 5-1. Register framework service URLs (must precede sync-projects in the service registry)
    echo "Step 5-1: Registering framework service URLs..."
    register_framework_services
    if [ $? -ne 0 ]; then
        echo "ERROR: Framework service registration failed"
        return 1
    fi
    echo "✓ Framework services registered successfully"

    # 5-2. Update iframe service URLs to public-accessible addresses
    echo "Step 5-2: Updating iframe service URLs to public addresses..."
    update_public_service_urls
    if [ $? -ne 0 ]; then
        echo "WARNING: Public service URL update failed (non-fatal, iframe may not render remotely)"
    else
        echo "✓ Public service URLs updated successfully"
    fi

    # 6. Project sync
    echo "Step 6: Syncing projects..."
    sync_projects
    if [ $? -ne 0 ]; then
        echo "ERROR: Project sync failed"
        return 1
    fi
    echo "✓ Projects synced successfully"
    
    # 7. Keycloak client redirect URI configuration
    echo "Step 7: Configuring Keycloak client redirect URIs..."
    configure_keycloak_client_uris
    if [ $? -ne 0 ]; then
        echo "WARNING: Keycloak client redirect URI configuration failed (non-fatal)"
    else
        echo "✓ Keycloak client redirect URIs configured successfully"
    fi

    # 8. Workspace-project mapping
    echo "Step 8: Mapping workspace to all projects..."
    map_workspace_projects
    if [ $? -ne 0 ]; then
        echo "ERROR: Workspace-project mapping failed"
        return 1
    fi
    echo "✓ Workspace-project mapping completed successfully"

    # 9. AWS CSP configuration (skipped if MC_IAM_MANAGER_AWS_ACCOUNT_ID=notyet)
    echo "Step 9: Initializing AWS CSP configuration..."
    init_aws_csp_config
    if [ $? -ne 0 ]; then
        echo "WARNING: AWS CSP configuration failed (non-fatal)"
    else
        echo "✓ AWS CSP configuration completed"
    fi

    echo "=== Automated setup completed successfully ==="
}

init_platform_admin() {
    echo "=== Starting Platform Admin Initialization ==="
    echo "Target URL: $MC_IAM_MANAGER_HOST/api/initial-admin"
    echo "Admin Email: $MC_IAM_MANAGER_PLATFORMADMIN_EMAIL"
    echo "Admin Username: $MC_IAM_MANAGER_PLATFORMADMIN_ID"
    
    # Use environment variables
    json_data=$(jq -n \
        --arg email "$MC_IAM_MANAGER_PLATFORMADMIN_EMAIL" \
        --arg password "$MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD" \
        --arg username "$MC_IAM_MANAGER_PLATFORMADMIN_ID" \
        '{email: $email, password: $password, username: $username}')
    
    echo "Request JSON: $json_data"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header 'Content-Type: application/json' \
        --data "$json_data" \
        "$MC_IAM_MANAGER_HOST/api/initial-admin")
    
    # Split HTTP status code and response body
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "Platform admin init HTTP Status: $http_code"
    echo "Platform admin init Response Body: $response_body"
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to make request to platform admin API"
        echo "curl exit code: $?"
        return 1
    fi
    
    # Check HTTP status code
    if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
        echo "ERROR: Platform admin initialization failed with HTTP status $http_code"
        return 1
    fi
    
    # Validate JSON response
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        echo "ERROR: Invalid JSON response from platform admin API"
        echo "Raw response: $response_body"
        return 1
    fi
    
    # Check success (verify no error field in response)
    if echo "$response_body" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: Platform admin initialization failed with error in response"
        echo "Error details:"
        echo "$response_body" | jq '.error'
        return 1
    fi
    
    echo "✓ Platform admin initialized successfully"
    return 0
}

login() {
    echo "=== Starting Login Process ==="
    echo "Target URL: $MC_IAM_MANAGER_HOST/api/auth/login"
    
    # Use platform admin credentials from environment variables
    if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ID" ] || [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD" ]; then
        echo "ERROR: Platform admin credentials not found in .env file"
        echo "Please check MC_IAM_MANAGER_PLATFORMADMIN_ID and MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD in .env"
        return 1
    fi
    
    echo "Using platform admin ID: $MC_IAM_MANAGER_PLATFORMADMIN_ID"
    
    # Build login request JSON
    login_json=$(jq -n \
        --arg id "$MC_IAM_MANAGER_PLATFORMADMIN_ID" \
        --arg password "$MC_IAM_MANAGER_PLATFORMADMIN_PASSWORD" \
        '{id: $id, password: $password}')
    
    echo "Login request JSON: $login_json"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" --location --header 'Content-Type: application/json' \
        --data "$login_json" \
        "$MC_IAM_MANAGER_HOST/api/auth/login")
    
    # Split HTTP status code and response body
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "Login HTTP Status: $http_code"
    echo "Login Response Body: $response_body"
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to make login request"
        echo "curl exit code: $?"
        return 1
    fi
    
    # Check HTTP status code
    if [ "$http_code" != "200" ]; then
        echo "ERROR: Login failed with HTTP status $http_code"
        return 1
    fi
    
    # Debug: check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo "ERROR: jq is not installed. Please install jq first."
        return 1
    fi
    
    # Debug: verify response is valid JSON
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        echo "ERROR: Invalid JSON response"
        echo "Raw response: $response_body"
        return 1
    fi
    
    # Debug: check if access_token field exists in response
    if ! echo "$response_body" | jq -e '.access_token' > /dev/null 2>&1; then
        echo "ERROR: access_token field not found in response"
        echo "Available fields:"
        echo "$response_body" | jq 'keys'
        return 1
    fi
    
    MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN="$(echo "$response_body" | jq -r '.access_token')"
    
    # Debug: verify token was extracted successfully
    if [ -z "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" ] || [ "$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" = "null" ]; then
        echo "ERROR: Failed to extract access token"
        echo "Extracted token: '$MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN'"
        return 1
    fi
    
    echo "✓ Access token extracted successfully: ${MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN:0:20}..."
    echo "✓ Login successful"
    return 0
}

init_predefined_roles() {
    echo "Initializing platform roles..."
    IFS=',' read -ra ROLES <<< "$PREDEFINED_ROLE"
    for role in "${ROLES[@]}"; do
        echo "Creating role: $role"
        json_data=$(jq -n --arg name "$role" --arg description "$role Role" \
            '{name: $name, description: $description, roleTypes: ["workspace", "platform"]}')
        response=$(curl -s -X POST \
            --header 'Content-Type: application/json' \
            --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            --data "$json_data" \
            "$MC_IAM_MANAGER_HOST/api/roles")
        
        # Validate response
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to create role: $role"
            return 1
        fi
        
        echo "Response for role $role: $response"
        
        # Check success
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            echo "ERROR: Failed to create role: $role"
            return 1
        fi
    done
    echo "Platform roles initialized"
    return 0
}

init_menu() {
    echo "Initializing menu data..."
    wget -q -O ./menu.yaml "$MC_WEB_CONSOLE_MENUYAML"
    
    # Check if wget succeeded
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to download menu.yaml"
        return 1
    fi
    
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/setup/initial-menus")
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to initialize menu data"
        return 1
    fi
    
    echo "Menu initialization response: $response"
    
    # Check success
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: Menu initialization failed"
        return 1
    fi
    
    echo "Menu data initialized"
    return 0
}

init_api_resources() {
    echo "Initializing API resources..."
    if [ -n "$MC_ADMIN_CLI_APIYAML" ]; then
        wget -q -O ./api.yaml "$MC_ADMIN_CLI_APIYAML" && echo "  Downloaded api.yaml from $MC_ADMIN_CLI_APIYAML" || {
            echo "  WARNING: Failed to download api.yaml from $MC_ADMIN_CLI_APIYAML — using local copy"
        }
    else
        echo "  MC_ADMIN_CLI_APIYAML not set — using local api.yaml"
    fi
    if [ ! -f ./api.yaml ]; then
        echo "ERROR: api.yaml not found"
        return 1
    fi
    
    response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        "$MC_IAM_MANAGER_HOST/api/setup/sync-mcmp-apis")
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to initialize API resources"
        return 1
    fi
    
    echo "API resources initialization response: $response"
    
    # Check success
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: API resources initialization failed"
        return 1
    fi
    
    echo "API resources initialized"
    return 0
}

register_framework_services() {
    echo "Registering framework service URLs to mcmp_api_services..."

    # Register services defined in the services section of api.yaml via POST /api/mcmp-apis
    # sync-mcmp-apis only registers serviceActions (permissions) and does not handle the service URL registry — register separately

    register_service() {
        local name="$1"
        local version="$2"
        local base_url="$3"
        local auth_type="${4:-none}"
        local auth_user="${5:-}"
        local auth_pass="${6:-}"

        json_data=$(jq -n \
            --arg name "$name" \
            --arg version "$version" \
            --arg baseUrl "$base_url" \
            --arg authType "$auth_type" \
            --arg authUser "$auth_user" \
            --arg authPass "$auth_pass" \
            --argjson isActive true \
            '{name: $name, version: $version, baseUrl: $baseUrl, authType: $authType, authUser: $authUser, authPass: $authPass, isActive: $isActive}')

        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            --header 'Content-Type: application/json' \
            --data "$json_data" \
            "$MC_IAM_MANAGER_HOST/api/mcmp-apis")

        http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

        if [ "$http_code" = "201" ]; then
            echo "  ✓ Registered: $name ($base_url)"
        elif [ "$http_code" = "409" ]; then
            # If a record already exists, update base_url, version, and auth credentials
            PGPASSWORD="$MC_IAM_MANAGER_DATABASE_PASSWORD" psql \
                -h "$MC_IAM_MANAGER_DATABASE_HOST" \
                -p "${MC_IAM_MANAGER_DATABASE_PORT:-5432}" \
                -U "$MC_IAM_MANAGER_DATABASE_USER" \
                -d "$MC_IAM_MANAGER_DATABASE_NAME" \
                -c "UPDATE mcmp_api_services SET base_url='$base_url', version='$version', auth_type='$auth_type', auth_user='$auth_user', auth_pass='$auth_pass', updated_at=NOW() WHERE name='$name';" \
                -q 2>/dev/null \
            && echo "  ✓ Updated: $name ($base_url)" \
            || echo "  ✓ Already registered: $name (psql unavailable, skipped)"
        else
            echo "  ✗ Failed to register $name (HTTP $http_code): $response_body"
            return 1
        fi
        return 0
    }

    # Register all frameworks defined in the services section of api.yaml
    # mc-iam-manager itself is excluded from the service URL registry
    local failed=0
    local current_svc=""
    local current_version=""
    local current_baseurl=""
    local current_auth_type=""

    while IFS= read -r line; do
        # Detect service name (2-space indent + line ending with colon)
        if echo "$line" | grep -qE "^  [a-z].*:$"; then
            # Process the previous service
            if [ -n "$current_svc" ] && [ "$current_svc" != "mc-iam-manager" ]; then
                auth_user=""
                auth_pass=""
                if [ "$current_svc" = "mc-infra-manager" ]; then
                    auth_user="${MC_INFRA_MANAGER_API_USERNAME}"
                    auth_pass="${MC_INFRA_MANAGER_API_PASSWORD}"
                elif [ "$current_svc" = "mc-infra-connector" ]; then
                    auth_user="${MC_INFRA_CONNECTOR_API_USERNAME}"
                    auth_pass="${MC_INFRA_CONNECTOR_API_PASSWORD}"
                fi
                register_service "$current_svc" "$current_version" "$current_baseurl" \
                    "${current_auth_type:-none}" "$auth_user" "$auth_pass" || failed=1
            fi
            current_svc=$(echo "$line" | sed 's/^  //; s/:$//')
            current_version=""
            current_baseurl=""
            current_auth_type=""
        elif echo "$line" | grep -q "^    version:"; then
            current_version=$(echo "$line" | awk '{print $2}' | tr -d '"')
        elif echo "$line" | grep -q "^    baseurl:"; then
            current_baseurl=$(echo "$line" | awk '{print $2}')
        elif echo "$line" | grep -q "^      type:"; then
            current_auth_type=$(echo "$line" | awk '{print $2}' | tr -d '"')
        fi
    done < <(sed -n '/^services:/,/^serviceActions:/p' ./api.yaml | head -n -1)

    # Process the last service
    if [ -n "$current_svc" ] && [ "$current_svc" != "mc-iam-manager" ]; then
        auth_user=""
        auth_pass=""
        if [ "$current_svc" = "mc-infra-manager" ]; then
            auth_user="${MC_INFRA_MANAGER_API_USERNAME}"
            auth_pass="${MC_INFRA_MANAGER_API_PASSWORD}"
        elif [ "$current_svc" = "mc-infra-connector" ]; then
            auth_user="${MC_INFRA_CONNECTOR_API_USERNAME}"
            auth_pass="${MC_INFRA_CONNECTOR_API_PASSWORD}"
        fi
        register_service "$current_svc" "$current_version" "$current_baseurl" \
            "${current_auth_type:-none}" "$auth_user" "$auth_pass" || failed=1
    fi

    if [ $failed -ne 0 ]; then
        return 1
    fi

    echo "Framework service registration completed"
    return 0
}

update_public_service_urls() {
    echo "Updating framework service URLs to public-accessible addresses..."

    # mc-cost-optimizer-fe: replace the internal container URL (http://mc-cost-optimizer-fe:7780)
    # with the nginx HTTPS proxy URL accessible directly from the browser.
    # /api/getapihosts returns this value as the iframe src in MCIAM_USE=true environments.
    local cost_fe_public_url="${MC_COST_OPTIMIZER_FE_PUBLIC_HOST:-http://${MC_IAM_MANAGER_PUBLIC_DOMAIN}:${MC_COST_OPTIMIZER_FE_PROXY_PORT}}"

    # mc-cost-optimizer-fe is not in the upstream api.yaml, so attempt registration first (idempotent)
    local reg_body
    reg_body=$(printf '{"name":"mc-cost-optimizer-fe","version":"v1","baseUrl":"http://mc-cost-optimizer-fe:7780","authType":"none","authUser":"","authPass":"","isActive":true}')
    local reg_resp
    reg_resp=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$reg_body" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis")
    local reg_code
    reg_code=$(echo $reg_resp | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$reg_code" = "201" ]; then
        echo "  ✓ mc-cost-optimizer-fe registered"
    elif [ "$reg_code" = "409" ]; then
        echo "  ✓ mc-cost-optimizer-fe already registered"
    else
        echo "  ✗ Failed to register mc-cost-optimizer-fe (HTTP $reg_code)"
        return 1
    fi

    # Update baseurl to the external public URL
    local response
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "{\"base_url\": \"${cost_fe_public_url}\"}" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis/name/mc-cost-optimizer-fe")

    local http_code
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local response_body
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

    if [ "$http_code" = "200" ]; then
        echo "  ✓ Updated mc-cost-optimizer-fe baseurl: ${cost_fe_public_url}"
    else
        echo "  ✗ Failed to update mc-cost-optimizer-fe (HTTP $http_code): $response_body"
        return 1
    fi

    # mc-workflow-manager-fe: register and update dedicated iframe nginx HTTPS proxy URL
    # (the original mc-workflow-manager retains its internal URL for internal API calls)
    local wf_public_url="${MC_WORKFLOW_MANAGER_PUBLIC_HOST}"
    reg_body=$(printf '{"name":"mc-workflow-manager-fe","version":"v0.0.1","baseUrl":"http://mc-workflow-manager:18083","authType":"none","authUser":"","authPass":"","isActive":true}')
    reg_resp=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$reg_body" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis")
    reg_code=$(echo $reg_resp | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$reg_code" = "201" ]; then
        echo "  ✓ mc-workflow-manager-fe registered"
    elif [ "$reg_code" = "409" ]; then
        echo "  ✓ mc-workflow-manager-fe already registered"
    else
        echo "  ✗ Failed to register mc-workflow-manager-fe (HTTP $reg_code)"
        return 1
    fi
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "{\"base_url\": \"${wf_public_url}\"}" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis/name/mc-workflow-manager-fe")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    if [ "$http_code" = "200" ]; then
        echo "  ✓ Updated mc-workflow-manager-fe baseurl: ${wf_public_url}"
    else
        echo "  ✗ Failed to update mc-workflow-manager-fe (HTTP $http_code): $response_body"
        return 1
    fi

    # mc-data-manager-fe: register and update dedicated iframe nginx HTTPS proxy URL
    local dm_public_url="${MC_DATA_MANAGER_PUBLIC_HOST}"
    reg_body=$(printf '{"name":"mc-data-manager-fe","version":"v0.0.1","baseUrl":"http://mc-data-manager:3300","authType":"none","authUser":"","authPass":"","isActive":true}')
    reg_resp=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$reg_body" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis")
    reg_code=$(echo $reg_resp | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$reg_code" = "201" ]; then
        echo "  ✓ mc-data-manager-fe registered"
    elif [ "$reg_code" = "409" ]; then
        echo "  ✓ mc-data-manager-fe already registered"
    else
        echo "  ✗ Failed to register mc-data-manager-fe (HTTP $reg_code)"
        return 1
    fi
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "{\"base_url\": \"${dm_public_url}\"}" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis/name/mc-data-manager-fe")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    if [ "$http_code" = "200" ]; then
        echo "  ✓ Updated mc-data-manager-fe baseurl: ${dm_public_url}"
    else
        echo "  ✗ Failed to update mc-data-manager-fe (HTTP $http_code): $response_body"
        return 1
    fi

    # mc-application-manager-fe: register and update dedicated iframe nginx HTTPS proxy URL
    local am_public_url="${MC_APPLICATION_MANAGER_PUBLIC_HOST}"
    reg_body=$(printf '{"name":"mc-application-manager-fe","version":"v0.0.1","baseUrl":"http://mc-application-manager:18084","authType":"none","authUser":"","authPass":"","isActive":true}')
    reg_resp=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$reg_body" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis")
    reg_code=$(echo $reg_resp | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$reg_code" = "201" ]; then
        echo "  ✓ mc-application-manager-fe registered"
    elif [ "$reg_code" = "409" ]; then
        echo "  ✓ mc-application-manager-fe already registered"
    else
        echo "  ✗ Failed to register mc-application-manager-fe (HTTP $reg_code)"
        return 1
    fi
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "{\"base_url\": \"${am_public_url}\"}" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis/name/mc-application-manager-fe")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    if [ "$http_code" = "200" ]; then
        echo "  ✓ Updated mc-application-manager-fe baseurl: ${am_public_url}"
    else
        echo "  ✗ Failed to update mc-application-manager-fe (HTTP $http_code): $response_body"
        return 1
    fi

    # mc-observability-fe: register and update dedicated iframe nginx HTTPS proxy URL
    local obs_fe_public_url="${MC_OBSERVABILITY_FRONT_PUBLIC_HOST}"
    reg_body=$(printf '{"name":"mc-observability-fe","version":"v0.0.1","baseUrl":"http://mc-observability-front:18081","authType":"none","authUser":"","authPass":"","isActive":true}')
    reg_resp=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$reg_body" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis")
    reg_code=$(echo $reg_resp | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$reg_code" = "201" ]; then
        echo "  ✓ mc-observability-fe registered"
    elif [ "$reg_code" = "409" ]; then
        echo "  ✓ mc-observability-fe already registered"
    else
        echo "  ✗ Failed to register mc-observability-fe (HTTP $reg_code)"
        return 1
    fi
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "{\"base_url\": \"${obs_fe_public_url}\"}" \
        "$MC_IAM_MANAGER_HOST/api/mcmp-apis/name/mc-observability-fe")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    if [ "$http_code" = "200" ]; then
        echo "  ✓ Updated mc-observability-fe baseurl: ${obs_fe_public_url}"
    else
        echo "  ✗ Failed to update mc-observability-fe (HTTP $http_code): $response_body"
        return 1
    fi

    echo "Public service URL update completed"
    return 0
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


init_aws_csp_config() {
    local ACCOUNT_ID="${MC_IAM_MANAGER_AWS_ACCOUNT_ID:-}"
    local DOMAIN="${MC_IAM_MANAGER_PUBLIC_DOMAIN:-}"
    local REALM="${MC_IAM_MANAGER_KEYCLOAK_REALM:-mciam}"
    local PREFIX="${MC_IAM_MANAGER_CSP_ROLE_PREFIX:-mciam}"

    # MC_IAM_MANAGER_AWS_ACCOUNT_ID 미설정 또는 placeholder이면 skip
    if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" = "notyet" ]; then
        echo "  ⓘ MC_IAM_MANAGER_AWS_ACCOUNT_ID not configured — skipping AWS CSP setup"
        return 0
    fi

    local OIDC_PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${DOMAIN}/auth/realms/${REALM}"
    local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${PREFIX}-platformadmin"
    local CSP_ROLE_NAME="${PREFIX}-platformadmin"

    echo "  Account ID    : $ACCOUNT_ID"
    echo "  OIDC Provider : $OIDC_PROVIDER_ARN"
    echo "  IAM Role      : $ROLE_ARN"

    # --- Step 1: mcmp_csp_accounts 생성 --- POST /api/csp-accounts
    # list-first 패턴: 기존 항목이 있으면 ID를 가져오고, 없으면 생성
    local ACCOUNT_DB_ID http_code
    ACCOUNT_DB_ID=$(curl -s -X POST \
        -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        -H "Content-Type: application/json" \
        "$MC_IAM_MANAGER_HOST/api/csp-accounts/list" \
        -d "{\"name\":\"aws-default\"}" | jq -r '.[0].id // empty' 2>/dev/null)

    if [ -z "$ACCOUNT_DB_ID" ]; then
        local account_resp account_body
        account_resp=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            -H "Content-Type: application/json" \
            "$MC_IAM_MANAGER_HOST/api/csp-accounts" \
            -d "{\"name\":\"aws-default\",\"csp_type\":\"aws\",\"account_info\":{\"account_id\":\"${ACCOUNT_ID}\",\"region\":\"ap-northeast-2\"}}")
        http_code=$(echo "$account_resp" | tail -1)
        account_body=$(echo "$account_resp" | sed '$d')
        if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
            echo "  ✓ CspAccount created"
            ACCOUNT_DB_ID=$(echo "$account_body" | jq -r '.id // empty' 2>/dev/null)
        else
            echo "  ✗ CspAccount failed (HTTP $http_code): $account_body"
            return 1
        fi
    else
        echo "  ✓ CspAccount already exists (id=${ACCOUNT_DB_ID})"
    fi
    [ -z "$ACCOUNT_DB_ID" ] && { echo "  ✗ CspAccount ID not found"; return 1; }

    # --- Step 2: mcmp_csp_idp_configs 생성 (OIDC) --- POST /api/csp-idp-configs
    # list-first 패턴
    local IDP_EXISTS
    IDP_EXISTS=$(curl -s -X POST \
        -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        -H "Content-Type: application/json" \
        "$MC_IAM_MANAGER_HOST/api/csp-idp-configs/list" \
        -d "{\"name\":\"aws-oidc\",\"csp_account_id\":${ACCOUNT_DB_ID}}" | jq -r '.[0].id // empty' 2>/dev/null)

    if [ -z "$IDP_EXISTS" ]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            -H "Content-Type: application/json" \
            "$MC_IAM_MANAGER_HOST/api/csp-idp-configs" \
            -d "{\"name\":\"aws-oidc\",\"csp_account_id\":${ACCOUNT_DB_ID},\"auth_method\":\"OIDC\",\"config\":{\"role_arn\":\"${ROLE_ARN}\",\"oidc_provider_arn\":\"${OIDC_PROVIDER_ARN}\"}}")
        if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
            echo "  ✓ CspIdpConfig (OIDC) created"
        else
            echo "  ✗ CspIdpConfig failed (HTTP $http_code)"
            return 1
        fi
    else
        echo "  ✓ CspIdpConfig already exists"
    fi

    # --- Step 3: mcmp_role_csp_roles 등록 — POST /api/roles/csp ---
    local csp_role_resp
    csp_role_resp=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        -H "Content-Type: application/json" \
        "$MC_IAM_MANAGER_HOST/api/roles/csp" \
        -d "{\"cspRoleName\":\"${CSP_ROLE_NAME}\",\"cspType\":\"aws\",\"authMethod\":\"OIDC\"}")
    http_code=$(echo "$csp_role_resp" | tail -1)
    local csp_role_body
    csp_role_body=$(echo "$csp_role_resp" | sed '$d')
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo "  ✓ CspRole registered"
    else
        echo "  ✗ CspRole registration failed (HTTP $http_code): $csp_role_body"
        return 1
    fi

    local CSP_ROLE_ID
    CSP_ROLE_ID=$(echo "$csp_role_body" | jq -r '.id // empty' 2>/dev/null)
    [ -z "$CSP_ROLE_ID" ] && { echo "  ✗ CspRole ID not found in response"; return 1; }

    # --- Step 4: mcmp_role_csp_role_mappings — POST /api/roles/csp-roles ---
    for role_name in admin operator viewer billadmin billviewer; do
        # 역할 ID 조회
        local role_resp role_id
        role_resp=$(curl -s -X POST \
            -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            -H "Content-Type: application/json" \
            "$MC_IAM_MANAGER_HOST/api/roles/list" \
            -d "{\"roleName\":\"${role_name}\"}")
        role_id=$(echo "$role_resp" | jq -r '.[0].id // empty' 2>/dev/null)
        if [ -z "$role_id" ]; then
            echo "  ⓘ Role '${role_name}' not found, skipping"
            continue
        fi
        local mapping_resp mapping_body mapping_code
        mapping_resp=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
            -H "Content-Type: application/json" \
            "$MC_IAM_MANAGER_HOST/api/roles/csp-roles" \
            -d "{\"roleId\":\"${role_id}\",\"cspRoleId\":\"${CSP_ROLE_ID}\",\"authMethod\":\"OIDC\",\"cspType\":\"aws\"}")
        mapping_code=$(echo "$mapping_resp" | tail -1)
        mapping_body=$(echo "$mapping_resp" | sed '$d')
        if [ "$mapping_code" = "201" ] || [ "$mapping_code" = "200" ]; then
            echo "  ✓ Mapped: ${role_name} → ${CSP_ROLE_NAME}"
        elif echo "$mapping_body" | grep -q "already exists"; then
            echo "  ⓘ Mapping exists: ${role_name}"
        else
            echo "  ✗ Mapping failed: ${role_name} (HTTP $mapping_code)"
        fi
    done
    return 0
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
    
    # Print detailed info on success
    echo "✓ Project sync completed successfully"
    echo "Response details:"
    echo "$response_body" | jq .
    return 0
}

configure_keycloak_client_uris() {
    echo "=== Configuring Keycloak Client Redirect URIs ==="

    if [ -z "$MC_IAM_MANAGER_PUBLIC_HOST" ]; then
        echo "ERROR: MC_IAM_MANAGER_PUBLIC_HOST is not set — cannot configure redirect URIs"
        return 1
    fi

    PUBLIC_HOST="$MC_IAM_MANAGER_PUBLIC_HOST"
    echo "Public host: $PUBLIC_HOST"

    # Obtain Keycloak admin token
    KC_ADMIN_TOKEN=$(curl -s -X POST \
        "${MC_IAM_MANAGER_KEYCLOAK_HOST}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password" \
        -d "client_id=admin-cli" \
        -d "username=${MC_IAM_MANAGER_KEYCLOAK_ADMIN}" \
        -d "password=${MC_IAM_MANAGER_KEYCLOAK_ADMIN_PASSWORD}" \
        | jq -r '.access_token' 2>/dev/null)

    if [ -z "$KC_ADMIN_TOKEN" ] || [ "$KC_ADMIN_TOKEN" = "null" ]; then
        echo "ERROR: Failed to obtain Keycloak admin token"
        return 1
    fi
    echo "  ✓ Keycloak admin token obtained"

    KC_ADMIN_URL="${MC_IAM_MANAGER_KEYCLOAK_HOST}/admin/realms/${MC_IAM_MANAGER_KEYCLOAK_REALM}"

    # Configure both mciamClient and mciam-oidc-Client
    for CLIENT_NAME in "$MC_IAM_MANAGER_KEYCLOAK_CLIENT_NAME" "$MC_IAM_MANAGER_KEYCLOAK_OIDC_CLIENT_NAME"; do
        [ -z "$CLIENT_NAME" ] && continue

        # Look up client ID (UUID)
        CLIENT_ID=$(curl -s \
            "${KC_ADMIN_URL}/clients?clientId=${CLIENT_NAME}" \
            -H "Authorization: Bearer ${KC_ADMIN_TOKEN}" \
            | jq -r '.[0].id' 2>/dev/null)

        if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "null" ]; then
            echo "  ⚠️  Client not found: $CLIENT_NAME — skipping"
            continue
        fi

        # Fetch current client config, then update redirect URI
        CURRENT=$(curl -s "${KC_ADMIN_URL}/clients/${CLIENT_ID}" \
            -H "Authorization: Bearer ${KC_ADMIN_TOKEN}")

        UPDATED=$(echo "$CURRENT" | jq \
            --arg h "$PUBLIC_HOST" \
            '.rootUrl = $h | .baseUrl = $h | .redirectUris = [$h + "/*"] | .webOrigins = [$h]')

        HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
            "${KC_ADMIN_URL}/clients/${CLIENT_ID}" \
            -H "Authorization: Bearer ${KC_ADMIN_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "$UPDATED")

        if [ "$HTTP" = "204" ]; then
            echo "  ✓ Updated: $CLIENT_NAME → redirectUris=[${PUBLIC_HOST}/*]"
        else
            echo "  ✗ Failed to update $CLIENT_NAME (HTTP $HTTP)"
        fi
    done
    return 0
}

map_workspace_projects() {
    echo "Getting workspace list..."
    
    # Get workspace list
    workspace_response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data '{}' \
        "$MC_IAM_MANAGER_HOST/api/workspaces/list")
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to get workspace list"
        return 1
    fi
    
    echo "Workspace list response: $workspace_response"
    
    # Extract first workspace ID
    workspace_id=$(echo "$workspace_response" | jq -r '.[0].id // empty')
    
    if [ -z "$workspace_id" ] || [ "$workspace_id" = "null" ]; then
        echo "ERROR: No workspace found or failed to extract workspace ID"
        return 1
    fi
    
    echo "Using workspace ID: $workspace_id"
    
    # Get project list
    echo "Getting project list..."
    project_response=$(curl -s -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data '{}' \
        "$MC_IAM_MANAGER_HOST/api/projects/list")
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to get project list"
        return 1
    fi
    
    echo "Project list response: $project_response"
    
    # Extract all project IDs (convert to strings)
    project_ids=$(echo "$project_response" | jq -r '[.[].id | tostring]')
    
    if [ -z "$project_ids" ] || [ "$project_ids" = "[]" ]; then
        echo "WARNING: No projects found to assign to workspace"
        return 0
    fi
    
    echo "Found project IDs: $project_ids"
    
    # Map all projects to workspace
    json_data=$(jq -n --arg workspace_id "$workspace_id" --argjson project_ids "$project_ids" \
        '{workspaceId: $workspace_id, projectIds: $project_ids}')
    
    echo "Workspace-Project mapping request JSON: $json_data"
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
        --header 'Content-Type: application/json' \
        --data "$json_data" \
        "$MC_IAM_MANAGER_HOST/api/workspaces/assign/projects")
    
    # Split HTTP status code and response body
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    echo "Workspace-Project mapping HTTP Status: $http_code"
    echo "Workspace-Project mapping Response Body: $response_body"
    
    # Validate response
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to make request to workspace-project mapping API"
        echo "curl exit code: $?"
        return 1
    fi
    
    # Check HTTP status code
    if [ "$http_code" != "200" ]; then
        echo "ERROR: Workspace-project mapping failed with HTTP status $http_code"
        return 1
    fi
    
    # Validate JSON response
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        echo "ERROR: Invalid JSON response from workspace-project mapping API"
        echo "Raw response: $response_body"
        return 1
    fi
    
    # Check success
    if echo "$response_body" | jq -e '.error' > /dev/null 2>&1; then
        echo "ERROR: Workspace-project mapping failed with error in response"
        echo "Error details:"
        echo "$response_body" | jq '.error'
        return 1
    fi
    
    echo "Workspace-Project mapping completed for workspace ID: $workspace_id"
    return 0
}

# add_sample_userrole_mapping() {
#     echo "Adding test users..."

#     #admin
#     role_id="1"
#     #platform admin user
#     user_id="1"
#     role_type="platform"
#     # ws01
#     workspace_id="1"

#     json_data=$(jq -n --arg role_id "$role_id" --arg user_id "$user_id" --arg role_type "$role_type" --arg workspace_id "$workspace_id" \
#         '{role_id: $role_id, user_id: $user_id, role_type: $role_type, workspace_id: $workspace_id}')
#     response=$(curl -s -X POST \
#         --header "Authorization: Bearer $MC_IAM_MANAGER_PLATFORMADMIN_ACCESSTOKEN" \
#         --header 'Content-Type: application/json' \
#         --data "$json_data" \
#         "$MC_IAM_MANAGER_HOST_FOR_INIT/api/roles/assign/platform-role")

#     # Validate response
#     if [ $? -ne 0 ]; then
#         echo "ERROR: Failed to sync projects"
#         return 1
#     fi
    
#     echo "Test user addition response: $response"


#     echo "Test user addition completed"
#     return 0
# }

# Run automated setup
echo "Starting automated setup process..."
auto_setup

# Exit after automated setup completes
if [ $? -eq 0 ]; then
    echo "Setup completed successfully!"
    exit 0
else
    echo "Setup failed with errors!"
    exit 1
fi 