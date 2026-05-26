#!/bin/bash

# MC-IAM-Manager initialization mode selection script

# Save current directory at script start
ORIGINAL_DIR="$(pwd)"

echo "=========================================="
echo "MC-IAM-Manager Initialization"
echo "=========================================="
echo ""

# Required container health check
echo "----------------------------------------"
echo "  Required Container Health Check"
echo "----------------------------------------"
echo "Checking required container status..."
echo ""

REQUIRED_CONTAINERS=("mc-iam-manager-db" "mc-iam-manager-kc")
ALL_HEALTHY=true

for container in "${REQUIRED_CONTAINERS[@]}"; do
    echo -n "Checking: $container ... "

    # Check if container exists
    if ! docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
        echo "❌ Container is not running."
        ALL_HEALTHY=false
        continue
    fi

    # Check container status
    container_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)

    if [ "$container_status" = "healthy" ]; then
        echo "✅ Healthy"
    elif [ "$container_status" = "starting" ]; then
        echo "⏳ Starting..."
        ALL_HEALTHY=false
    elif [ "$container_status" = "unhealthy" ]; then
        echo "❌ Unhealthy"
        ALL_HEALTHY=false
    else
        echo "❓ Status unknown ($container_status)"
        ALL_HEALTHY=false
    fi
done

echo ""

if [ "$ALL_HEALTHY" = false ]; then
    echo "❌ Not all required containers are healthy."
    echo "Please ensure the following containers are running and healthy, then try again:"
    # echo "  - mc-iam-manager"
    echo "  - mc-iam-manager-db"
    echo "  - mc-iam-manager-kc"
    echo ""
    echo "Check container status: docker ps"
    echo "Check container logs:   docker logs [container-name]"
    exit 1
fi

echo "✅ All required containers are healthy."
echo "Proceeding with initialization..."
echo ""

echo "------------------------------------------------"
echo "  MC-IAM-Manager Initialization Mode Selection"
echo "------------------------------------------------"
echo "MC-IAM-Manager initialization can be performed in two modes:"
echo ""
echo "[Full Initialization - Auto Mode]"
echo "  - All initialization tasks run automatically in sequence"
echo "  - Platform admin initialization"
echo "  - Login and authentication token issuance"
echo "  - Predefined role creation (admin, operator, viewer, etc.)"
echo "  - Menu data initialization"
echo "  - API resource data initialization"
echo "  - Project sync and workspace mapping"
echo "  - Fast and convenient batch setup"
echo ""
echo "[Partial Initialization - Manual Mode]"
echo "  - User selects tasks from the available initialization list"
echo "  - Each step can be executed individually"
echo "  - Detailed progress visibility"
echo "  - Selectively initialize specific features only"
echo "  - Step-by-step debugging when issues occur"
echo ""
echo "=============================================================="


# User mode selection input
while true; do
    echo -n "Which initialization mode would you like? (1: Full initialization, 2: Partial initialization): "
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo "Full initialization - Auto mode selected."
            echo "All initialization tasks will run automatically in sequence..."
            echo ""

            cd "$ORIGINAL_DIR"
            ./mcc infra run -s mc-iam-manager-post-initial
            # # Run full initialization script
            # cd ../conf/docker/conf/mc-iam-manager/ || {
            #     echo "Error: mc-iam-manager directory not found."
            #     cd "$ORIGINAL_DIR"
            #     exit 1
            # }

            # if [ -f "1_setup_auto.sh" ]; then
            #     chmod +x 1_setup_auto.sh
            #     ./1_setup_auto.sh
            #     if [ $? -eq 0 ]; then
            #         echo ""
            #         echo "✓ Full initialization completed."
            #         echo "MC-IAM-Manager has been configured successfully."
            #     else
            #         echo ""
            #         echo "❌ An error occurred during full initialization."
            #         cd "$ORIGINAL_DIR"
            #         exit 1
            #     fi
            # else
            #     echo "Error: 1_setup_auto.sh file not found."
            #     cd "$ORIGINAL_DIR"
            #     exit 1
            # fi
            
            break
            ;;
        2)
            echo ""
            echo "Partial initialization - Manual mode selected."
            echo "Select the desired tasks from the available initialization list..."
            echo ""

            # Run partial initialization script
            cd ../conf/docker/conf/mc-iam-manager/ || {
                echo "Error: mc-iam-manager directory not found."
                cd "$ORIGINAL_DIR"
                exit 1
            }

            if [ -f "1_setup_manual.sh" ]; then
                chmod +x 1_setup_manual.sh
                ./1_setup_manual.sh
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ Partial initialization completed."
                    echo "The selected initialization tasks completed successfully."
                else
                    echo ""
                    echo "❌ An error occurred during partial initialization."
                    cd "$ORIGINAL_DIR"
                    exit 1
                fi
            else
                echo "Error: 1_setup_manual.sh file not found."
                cd "$ORIGINAL_DIR"
                exit 1
            fi
            
            break
            ;;
        *)
            echo "Invalid choice. Please enter 1 or 2."
            ;;
    esac
done

# Return to the original directory after all initialization tasks
cd "$ORIGINAL_DIR"

echo ""
echo "======================================================"
echo "Initialization completed!"
echo "MC-IAM-Manager has been configured successfully."
echo "======================================================"

