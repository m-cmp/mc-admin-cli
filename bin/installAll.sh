#!/bin/bash

# MC-IAM-Manager 모드 설정 스크립트

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

# 서비스 실행 여부 확인
echo ""
while true; do
    echo -n "./mcc infra run을 실행하여 서비스를 실행하겠습니까? (y/n): "
    read -r run_choice
    
    case $run_choice in
        [Yy])
            echo ""
            echo "서비스를 시작합니다..."
            echo "=========================================="
            
            # 원래 위치로 돌아가기
            cd "$ORIGINAL_DIR" || {
                echo "오류: 원래 디렉토리로 돌아갈 수 없습니다."
                exit 1
            }
            
            # mcc infra run 실행
            if [ -f "./mcc" ]; then
                ./mcc infra run
            else
                echo "오류: mcc 실행 파일을 찾을 수 없습니다."
                exit 1
            fi
            break
            ;;
        [Nn])
            echo ""
            echo "서비스 실행을 건너뜁니다."
            echo "나중에 './mcc infra run' 명령으로 서비스를 시작할 수 있습니다."
            break
            ;;
        *)
            echo "잘못된 선택입니다. y 또는 n을 입력해주세요."
            ;;
    esac
done

