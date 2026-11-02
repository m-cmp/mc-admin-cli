#!/bin/bash

# MC-IAM-Manager Mode Configuration Script

# =============================================================================
# Usage Function
# =============================================================================
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --mode <MODE>           IAM mode selection (dev|prod)"
    echo "                              dev:  Developer mode (Local PC HTTP  or  Remote VM self-signed HTTPS)"
    echo "                              prod: Production mode with Let's Encrypt certificate"
    echo "  -d, --domain <DOMAIN>       Public domain or IP (determines sub-mode for dev)"
    echo "                              [Scenario 1] dev - Local PC (HTTP, no certs):"
    echo "                                localhost        — default, plain HTTP, no /etc/hosts change"
    echo "                                mciam.local      — plain HTTP, adds 127.0.0.1 entry to /etc/hosts"
    echo "                              [Scenario 2] dev - Remote VM (HTTPS, self-signed cert):"
    echo "                                <IP>             — e.g. 1.2.3.4, self-signed cert for the IP"
    echo "                              [Scenario 3] prod - Domain + Let's Encrypt:"
    echo "                                <FQDN>           — e.g. iam.example.com, real DNS required"
    echo "  -r, --run <RUN_MODE>        Service run mode (log|background|skip)"
    echo "                              log:        Run with real-time logs"
    echo "                              background: Run in background with status monitoring"
    echo "                              skip:       Configure only, do not start services"
    echo "  -c, --change-defaults <y|n> Change default credentials still identical to .env.setup"
    echo "                              y: prompt for each value   n: keep defaults (no prompt)"
    echo "                              Omitted: ask interactively (dev: keep by default, prod: change by default)"
    echo "  -h, --help                  Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -m dev -r background                    # Scenario 1: Local PC, localhost, plain HTTP"
    echo "  $0 -m dev -d mciam.local -r background     # Scenario 1: Local PC, named domain, plain HTTP"
    echo "  $0 -m dev -d 1.2.3.4 -r background         # Scenario 2: Remote VM, public IP, self-signed HTTPS"
    echo "  $0 -m prod -d iam.example.com -r background # Scenario 3: Remote VM, domain, Let's Encrypt HTTPS"
    echo "  $0 -m dev -r background -c n               # Keep default credentials without asking"
    echo "  $0                                         # Interactive mode"
    exit 1
}

# =============================================================================
# Parameter Parsing
# =============================================================================
IAM_MODE=""
IAM_DOMAIN=""
RUN_MODE=""
CHANGE_DEFAULTS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            IAM_MODE="$2"
            shift 2
            ;;
        -d|--domain)
            IAM_DOMAIN="$2"
            shift 2
            ;;
        -r|--run)
            RUN_MODE="$2"
            shift 2
            ;;
        -c|--change-defaults)
            CHANGE_DEFAULTS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Parameter Validation
if [ -n "$IAM_MODE" ] && [ "$IAM_MODE" != "dev" ] && [ "$IAM_MODE" != "prod" ]; then
    echo "Error: Invalid mode. Please use 'dev' or 'prod'."
    usage
fi

if [ -n "$RUN_MODE" ] && [ "$RUN_MODE" != "log" ] && [ "$RUN_MODE" != "background" ] && [ "$RUN_MODE" != "skip" ]; then
    echo "Error: Invalid run mode. Please use 'log', 'background', or 'skip'."
    usage
fi

if [ -n "$CHANGE_DEFAULTS" ] && [ "$CHANGE_DEFAULTS" != "y" ] && [ "$CHANGE_DEFAULTS" != "n" ]; then
    echo "Error: Invalid change-defaults value. Please use 'y' or 'n'."
    usage
fi

# =============================================================================
# Container List Definition (User Configurable)
# =============================================================================

# Expected running containers (defined in docker-compose.yaml)
EXPECTED_CONTAINERS=(
    "mc-infra-connector"
    "mc-infra-manager"
    "mc-infra-manager-etcd"
    "mc-infra-manager-postgres"
    "mc-iam-manager"
    "mc-iam-manager-db"
    "mc-iam-manager-kc"
    "mc-iam-manager-nginx"
    # "mc-iam-manager-post-initial"  # Container that exits after execution
    "mc-cost-optimizer-fe"
    "mc-cost-optimizer-be"
    "mc-cost-optimizer-cost-collector"
    "mc-cost-optimizer-cost-processor"
    "mc-cost-optimizer-cost-selector"
    "mc-cost-optimizer-alarm-service"
    "mc-cost-optimizer-asset-collector"
    "mc-cost-optimizer-db"
    # "mc-application-manager-jenkins"  # removed
    "mc-application-manager-sonatype-nexus"
    "mc-application-manager"
    "mc-workflow-manager-jenkins"
    "mc-workflow-manager"
    "mc-data-manager"
    "mc-web-console-db"
    "mc-web-console-api"
    "mc-web-console-front"
    "mc-observability-manager"
    "mc-observability-infra"
    "mc-observability-rabbitmq"
    "mc-observability-maria"
    "mc-observability-influx"
    "mc-observability-influx-2"
    "mc-observability-loki"
    "mc-observability-tempo"
    "mc-observability-grafana"
    "mc-observability-insight"
    "mc-observability-insight-scheduler"
    "mc-observability-front"
    "mc-observability-mcp-grafana"
    "mc-observability-mcp-maria"
    "mc-observability-mcp-influx"
    "mc-observability-log-collector"
)

# Containers without Health Check (treated as successful when in Up state)
NO_HEALTH_CHECK_CONTAINERS=(
    "mc-iam-manager-nginx"
    "mc-cost-optimizer-alarm-service"
    "mc-cost-optimizer-asset-collector"
    "mc-cost-optimizer-cost-collector"
    "mc-cost-optimizer-cost-processor"
    "mc-cost-optimizer-cost-selector"
    "mc-observability-tempo"
    "mc-observability-front"
    "mc-observability-mcp-grafana"
    "mc-observability-mcp-maria"
    "mc-observability-mcp-influx"
)

# Consecutive 10s polls a container must stay in Created/Exited before it's
# treated as a genuine failure. Containers with a restart policy (unless-stopped,
# on-failure) can blip through Exited between crash and Docker's auto-restart --
# mc-observability-influx in particular exits by design during its own init
# (see docker-compose.yaml), so a single snapshot of Exited is not conclusive.
EXIT_STREAK_THRESHOLD=3

# =============================================================================
# Startup Waves (reduce resource contention from starting 60+ services at once)
# =============================================================================
# Grouped along docker-compose.yaml's own subsystem sections. Only "entry
# point" services need to be listed per wave -- compose brings up each one's
# depends_on chain automatically (already-running dependencies are a no-op).
# mc-application-manager/mc-cost-optimizer-* depend on mc-observability-rabbitmq,
# so the observability backbone wave runs before the app-tier wave.
# mc-iam-manager-nginx is listed explicitly: mc-iam-manager no longer declares a
# compose dependency on it (that dependency caused a startup deadlock), but the
# IAM manager still needs the public-domain endpoints nginx serves to become
# healthy, so nginx must start in the same wave.
STARTUP_WAVES=(
    "mc-infra-connector mc-infra-manager mc-iam-manager-nginx mc-iam-manager mc-iam-manager-post-initial"
    "mc-data-manager mc-web-console-api mc-web-console-front"
    "mc-observability-manager mc-observability-front mc-observability-insight mc-observability-insight-scheduler mc-observability-mcp-grafana mc-observability-mcp-maria mc-observability-mcp-influx mc-observability-log-collector"
    "mc-application-manager mc-workflow-manager mc-cost-optimizer-fe"
)

# Starts every wave detached (-d), then one final full-stack `run -d` for the
# services no wave entry point reaches (cost-optimizer collectors/rightsizers,
# cb-mapui, ...). Waves must always be detached: an attached `compose up` never
# returns, so later waves would never start.
run_startup_waves() {
    local wave_num=0
    local run_exit
    for wave_services in "${STARTUP_WAVES[@]}"; do
        wave_num=$((wave_num + 1))
        echo ""
        echo "---- Wave $wave_num/${#STARTUP_WAVES[@]}: $wave_services ----"
        ./mcc infra run -d -s "$wave_services"
        run_exit=$?
        if [ $run_exit -ne 0 ]; then
            report_run_failure "$run_exit" "Wave $wave_num ($wave_services)"
            exit 1
        fi
    done

    echo ""
    echo "---- Remaining services (not reached by any wave) ----"
    ./mcc infra run -d
    run_exit=$?
    if [ $run_exit -ne 0 ]; then
        report_run_failure "$run_exit" "remaining services"
        exit 1
    fi
}

# Prints a consistent failure banner for a failed `./mcc infra run` invocation.
report_run_failure() {
    local exit_code="$1"
    local context="$2"
    echo ""
    echo "=========================================="
    echo "❌ Service startup failed (exit code: $exit_code)${context:+ - $context}."
    echo "Review the compose output above for the failing service."
    echo "Check status:  ./mcc infra info"
    echo "Check logs:    docker logs <container_name>"
    echo "=========================================="
}

# mc-iam-manager-post-initial is excluded from EXPECTED_CONTAINERS (it's a
# one-shot init container), so its completion is checked separately here.
check_post_initial() {
    local pi_exit
    pi_exit=$(docker inspect --format='{{.State.ExitCode}}' mc-iam-manager-post-initial 2>/dev/null)
    if [ "$pi_exit" != "0" ]; then
        echo ""
        echo "⚠️  mc-iam-manager-post-initial did not complete successfully (or never ran)."
        echo "Run the recovery script to finish IAM initialization:"
        echo "   ./bin/iam_manager_init.sh"
    fi
}

# This is optional post-install setup: declining or failing the EULA check must
# never change the service startup result, stop containers, or roll back data.
check_nexus_eula() {
    if ! command -v python3 >/dev/null 2>&1; then
        echo "[WARN] python3 is unavailable; Nexus EULA setup was skipped."
        echo "       Other services are unaffected. Accept later in the Nexus admin UI"
        echo "       or follow README Step 6-1."
        return 0
    fi
    if ! python3 "$ORIGINAL_DIR/nexus_eula.py" \
        --compose-file "$PROJECT_ROOT_ABS/docker-compose.yaml" \
        --env-file "$PROJECT_ROOT_ABS/.env"; then
        echo "[WARN] Nexus EULA setup needs attention; the platform startup result is unchanged."
    fi
    return 0
}

# =============================================================================

# Save current directory at script start
ORIGINAL_DIR="$(pwd)"

# =============================================================================
# IAM Mode Selection
# =============================================================================

# If mode is not specified via parameter, select interactively
if [ -z "$IAM_MODE" ]; then
    echo "=========================================="
    echo "MC-IAM-Manager Configuration Mode Selection"
    echo "=========================================="
    echo ""
    echo "MC-IAM-Manager can be configured in two modes:"
    echo ""
    echo "[Developer Mode - Local Authentication]"
    echo "  - localhost (default): plain HTTP, no certificates, no /etc/hosts change required"
    echo "  - IP/domain input: HTTPS with self-signed certificate"
    echo "  - Optimized for local development environment"
    echo "  - Quick setup and testing"
    echo ""
    echo "[Production Mode - CA Authentication]"
    echo "  - Uses Let's Encrypt CA certificates"
    echo "  - For use with real domains"
    echo "  - HTTPS based on security certificates"
    echo "  - Suitable for production environments"
    echo ""
    echo "=========================================="

    while true; do
        echo -n "Which mode would you like to configure? (1: Developer Mode, 2: Production Mode): "
        read -r choice
        
        case $choice in
            1)
                IAM_MODE="dev"
                break
                ;;
            2)
                IAM_MODE="prod"
                break
                ;;
            *)
                echo "Invalid selection. Please enter 1 or 2."
                ;;
        esac
    done
fi

# =============================================================================
# .env Bootstrap
# =============================================================================

PROJECT_ROOT_ABS="$(cd "$ORIGINAL_DIR/../conf/docker" && pwd)"

ensure_env_file() {
    local setup_file="$1"
    local env_file="$2"
    if [ ! -f "$env_file" ]; then
        if [ -f "$setup_file" ]; then
            cp "$setup_file" "$env_file"
            echo "✓ Created $(basename "$env_file") from $(basename "$setup_file")"
        else
            echo "Error: $setup_file not found."
            exit 1
        fi
    fi
}

sync_missing_env_vars() {
    local setup_file="$1"
    local env_file="$2"

    if [ ! -f "$setup_file" ] || [ ! -f "$env_file" ]; then
        return 0
    fi

    local tmpfile
    tmpfile=$(mktemp)

    while IFS= read -r line; do
        _key="${line%%=*}"
        if ! grep -qE "^${_key}=" "$env_file"; then
            printf '%s\n' "$line" >> "$tmpfile"
        fi
    done < <(grep -E '^[A-Z_][A-Z0-9_]*=' "$setup_file")

    if [ -s "$tmpfile" ]; then
        local rel="${env_file##*/conf/docker/}"
        {
            printf '\n'
            printf '# === Synced from %s by installAll.sh on %s ===\n' \
                "$(basename "$setup_file")" "$(date -Iseconds)"
            cat "$tmpfile"
        } >> "$env_file"
        echo "✓ Synced $(wc -l < "$tmpfile") missing var(s) into ${rel}"
    fi
    rm -f "$tmpfile"
}

ensure_env_file "$PROJECT_ROOT_ABS/.env.setup"                            "$PROJECT_ROOT_ABS/.env"
ensure_env_file "$PROJECT_ROOT_ABS/conf/mc-iam-manager/.env.setup"        "$PROJECT_ROOT_ABS/conf/mc-iam-manager/.env"

sync_missing_env_vars "$PROJECT_ROOT_ABS/.env.setup"                      "$PROJECT_ROOT_ABS/.env"
sync_missing_env_vars "$PROJECT_ROOT_ABS/conf/mc-iam-manager/.env.setup"  "$PROJECT_ROOT_ABS/conf/mc-iam-manager/.env"

# =============================================================================
# Default Credential Customization
# =============================================================================
# Which keys are offered is decided by .env.setup itself, not by this script:
#   - keys named *_PASSWORD / *_PW are always offered
#   - "# @ask" on the line(s) right above a key offers it too (name/id etc.)
#   - "# @noask" right above a key excludes it (even a password)
#   - "# @sync=<file under conf/docker>:<KEY>" right above a key copies its new
#     value into that file's KEY as well (repeatable); for a .yaml/.yml file,
#     KEY is a dotted path such as services.mc-infra-manager.auth.password
# Annotations sit on their own comment line because the IAM preset scripts read
# .env line by line and would keep an inline comment as part of the value.
# Keys with an empty default or a ${...} reference are never offered.
# Only keys whose .env value still equals the .env.setup default are offered.

# Prints the value part of KEY=VALUE without a trailing " # comment".
env_line_value() {
    local value="${1#*=}"
    value="${value%%[[:space:]]#*}"
    value="${value%"${value##*[![:space:]]}"}"
    printf '%s' "$value"
}

# Prints the current value of a key in an env file (empty if missing).
read_env_value() {
    local env_file="$1"
    local key="$2"
    local line
    line=$(grep -m1 -E "^${key}=" "$env_file" 2>/dev/null) || return 0
    env_line_value "$line"
}

# Replaces KEY's value in an env file, keeping any trailing " # comment".
# No-op when the file or the key does not exist.
set_env_value() {
    local env_file="$1"
    local key="$2"
    local value="$3"
    [ -f "$env_file" ] || return 0
    grep -qE "^${key}=" "$env_file" || return 0

    local tmpfile
    tmpfile=$(mktemp)
    awk -v key="$key" -v value="$value" '
        index($0, key "=") == 1 {
            rest = substr($0, length(key) + 2)
            comment = ""
            if (match(rest, /[ \t]+#/)) comment = substr(rest, RSTART)
            print key "=" value comment
            next
        }
        { print }
    ' "$env_file" > "$tmpfile" && cat "$tmpfile" > "$env_file"
    rm -f "$tmpfile"
    echo "  ✓ ${key} updated in ${env_file##*/conf/docker/}"
}

# Replaces the scalar at a dotted path (e.g. services.mc-infra-manager.auth.password)
# in a YAML file, single-quoted. No-op when the file or the path does not exist.
set_yaml_value() {
    local yaml_file="$1"
    local path="$2"
    local value="$3"
    [ -f "$yaml_file" ] || return 0

    local tmpfile
    tmpfile=$(mktemp)
    if awk -v path="$path" -v value="$value" '
        BEGIN { depth = 0; done = 0 }
        !done && match($0, /^ *[A-Za-z0-9_.-]+:/) {
            keyend = RLENGTH
            indent = match($0, /[^ ]/) - 1
            key = substr($0, indent + 1, keyend - indent - 1)
            while (depth > 0 && indents[depth] >= indent) depth--
            depth++; indents[depth] = indent; keys[depth] = key
            joined = keys[1]
            for (i = 2; i <= depth; i++) joined = joined "." keys[i]
            if (joined == path) {
                printf "%" indent "s%s: '\''%s'\''\n", "", key, value
                done = 1
                next
            }
        }
        { print }
        END { exit done ? 0 : 1 }
    ' "$yaml_file" > "$tmpfile"; then
        cat "$tmpfile" > "$yaml_file"
        echo "  ✓ ${path} updated in ${yaml_file##*/conf/docker/}"
    fi
    rm -f "$tmpfile"
}

CUSTOM_KEYS=()
CUSTOM_DEFAULTS=()
CUSTOM_SYNCS=()

# Fills CUSTOM_KEYS / CUSTOM_DEFAULTS / CUSTOM_SYNCS from the annotated .env.setup.
collect_customizable_keys() {
    local setup_file="$1"
    local env_file="$2"
    local line key default ask noask syncs

    ask=false; noask=false; syncs=""
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ "$line" =~ ^[[:space:]]*#[[:space:]]*@noask ]]; then
            noask=true; continue
        elif [[ "$line" =~ ^[[:space:]]*#[[:space:]]*@ask ]]; then
            ask=true; continue
        elif [[ "$line" =~ ^[[:space:]]*#[[:space:]]*@sync=([^[:space:]]+) ]]; then
            syncs="${syncs} ${BASH_REMATCH[1]}"; continue
        elif [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        elif [[ ! "$line" =~ ^([A-Z_][A-Z0-9_]*)= ]]; then
            ask=false; noask=false; syncs=""
            continue
        fi

        key="${BASH_REMATCH[1]}"
        default=$(env_line_value "$line")
        if ! $noask && [ -n "$default" ] && [[ "$default" != *'${'* ]] \
            && { $ask || [[ "$key" =~ _(PASSWORD|PW)$ ]]; } \
            && [ "$(read_env_value "$env_file" "$key")" = "$default" ]; then
            CUSTOM_KEYS+=("$key")
            CUSTOM_DEFAULTS+=("$default")
            CUSTOM_SYNCS+=("$syncs")
        fi
        ask=false; noask=false; syncs=""
    done < "$setup_file"
}

is_secret_key() {
    [[ "$1" =~ _(PASSWORD|PW)$ ]]
}

# Characters that would break compose interpolation, sed/awk or comment parsing.
is_valid_env_value() {
    [ -n "$1" ] && [[ ! "$1" =~ [[:space:]\$\`\'\"\|#\\] ]]
}

# Reads a new value for one key into PROMPT_RESULT (empty = keep default).
prompt_env_value() {
    local key="$1"
    local default="$2"
    local value confirm

    while true; do
        if is_secret_key "$key"; then
            read -rs -p "${key} [keep default]: " value; echo ""
            if [ -n "$value" ]; then
                read -rs -p "${key} (confirm): " confirm; echo ""
                if [ "$value" != "$confirm" ]; then
                    echo "  Values do not match. Try again."
                    continue
                fi
            fi
        else
            read -r -p "${key} [${default}]: " value
        fi

        if [ -z "$value" ] || [ "$value" = "$default" ]; then
            PROMPT_RESULT=""
            return 0
        fi
        if is_valid_env_value "$value"; then
            PROMPT_RESULT="$value"
            return 0
        fi
        echo "  Not allowed: spaces and \$ \` ' \" | # \\. Try again."
    done
}

customize_default_values() {
    local setup_file="$PROJECT_ROOT_ABS/.env.setup"
    local root_env="$PROJECT_ROOT_ABS/.env"
    local iam_env="$PROJECT_ROOT_ABS/conf/mc-iam-manager/.env"

    collect_customizable_keys "$setup_file" "$root_env"
    [ ${#CUSTOM_KEYS[@]} -eq 0 ] && return 0

    echo ""
    echo "=========================================="
    echo "Default Values"
    echo "=========================================="
    echo "These keys still use the defaults from .env.setup:"
    local key
    for key in "${CUSTOM_KEYS[@]}"; do
        echo "  - $key"
    done

    local default_answer="y"
    if [ "$IAM_MODE" = "prod" ]; then
        default_answer="n"
        echo ""
        echo "⚠️  Production mode: default passwords are public. Changing them is strongly recommended."
    fi
    if [ -d "$PROJECT_ROOT_ABS/container-volume" ] \
        && [ -n "$(ls -A "$PROJECT_ROOT_ABS/container-volume" 2>/dev/null)" ]; then
        echo ""
        echo "⚠️  container-volume already has data. New values do not apply to databases that are"
        echo "   already initialized — run ./cleanAll.sh first if you change them."
    fi

    local keep
    if [ "$CHANGE_DEFAULTS" = "y" ]; then
        keep="n"
    elif [ "$CHANGE_DEFAULTS" = "n" ]; then
        keep="y"
    elif [ ! -t 0 ]; then
        keep="y"
        echo "Non-interactive input — keeping default values (use -c y to change them)."
    else
        local hint="Y/n"
        [ "$default_answer" = "n" ] && hint="y/N"
        while true; do
            echo ""
            read -r -p "Keep all default values? (${hint}): " keep
            keep="${keep:-$default_answer}"
            case "$keep" in
                y|Y) keep="y"; break ;;
                n|N) keep="n"; break ;;
                *) echo "Please enter y or n." ;;
            esac
        done
    fi

    if [ "$keep" = "y" ]; then
        echo "✓ Keeping default values."
        return 0
    fi

    echo ""
    echo "Enter a new value for each key (press Enter to keep the default)."
    local i sync file target changed=0
    for i in "${!CUSTOM_KEYS[@]}"; do
        key="${CUSTOM_KEYS[$i]}"
        prompt_env_value "$key" "${CUSTOM_DEFAULTS[$i]}"
        [ -z "$PROMPT_RESULT" ] && continue

        set_env_value "$root_env" "$key" "$PROMPT_RESULT"
        set_env_value "$iam_env"  "$key" "$PROMPT_RESULT"
        for sync in ${CUSTOM_SYNCS[$i]}; do
            file="${sync%%:*}"
            target="${sync#*:}"
            case "$file" in
                *.yaml|*.yml) set_yaml_value "$PROJECT_ROOT_ABS/$file" "$target" "$PROMPT_RESULT" ;;
                *)            set_env_value  "$PROJECT_ROOT_ABS/$file" "$target" "$PROMPT_RESULT" ;;
            esac
        done
        changed=$((changed + 1))
    done
    echo "✓ ${changed} value(s) changed."
}

customize_default_values

# =============================================================================
# Domain Configuration
# =============================================================================

if [ -z "$IAM_DOMAIN" ]; then
    echo ""
    echo "=========================================="
    echo "Public Domain Configuration"
    echo "=========================================="
    if [ "$IAM_MODE" = "dev" ]; then
        echo ""
        echo "  [Scenario 1 - Local PC, HTTP]"
        echo "    Just press Enter  →  localhost  (plain HTTP, no certs, no /etc/hosts change)"
        echo "    Enter mciam.local →  plain HTTP  (127.0.0.1 mciam.local added to /etc/hosts)"
        echo ""
        echo "  [Scenario 2 - Remote VM, HTTPS self-signed]"
        echo "    Enter VM public IP  (e.g. 43.202.200.215)"
        echo "    → Self-signed certificate issued for the IP"
        echo ""
        echo "  [Scenario 3 - Domain + Let's Encrypt]"
        echo "    Run with -m prod and a real FQDN instead."
        echo ""
        echo -n "Enter domain or IP [localhost]: "
        read -r IAM_DOMAIN
        IAM_DOMAIN="${IAM_DOMAIN:-localhost}"
    else
        echo ""
        echo "Mode B: Let's Encrypt certificate will be issued for this domain."
        echo "The domain must be a real FQDN with valid DNS pointing to this server."
        echo ""
        while [ -z "$IAM_DOMAIN" ]; do
            echo -n "Enter public FQDN (e.g. iam.example.com): "
            read -r IAM_DOMAIN
            if [ -z "$IAM_DOMAIN" ]; then
                echo "Domain is required for Production Mode. Please enter a valid FQDN."
            fi
        done
    fi
fi

echo ""
echo "Using domain: $IAM_DOMAIN"

apply_domain() {
    local env_file="$1"
    local domain="$2"
    if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s|^MC_IAM_MANAGER_PUBLIC_DOMAIN=.*|MC_IAM_MANAGER_PUBLIC_DOMAIN=${domain}|" "$env_file"
    else
        sed -i "s|^MC_IAM_MANAGER_PUBLIC_DOMAIN=.*|MC_IAM_MANAGER_PUBLIC_DOMAIN=${domain}|" "$env_file"
    fi
    echo "✓ Set MC_IAM_MANAGER_PUBLIC_DOMAIN=${domain} in ${env_file##*/conf/docker/}"
}

apply_domain "$PROJECT_ROOT_ABS/.env"                            "$IAM_DOMAIN"
apply_domain "$PROJECT_ROOT_ABS/conf/mc-iam-manager/.env"        "$IAM_DOMAIN"

# =============================================================================
# Process selected mode
case $IAM_MODE in
    dev)
        echo ""
        cd ../conf/docker/conf/mc-iam-manager/ || {
            echo "Error: Cannot find mc-iam-manager directory."
            cd "$ORIGINAL_DIR"
            exit 1
        }

        if [ "$IAM_DOMAIN" = "localhost" ] || [ "$IAM_DOMAIN" = "127.0.0.1" ] || [ "$IAM_DOMAIN" = "mciam.local" ]; then
            echo "Local PC mode ($IAM_DOMAIN) — configuring plain HTTP, no certificates."
            echo ""

            if [ -f "0_preset_local.sh" ]; then
                chmod +x 0_preset_local.sh
                ./0_preset_local.sh
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ Local HTTP mode configuration completed."
                    echo "Now you can run ./mcc infra run."
                else
                    echo ""
                    echo "❌ Error occurred during local HTTP mode configuration."
                    cd "$ORIGINAL_DIR"
                    exit 1
                fi
            else
                echo "Error: Cannot find 0_preset_local.sh file."
                cd "$ORIGINAL_DIR"
                exit 1
            fi
        else
            echo "You have selected Developer Mode - Local Authentication."
            echo "Generating self-signed certificate and configuring local environment..."
            echo ""

            if [ -f "0_preset_dev.sh" ]; then
                chmod +x 0_preset_dev.sh
                ./0_preset_dev.sh
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ Developer mode configuration completed."
                    echo "Now you can run ./mcc infra run."
                else
                    echo ""
                    echo "❌ Error occurred during developer mode configuration."
                    cd "$ORIGINAL_DIR"
                    exit 1
                fi
            else
                echo "Error: Cannot find 0_preset_dev.sh file."
                cd "$ORIGINAL_DIR"
                exit 1
            fi
        fi
        ;;
    prod)
        echo ""
        echo "You have selected Production Mode - CA Authentication."
        echo "Generating Let's Encrypt certificate and configuring production environment..."
        echo ""
        
        # Production mode: Generate certificate
        echo "Step 1: Generating Let's Encrypt certificate..."
        
        # Return to original directory and run mcc
        cd "$ORIGINAL_DIR" || {
            echo "Error: Cannot return to original directory."
            exit 1
        }
        
        if [ -f "./mcc" ]; then
            ./mcc infra run -f ../conf/docker/docker-compose.cert.yaml
            if [ $? -eq 0 ]; then
                echo "✓ Certificate generation completed."
                # Reclaim ownership of volume directories created by the certbot container (runs as root)
                sudo chown -R "$USER:$USER" ../conf/docker/container-volume
                # Register automatic renewal (the certificate is valid for 90 days)
                if sudo ../conf/docker/scripts/renew-cert.sh --install-cron; then
                    echo "✓ Certificate auto-renewal registered (/etc/cron.d/mcmp-cert-renew)."
                else
                    echo "⚠ Failed to register certificate auto-renewal. Run manually: sudo ../conf/docker/scripts/renew-cert.sh --install-cron"
                fi
            else
                echo "❌ Error occurred during certificate generation."
                exit 1
            fi
        else
            echo "Error: Cannot find mcc executable file."
            exit 1
        fi
        
        echo ""
        echo "Step 2: Configuring production mode..."
        
        # Execute production mode script
        cd ../conf/docker/conf/mc-iam-manager/ || {
            echo "Error: Cannot find mc-iam-manager directory."
            cd "$ORIGINAL_DIR"
            exit 1
        }
        
        if [ -f "0_preset_prod.sh" ]; then
            chmod +x 0_preset_prod.sh
            ./0_preset_prod.sh
            if [ $? -eq 0 ]; then
                echo ""
                echo "✓ Production mode configuration completed."
                echo "Now you can run ./mcc infra run."
            else
                echo ""
                echo "❌ Error occurred during production mode configuration."
                cd "$ORIGINAL_DIR"
                exit 1
            fi
        else
            echo "Error: Cannot find 0_preset_prod.sh file."
            cd "$ORIGINAL_DIR"
            exit 1
        fi
        ;;
esac

# Return to original directory after all mode configurations
cd "$ORIGINAL_DIR"

echo ""
echo "======================================================"
echo "Configuration completed!"
echo "Now you can run ./mcc infra run to start the service."
echo "======================================================"

# =============================================================================
# Service Run Mode Selection
# =============================================================================

# If run mode is not specified via parameter, select interactively
if [ -z "$RUN_MODE" ]; then
    echo ""
    echo "Select service run mode:"
    echo "1. Log Mode - Run with real-time logs"
    echo "2. Background Mode - Run in background with status monitoring"
    echo "3. Skip - Do not run"
    echo ""

    while true; do
        echo -n "Select run mode (1/2/3): "
        read -r run_choice
        
        case $run_choice in
            1)
                RUN_MODE="log"
                break
                ;;
            2)
                RUN_MODE="background"
                break
                ;;
            3)
                RUN_MODE="skip"
                break
                ;;
            *)
                echo "Invalid selection. Please enter 1, 2, or 3."
                ;;
        esac
    done
fi

# Process selected run mode
case $RUN_MODE in
    log)
        echo ""
        echo "Starting service in log mode..."
        echo "=========================================="
        
        # Return to original directory
        cd "$ORIGINAL_DIR" || {
            echo "Error: Cannot return to original directory."
            exit 1
        }
        
        # Run in log mode
        if [ ! -f "./mcc" ]; then
            echo "Error: Cannot find mcc executable file."
            exit 1
        fi

        run_startup_waves
        check_post_initial
        check_nexus_eula

        # Attach to the whole stack only after every wave is up (Ctrl+C to detach;
        # containers keep running)
        echo ""
        echo "All services started. Attaching to logs (Ctrl+C to stop following)..."
        ./mcc infra run
        ;;
    background)
        echo ""
        echo "Starting service in background mode..."
        echo "=========================================="
        
        # Return to original directory
        cd "$ORIGINAL_DIR" || {
            echo "Error: Cannot return to original directory."
            exit 1
        }
        
        # Run in background mode
        if [ ! -f "./mcc" ]; then
            echo "Error: Cannot find mcc executable file."
            exit 1
        fi

        echo "Starting service in background..."
        echo "Image download and initial setup in progress..."
        echo ""

        run_startup_waves

        echo ""
        echo "Image download and initial setup completed."
        echo "Monitoring container status..."
        echo ""

        # Container monitoring function -- final sanity check across all waves
        monitor_containers() {
            local all_healthy=false
            local check_count=0
            local max_checks=120  # 20 minutes (120 * 10 seconds)
            # Tracks consecutive Created/Exited sightings per container across
            # loop iterations, so a single restart-cycle blip isn't fatal.
            local -A exit_streak=()

            while [ "$all_healthy" = false ] && [ $check_count -lt $max_checks ]; do
                clear
                echo "=========================================="
                echo "Container Status Monitoring"
                echo "=========================================="
                echo ""

                # Get container status (sorted by name) -- include Created/Exited (-a)
                local container_status=$(docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -E "(mc-|opensearch-)" | sort)

                if [ -n "$container_status" ]; then
                    echo "$container_status"
                else
                    echo "Containers have not started yet..."
                    echo "Image download and initial setup in progress..."
                fi

                echo ""
                echo "=========================================="

                # -a so a container Compose created but never started (aborted
                # graph) is visible instead of looking identical to "not yet pulled"
                local all_containers=$(docker ps -a --format "{{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "(mc-|opensearch-)" | sort)
                local all_expected_running=true
                local unhealthy_count=0
                local running_count=0
                local missing_containers=()
                local failed_containers=()

                # Check if each expected container is running and healthy
                for container in "${EXPECTED_CONTAINERS[@]}"; do
                    local line
                    line=$(echo "$all_containers" | grep "^$container[[:space:]]")

                    if [ -z "$line" ]; then
                        # Not created yet at all -- still pulling/waiting its turn
                        all_expected_running=false
                        missing_containers+=("$container")
                    elif echo "$line" | grep -q "Up"; then
                        exit_streak[$container]=0
                        running_count=$((running_count + 1))

                        # Containers without health check are treated as successful when Up
                        local is_no_health_check=false
                        for no_health_container in "${NO_HEALTH_CHECK_CONTAINERS[@]}"; do
                            if [ "$container" = "$no_health_container" ]; then
                                is_no_health_check=true
                                break
                            fi
                        done

                        if [ "$is_no_health_check" = true ]; then
                            : # Up is success for containers without a health check
                        else
                            if echo "$line" | grep -q "unhealthy\|starting\|restarting"; then
                                unhealthy_count=$((unhealthy_count + 1))
                            fi
                        fi
                    elif echo "$line" | grep -qE "Created|Exited"; then
                        # Could be the graph aborting before start, or a
                        # restart-policy container mid-crash-cycle -- only
                        # treat it as fatal once it's stayed this way across
                        # several polls, unlike "still pulling"
                        all_expected_running=false
                        exit_streak[$container]=$(( ${exit_streak[$container]:-0} + 1 ))
                        if [ "${exit_streak[$container]}" -ge "$EXIT_STREAK_THRESHOLD" ]; then
                            failed_containers+=("$container: $(echo "$line" | awk -F'\t' '{print $2}')")
                        fi
                    fi
                done

                # Display list of containers waiting to start
                if [ ${#missing_containers[@]} -gt 0 ]; then
                    echo ""
                    echo "Containers waiting to start:"
                    printf "  %s\n" "${missing_containers[@]}"
                fi

                # Containers stuck Created/Exited will never recover on their own --
                # stop polling immediately instead of waiting out the full timeout
                if [ ${#failed_containers[@]} -gt 0 ]; then
                    echo ""
                    echo "❌ The following containers failed to start (Compose likely aborted the startup graph):"
                    printf "  %s\n" "${failed_containers[@]}"
                    break
                fi

                # Check if all expected containers are running and healthy
                if [ "$all_expected_running" = true ] && [ "$unhealthy_count" -eq 0 ] && [ "$running_count" -gt 0 ]; then
                    all_healthy=true
                    echo ""
                    echo "🎉 All environments have been set up!"
                    echo ""
                    echo "Final container status:"
                    echo "$container_status"
                    echo ""
                    echo "To access the web console: http://localhost:3001"
                    break
                else
                    echo ""
                    echo "Checking status again in 10 seconds... (${check_count}/${max_checks})"
                    check_count=$((check_count + 1))
                    sleep 10
                fi
            done

            if [ "$all_healthy" = false ]; then
                echo ""
                echo "⚠️  Some containers did not reach healthy status."
                echo "To check status: ./mcc infra info"
                echo "To check logs: docker logs <container_name>"
                return 1
            fi
            return 0
        }

        # Start container monitoring
        monitor_containers
        monitor_exit=$?
        check_post_initial
        check_nexus_eula
        exit $monitor_exit
        ;;
    skip)
        echo ""
        echo "Skipping service execution."
        echo "You can start the service later with './mcc infra run' command."
        ;;
esac

