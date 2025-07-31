#!/bin/bash

# MC-IAM-Manager 모드 설정 스크립트

# =============================================================================
# 컨테이너 목록 정의 (사용자가 수정 가능)
# =============================================================================

# 예상 실행 컨테이너 목록 (docker-compose.yaml에 정의된 컨테이너들)
EXPECTED_CONTAINERS=(
    "mc-infra-connector"
    "mc-infra-manager"
    "mc-infra-manager-etcd"
    "mc-infra-manager-postgres"
    "mc-iam-manager"
    "mc-iam-manager-db"
    "mc-iam-manager-kc"
    "mc-iam-manager-nginx"
    # "mc-iam-manager-post-initial"  # 실행 후 종료되는 컨테이너
    "mc-cost-optimizer-fe"
    "mc-cost-optimizer-be"
    "mc-cost-optimizer-cost-collector"
    "mc-cost-optimizer-cost-processor"
    "mc-cost-optimizer-cost-selector"
    "mc-cost-optimizer-alarm-service"
    "mc-cost-optimizer-asset-collector"
    "mc-cost-optimizer-db"
    "mc-application-manager-jenkins"
    "mc-application-manager-sonatype-nexus"
    "mc-application-manager"
    "mc-workflow-manager-jenkins"
    "mc-workflow-manager"
    "mc-data-manager"
    "mc-web-console-db"
    "mc-web-console-api"
    "mc-web-console-front"
    "mc-observability-manager"
    "mc-observability-maria"
    "mc-observability-influx"
    "mc-observability-chronograf"
    "mc-observability-kapacitor"
    "opensearch-node1"
    "mc-observability-opensearch-dashboards"
    "mc-observability-insight"
    "mc-observability-insight-scheduler"
    "mc-observability-mcp-grafana"
)

# Health Check가 없는 컨테이너 목록 (Up 상태로 성공 처리)
NO_HEALTH_CHECK_CONTAINERS=(
    "mc-iam-manager-nginx"
    "mc-cost-optimizer-alarm-service"
    "mc-cost-optimizer-asset-collector"
    "mc-cost-optimizer-cost-collector"
    "mc-cost-optimizer-cost-processor"
    "mc-cost-optimizer-cost-selector"
    "mc-observability-mcp-grafana"
)

# =============================================================================

# 스크립트 시작 시 현재 위치 저장
ORIGINAL_DIR="$(pwd)"

echo "=========================================="
echo "MC-IAM-Manager Configuration Mode Selection"
echo "=========================================="
echo ""
echo "MC-IAM-Manager는 두 가지 모드로 구성할 수 있습니다:"
echo ""
echo "[개발자모드-로컬인증]"
echo "  - Self-signed 인증서 사용"
echo "  - 로컬 개발 환경에 최적화"
echo "  - hosts 파일에 도메인 추가"
echo "  - 빠른 설정 및 테스트 가능"
echo ""
echo "[프로덕션모드-CA인증]"
echo "  - Let's Encrypt CA 인증서 사용"
echo "  - 실제 도메인에서 사용"
echo "  - 보안 인증서 기반 HTTPS"
echo "  - 프로덕션 환경에 적합"
echo ""
echo "=========================================="

# 사용자 선택 입력
while true; do
    echo -n "어떤 모드로 구성하시겠습니까? (1: 개발자모드, 2: 프로덕션모드): "
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo "개발자모드-로컬인증을 선택하셨습니다."
            echo "Self-signed 인증서를 생성하고 로컬 환경을 설정합니다..."
            echo ""
            
            # 개발자 모드 스크립트 실행
            cd ../conf/docker/conf/mc-iam-manager/ || {
                echo "오류: mc-iam-manager 디렉토리를 찾을 수 없습니다."
                cd "$ORIGINAL_DIR"
                exit 1
            }
            
            if [ -f "0_preset_dev.sh" ]; then
                chmod +x 0_preset_dev.sh
                ./0_preset_dev.sh
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ 개발자모드 설정이 완료되었습니다."
                    echo "이제 ./mcc infra run을 실행할 수 있습니다."
                else
                    echo ""
                    echo "❌ 개발자모드 설정 중 오류가 발생했습니다."
                    cd "$ORIGINAL_DIR"
                    exit 1
                fi
            else
                echo "오류: 0_preset_dev.sh 파일을 찾을 수 없습니다."
                cd "$ORIGINAL_DIR"
                exit 1
            fi
            
            break
            ;;
        2)
            echo ""
            echo "프로덕션모드-CA인증을 선택하셨습니다."
            echo "Let's Encrypt 인증서를 생성하고 프로덕션 환경을 설정합니다..."
            echo ""
            
            # 프로덕션 모드: 인증서 생성
            echo "1단계: Let's Encrypt 인증서 생성 중..."
            
            # 원래 위치로 돌아가서 mcc 실행
            cd "$ORIGINAL_DIR" || {
                echo "오류: 원래 디렉토리로 돌아갈 수 없습니다."
                exit 1
            }
            
            if [ -f "./mcc" ]; then
                ./mcc infra run -f ../conf/docker/docker-compose.cert.yaml
                if [ $? -eq 0 ]; then
                    echo "✓ 인증서 생성이 완료되었습니다."
                else
                    echo "❌ 인증서 생성 중 오류가 발생했습니다."
                    exit 1
                fi
            else
                echo "오류: mcc 실행 파일을 찾을 수 없습니다."
                exit 1
            fi
            
            echo ""
            echo "2단계: 프로덕션 모드 설정 중..."
            
            # 프로덕션 모드 스크립트 실행
            cd ../conf/docker/conf/mc-iam-manager/ || {
                echo "오류: mc-iam-manager 디렉토리를 찾을 수 없습니다."
                cd "$ORIGINAL_DIR"
                exit 1
            }
            
            if [ -f "0_preset_prod.sh" ]; then
                chmod +x 0_preset_prod.sh
                ./0_preset_prod.sh
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ 프로덕션모드 설정이 완료되었습니다."
                    echo "이제 ./mcc infra run을 실행할 수 있습니다."
                else
                    echo ""
                    echo "❌ 프로덕션모드 설정 중 오류가 발생했습니다."
                    cd "$ORIGINAL_DIR"
                    exit 1
                fi
            else
                echo "오류: 0_preset_prod.sh 파일을 찾을 수 없습니다."
                cd "$ORIGINAL_DIR"
                exit 1
            fi
            
            break
            ;;
        *)
            echo "잘못된 선택입니다. 1 또는 2를 입력해주세요."
            ;;
    esac
done

# 모든 모드 설정 완료 후 원래 위치로 돌아가기
cd "$ORIGINAL_DIR"

echo ""
echo "======================================================"
echo "설정이 완료되었습니다!"
echo "이제 ./mcc infra run을 실행하여 서비스를 시작할 수 있습니다."
echo "======================================================"

# 서비스 실행 모드 선택
echo ""
echo "서비스 실행 모드를 선택하세요:"
echo "1. 로그 모드 - 실시간 로그를 확인하면서 실행"
echo "2. 백그라운드 모드 - 백그라운드에서 실행하고 상태 모니터링"
echo "3. 실행하지 않음"
echo ""

while true; do
    echo -n "실행 모드를 선택하세요 (1/2/3): "
    read -r run_choice
    
    case $run_choice in
        1)
            echo ""
            echo "로그 모드로 서비스를 시작합니다..."
            echo "=========================================="
            
            # 원래 위치로 돌아가기
            cd "$ORIGINAL_DIR" || {
                echo "오류: 원래 디렉토리로 돌아갈 수 없습니다."
                exit 1
            }
            
            # 로그 모드로 실행
            if [ -f "./mcc" ]; then
                ./mcc infra run || true
            else
                echo "오류: mcc 실행 파일을 찾을 수 없습니다."
                exit 1
            fi
            break
            ;;
        2)
            echo ""
            echo "백그라운드 모드로 서비스를 시작합니다..."
            echo "=========================================="
            
            # 원래 위치로 돌아가기
            cd "$ORIGINAL_DIR" || {
                echo "오류: 원래 디렉토리로 돌아갈 수 없습니다."
                exit 1
            }
            
            # 백그라운드 모드로 실행
            if [ -f "./mcc" ]; then
                echo "서비스를 백그라운드에서 시작합니다..."
                echo "이미지 다운로드 및 초기 설정이 진행됩니다..."
                echo ""
                
                # 백그라운드에서 실행하되 초기 로그는 보여주기
                # ./mcc infra run -d -f ../conf/docker/test.yaml
                ./mcc infra run -d
                
                echo ""
                echo "이미지 다운로드 및 초기 설정이 완료되었습니다."
                echo "구동된 컨테이너들의 상태를 모니터링합니다..."
                echo ""
                
                # # 잠시 대기 (이미지 생성 완료 대기)
                # sleep 30
                
                # 상태 모니터링 함수
                monitor_containers() {
                    local all_healthy=false
                    local check_count=0
                    local max_checks=120  # 20분 (120 * 10초)
                    
                    while [ "$all_healthy" = false ] && [ $check_count -lt $max_checks ]; do
                        clear
                        echo "=========================================="
                        echo "컨테이너 상태 모니터링"
                        echo "=========================================="
                        echo ""
                        
                        # 컨테이너 상태 가져오기 (이름 순으로 정렬)
                        local container_status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(mc-|opensearch-)" | sort)
                        
                        if [ -n "$container_status" ]; then
                            echo "$container_status"
                        else
                            echo "컨테이너가 아직 시작되지 않았습니다..."
                            echo "이미지 다운로드 및 초기 설정이 진행 중입니다..."
                        fi
                        
                        echo ""
                        echo "=========================================="
                        
                        # 현재 실행 중인 컨테이너 상태 확인 (mc- 및 opensearch- 포함)
                        local running_containers=$(docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "(mc-|opensearch-)" | sort)
                        local all_expected_running=true
                        local unhealthy_count=0
                        local running_count=0
                        local missing_containers=()
                        
                        # 각 예상 컨테이너가 실행 중이고 healthy한지 확인
                        for container in "${EXPECTED_CONTAINERS[@]}"; do
                            if echo "$running_containers" | grep -q "^$container"; then
                                running_count=$((running_count + 1))
                                
                                # Health Check가 없는 컨테이너는 "Up" 상태로 성공 처리
                                local is_no_health_check=false
                                for no_health_container in "${NO_HEALTH_CHECK_CONTAINERS[@]}"; do
                                    if [ "$container" = "$no_health_container" ]; then
                                        is_no_health_check=true
                                        break
                                    fi
                                done
                                
                                if [ "$is_no_health_check" = true ]; then
                                    # Health Check가 없는 컨테이너는 "Up" 상태면 성공
                                    if echo "$running_containers" | grep "^$container" | grep -q "Up"; then
                                        # 성공 처리 (카운트만 증가)
                                        :
                                    else
                                        unhealthy_count=$((unhealthy_count + 1))
                                    fi
                                else
                                    # Health Check가 있는 컨테이너는 healthy 상태 확인
                                    if echo "$running_containers" | grep "^$container" | grep -q "unhealthy\|starting\|restarting"; then
                                        unhealthy_count=$((unhealthy_count + 1))
                                    fi
                                fi
                            else
                                all_expected_running=false
                                missing_containers+=("$container")
                            fi
                        done
                        
                        # 구동 대기 중인 컨테이너 목록 표시
                        if [ ${#missing_containers[@]} -gt 0 ]; then
                            echo ""
                            echo "구동 대기 중인 컨테이너:"
                            printf "  %s\n" "${missing_containers[@]}"
                        fi
                        
                        # 모든 예상 컨테이너가 실행 중이고 healthy한지 확인
                        if [ "$all_expected_running" = true ] && [ "$unhealthy_count" -eq 0 ] && [ "$running_count" -gt 0 ]; then
                            all_healthy=true
                            echo ""
                            echo "🎉 모든 환경이 구축되었습니다!"
                            echo ""
                            echo "최종 컨테이너 상태:"
                            echo "$container_status"
                            echo ""
                            echo "웹 콘솔에 접속하려면: http://localhost:3001"
                            break
                        else
                            echo ""
                            echo "10초 후 다시 상태를 체크합니다... (${check_count}/${max_checks})"
                            check_count=$((check_count + 1))
                            sleep 10
                        fi
                    done
                    
                    if [ "$all_healthy" = false ]; then
                        echo ""
                        echo "⚠️  일부 컨테이너가 healthy 상태가 되지 않았습니다."
                        echo "상태를 확인하려면: ./mcc infra info"
                        echo "로그를 확인하려면: docker logs <container_name>"
                    fi
                }
                
                # 상태 모니터링 시작
                monitor_containers
                
            else
                echo "오류: mcc 실행 파일을 찾을 수 없습니다."
                exit 1
            fi
            break
            ;;
        3)
            echo ""
            echo "서비스 실행을 건너뜁니다."
            echo "나중에 './mcc infra run' 명령으로 서비스를 시작할 수 있습니다."
            break
            ;;
        *)
            echo "잘못된 선택입니다. 1, 2 또는 3을 입력해주세요."
            ;;
    esac
done

