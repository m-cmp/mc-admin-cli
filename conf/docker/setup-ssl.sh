#!/bin/bash

# SSL 인증서 발급 스크립트
# nginx와 certbot만 사용하여 인증서를 발급받습니다.

set -e

echo "=== SSL 인증서 발급 ==="
echo ""

# .env 파일 로드
if [ -f ".env" ]; then
    echo "환경 변수 파일(.env) 로드 중..."
    export $(grep -v '^#' .env | xargs)
    echo "환경 변수 로드 완료"
    echo ""
fi

# 환경 변수 확인
if [ -z "$DOMAIN_NAME" ]; then
    echo "오류: DOMAIN_NAME 환경 변수가 설정되지 않았습니다."
    echo "export DOMAIN_NAME=your-domain.com 을 실행하거나 .env 파일을 확인하세요."
    echo ""
    echo "현재 디렉토리에 .env 파일을 생성하고 다음 내용을 추가하세요:"
    echo "DOMAIN_NAME=mcmp.cloudcon.com"
    exit 1
fi

echo "도메인: $DOMAIN_NAME"
echo ""

# 포트 확인
echo "포트 80, 443 사용 가능 여부 확인 중..."
if netstat -tulpn | grep -q ":80 "; then
    echo "오류: 포트 80이 이미 사용 중입니다."
    exit 1
fi

if netstat -tulpn | grep -q ":443 "; then
    echo "오류: 포트 443이 이미 사용 중입니다."
    exit 1
fi

echo "포트 확인 완료"
echo ""

# 인증서 발급
echo "1. 임시 nginx와 certbot 시작..."
docker-compose -f docker-compose.cert.yaml up -d

echo ""
echo "2. 인증서 발급 대기 중... (최대 5분)"
for i in {1..30}; do
    if docker-compose -f docker-compose.cert.yaml logs certbot | grep -q "Congratulations"; then
        echo "✅ 인증서 발급 완료!"
        break
    elif docker-compose -f docker-compose.cert.yaml logs certbot | grep -q "error"; then
        echo "❌ 인증서 발급 실패"
        echo "로그 확인: docker-compose -f docker-compose.cert.yaml logs certbot"
        exit 1
    fi
    echo "대기 중... ($i/30)"
    sleep 10
done

echo ""
echo "3. 임시 서비스 정리..."
docker-compose -f docker-compose.cert.yaml down

echo ""
echo "✅ SSL 인증서 발급이 완료되었습니다!"
echo ""
echo "다음 명령어로 전체 서비스를 시작할 수 있습니다:"
echo "  docker-compose -f docker-compose.yaml up -d"
echo "" 