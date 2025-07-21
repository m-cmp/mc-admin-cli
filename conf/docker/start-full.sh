#!/bin/bash

# 전체 MCMP 서비스 시작 스크립트
# SSL 인증서 발급 완료 후 사용하세요.

set -e

echo "=== 전체 MCMP 서비스 시작 ==="
echo ""

# .env 파일 로드
if [ -f ".env" ]; then
    echo "환경 변수 파일(.env) 로드 중..."
    export $(grep -v '^#' .env | xargs)
    echo "환경 변수 로드 완료"
    echo ""
fi

# SSL 인증서 확인
echo "SSL 인증서 확인 중..."
if [ ! -f "./container-volume/certs/live/${DOMAIN_NAME:-localhost}/fullchain.pem" ]; then
    echo "❌ SSL 인증서가 발급되지 않았습니다."
    echo ""
    echo "먼저 다음 명령어로 SSL 인증서를 발급하세요:"
    echo "  ./setup-ssl.sh"
    echo ""
    echo "또는 수동으로:"
echo "  docker compose -f docker-compose.cert.yaml up -d"
echo "  # 인증서 발급 완료 후"
echo "  docker compose -f docker-compose.cert.yaml down"
    exit 1
fi

echo "✅ SSL 인증서 확인 완료"
echo ""

# 전체 서비스 시작
echo "전체 MCMP 서비스 시작 중..."
echo "- PostgreSQL, MC-Infra-Connector, MC-Infra-Manager"
echo "- MC-IAM-Keycloak, MC-IAM-Manager, Nginx (SSL 적용)"

docker compose -f docker-compose.yaml up -d

echo ""
echo "서비스 시작 완료. 상태 확인 중..."
sleep 10

# 서비스 상태 확인
echo "서비스 상태:"
docker compose -f docker-compose.yaml ps

echo ""
echo "✅ 모든 서비스가 시작되었습니다!"
echo ""
echo "접속 정보:"
echo "- HTTP:  http://${DOMAIN_NAME:-localhost}"
echo "- HTTPS: https://${DOMAIN_NAME:-localhost}"
echo "- Keycloak: https://${DOMAIN_NAME:-localhost}/auth/"
echo "- IAM Manager API: https://${DOMAIN_NAME:-localhost}/api/"
echo "- Infra Manager: http://localhost:1323"
echo "- Infra Connector: http://localhost:1024"
echo "" 