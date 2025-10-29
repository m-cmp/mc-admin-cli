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
    echo "                              dev:  Developer mode with local authentication"
    echo "                              prod: Production mode with CA authentication"
    echo "  -r, --run <RUN_MODE>        Service run mode (log|background|skip)"
    echo "                              log:        Run with log mode"
    echo "                              background: Run in background with monitoring"
    echo "                              skip:       Skip execution"
    echo "  -h, --help                  Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -m dev -r background     # Configure dev mode and run in background"
    echo "  $0 --mode prod --run skip   # Configure production mode without running"
    echo "  $0                          # Interactive mode (run without parameters)"
    exit 1
}

# =============================================================================
# Parameter Parsing
# =============================================================================
IAM_MODE=""
RUN_MODE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            IAM_MODE="$2"
            shift 2
            ;;
        -r|--run)
            RUN_MODE="$2"
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
    "mc-observability-minio"
    "mc-observability-grafana"
    "mc-observability-insight"
    "mc-observability-insight-scheduler"
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
)

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
    echo "  - Uses self-signed certificates"
    echo "  - Optimized for local development environment"
    echo "  - Adds domain to hosts file"
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

# Process selected mode
case $IAM_MODE in
    dev)
        echo ""
        echo "You have selected Developer Mode - Local Authentication."
        echo "Generating self-signed certificate and configuring local environment..."
        echo ""
        
        # Execute developer mode script
        cd ../conf/docker/conf/mc-iam-manager/ || {
            echo "Error: Cannot find mc-iam-manager directory."
            cd "$ORIGINAL_DIR"
            exit 1
        }
        
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
        if [ -f "./mcc" ]; then
            ./mcc infra run || true
        else
            echo "Error: Cannot find mcc executable file."
            exit 1
        fi
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
        if [ -f "./mcc" ]; then
            echo "Starting service in background..."
            echo "Image download and initial setup in progress..."
            echo ""
            
            # Run in background but show initial logs
            ./mcc infra run -d
            
            echo ""
            echo "Image download and initial setup completed."
            echo "Monitoring container status..."
            echo ""
            
            # Container monitoring function
            monitor_containers() {
                local all_healthy=false
                local check_count=0
                local max_checks=120  # 20 minutes (120 * 10 seconds)
                
                while [ "$all_healthy" = false ] && [ $check_count -lt $max_checks ]; do
                    clear
                    echo "=========================================="
                    echo "Container Status Monitoring"
                    echo "=========================================="
                    echo ""
                    
                    # Get container status (sorted by name)
                    local container_status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(mc-|opensearch-)" | sort)
                    
                    if [ -n "$container_status" ]; then
                        echo "$container_status"
                    else
                        echo "Containers have not started yet..."
                        echo "Image download and initial setup in progress..."
                    fi
                    
                    echo ""
                    echo "=========================================="
                    
                    # Check currently running container status (including mc- and opensearch-)
                    local running_containers=$(docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "(mc-|opensearch-)" | sort)
                    local all_expected_running=true
                    local unhealthy_count=0
                    local running_count=0
                    local missing_containers=()
                    
                    # Check if each expected container is running and healthy
                    for container in "${EXPECTED_CONTAINERS[@]}"; do
                        if echo "$running_containers" | grep -q "^$container"; then
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
                                # Containers without health check are successful if Up
                                if echo "$running_containers" | grep "^$container" | grep -q "Up"; then
                                    # Success (just increment count)
                                    :
                                else
                                    unhealthy_count=$((unhealthy_count + 1))
                                fi
                            else
                                # Containers with health check verify healthy status
                                if echo "$running_containers" | grep "^$container" | grep -q "unhealthy\|starting\|restarting"; then
                                    unhealthy_count=$((unhealthy_count + 1))
                                fi
                            fi
                        else
                            all_expected_running=false
                            missing_containers+=("$container")
                        fi
                    done
                    
                    # Display list of containers waiting to start
                    if [ ${#missing_containers[@]} -gt 0 ]; then
                        echo ""
                        echo "Containers waiting to start:"
                        printf "  %s\n" "${missing_containers[@]}"
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
                fi
            }
            
            # Start container monitoring
            monitor_containers
            
        else
            echo "Error: Cannot find mcc executable file."
            exit 1
        fi
        ;;
    skip)
        echo ""
        echo "Skipping service execution."
        echo "You can start the service later with './mcc infra run' command."
        ;;
esac

