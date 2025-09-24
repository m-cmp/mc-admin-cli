#!/bin/bash

# MC-IAM-Manager 초기화 모드 설정 스크립트

# 스크립트 시작 시 현재 위치 저장
ORIGINAL_DIR="$(pwd)"

echo "=========================================="
echo "MC-IAM-Manager Initialization"
echo "=========================================="
echo ""

# 필수 컨테이너 상태 체크
echo "----------------------------------------"
echo "  Required Container Health Check"
echo "----------------------------------------"
echo "필수 컨테이너 상태를 확인하고 있습니다..."
echo ""

REQUIRED_CONTAINERS=("mc-iam-manager-db" "mc-iam-manager-kc")
ALL_HEALTHY=true

for container in "${REQUIRED_CONTAINERS[@]}"; do
    echo -n "체크 중: $container ... "
    
    # 컨테이너가 존재하는지 확인
    if ! docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
        echo "❌ 컨테이너가 실행되지 않았습니다."
        ALL_HEALTHY=false
        continue
    fi
    
    # 컨테이너 상태 확인
    container_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)
    
    if [ "$container_status" = "healthy" ]; then
        echo "✅ 정상"
    elif [ "$container_status" = "starting" ]; then
        echo "⏳ 시작 중..."
        ALL_HEALTHY=false
    elif [ "$container_status" = "unhealthy" ]; then
        echo "❌ 비정상"
        ALL_HEALTHY=false
    else
        echo "❓ 상태 확인 불가 ($container_status)"
        ALL_HEALTHY=false
    fi
done

echo ""

if [ "$ALL_HEALTHY" = false ]; then
    echo "❌ 필수 컨테이너가 모두 정상 상태가 아닙니다."
    echo "다음 컨테이너들이 정상적으로 구동된 후 다시 시도해주세요:"
    # echo "  - mc-iam-manager"
    echo "  - mc-iam-manager-db"
    echo "  - mc-iam-manager-kc"
    echo ""
    echo "컨테이너 상태 확인: docker ps"
    echo "컨테이너 로그 확인: docker logs [컨테이너명]"
    exit 1
fi

echo "✅ 모든 필수 컨테이너가 정상 상태입니다."
echo "초기화를 진행할 수 있습니다..."
echo ""

echo "------------------------------------------------"
echo "  MC-IAM-Manager Initialization Mode Selection"
echo "------------------------------------------------"
echo "MC-IAM-Manager 초기화는 두 가지 모드로 진행할 수 있습니다:"
echo ""
echo "[전체 초기화 - 자동 모드]"
echo "  - 모든 초기화 작업이 자동으로 순차 진행"
echo "  - 플랫폼 어드민 초기화"
echo "  - 로그인 및 인증 토큰 발급"
echo "  - 사전 정의된 역할 생성 (admin, operator, viewer 등)"
echo "  - 메뉴 데이터 초기화"
echo "  - API 리소스 데이터 초기화"
echo "  - 프로젝트 동기화 및 워크스페이스 매핑"
echo "  - 빠르고 편리한 일괄 설정"
echo ""
echo "[부분 초기화 - 수동 모드]"
echo "  - 초기화 가능한 작업 목록을 사용자가 선택"
echo "  - 각 단계별로 개별 실행 가능"
echo "  - 상세한 진행 상황 확인"
echo "  - 특정 기능만 선택적으로 초기화"
echo "  - 문제 발생 시 단계별 디버깅 가능"
echo ""
echo "=============================================================="


# 사용자 선택 입력
while true; do
    echo -n "어떤 초기화 모드를 선택하시겠습니까? (1: 전체 초기화, 2: 부분 초기화): "
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo "전체 초기화-자동 모드를 선택하셨습니다."
            echo "모든 초기화 작업이 자동으로 순차 진행됩니다..."
            echo ""
            
            cd "$ORIGINAL_DIR"
            ./mcc infra run -s mc-iam-manager-post-initial
            # # 전체 초기화 스크립트 실행
            # cd ../conf/docker/conf/mc-iam-manager/ || {
            #     echo "오류: mc-iam-manager 디렉토리를 찾을 수 없습니다."
            #     cd "$ORIGINAL_DIR"
            #     exit 1
            # }
            
            # if [ -f "1_setup_auto.sh" ]; then
            #     chmod +x 1_setup_auto.sh
            #     ./1_setup_auto.sh
            #     if [ $? -eq 0 ]; then
            #         echo ""
            #         echo "✓ 전체 초기화가 완료되었습니다."
            #         echo "MC-IAM-Manager가 정상적으로 설정되었습니다."
            #     else
            #         echo ""
            #         echo "❌ 전체 초기화 중 오류가 발생했습니다."
            #         cd "$ORIGINAL_DIR"
            #         exit 1
            #     fi
            # else
            #     echo "오류: 1_setup_auto.sh 파일을 찾을 수 없습니다."
            #     cd "$ORIGINAL_DIR"
            #     exit 1
            # fi
            
            break
            ;;
        2)
            echo ""
            echo "부분 초기화-수동 모드를 선택하셨습니다."
            echo "초기화 가능한 작업 목록에서 원하는 항목을 선택하세요..."
            echo ""
            
            # 부분 초기화 스크립트 실행
            cd ../conf/docker/conf/mc-iam-manager/ || {
                echo "오류: mc-iam-manager 디렉토리를 찾을 수 없습니다."
                cd "$ORIGINAL_DIR"
                exit 1
            }
            
            if [ -f "1_setup_manual.sh" ]; then
                chmod +x 1_setup_manual.sh
                ./1_setup_manual.sh
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ 부분 초기화가 완료되었습니다."
                    echo "선택한 초기화 작업이 정상적으로 수행되었습니다."
                else
                    echo ""
                    echo "❌ 부분 초기화 중 오류가 발생했습니다."
                    cd "$ORIGINAL_DIR"
                    exit 1
                fi
            else
                echo "오류: 1_setup_manual.sh 파일을 찾을 수 없습니다."
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

# 모든 초기화 작업 완료 후 원래 위치로 돌아가기
cd "$ORIGINAL_DIR"

echo ""
echo "======================================================"
echo "초기화 작업이 완료되었습니다!"
echo "MC-IAM-Manager가 정상적으로 설정되었습니다."
echo "======================================================"

