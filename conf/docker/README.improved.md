# 개선된 MCMP 서비스 구조

## 개요
SSL 인증서 발급과 애플리케이션 서비스를 완전히 분리하여 더 간결하고 효율적인 구조로 개선했습니다.

## 파일 구조
```
conf/docker/
├── docker-compose.cert.yaml     # 1단계: 인증서 발급용 (매우 간결)
├── docker-compose.yaml          # 2단계: 전체 서비스 (인증서 포함)
├── setup-ssl.sh                 # 인증서 발급 스크립트
├── start-full.sh                # 전체 서비스 시작 스크립트
└── README.improved.md           # 이 파일
```

## 개선된 점

### 1. 인증서 발급 단계 (매우 간결)
- **서비스**: nginx + certbot만
- **목적**: SSL 인증서 발급만
- **리소스**: 최소한의 리소스 사용
- **시간**: 빠른 인증서 발급

### 2. 전체 서비스 단계 (완전한 구성)
- **서비스**: 모든 MCMP 서비스 + SSL 적용된 nginx
- **목적**: 완전한 서비스 운영
- **의존성**: 명확한 서비스 간 의존성

## 실행 방법

### 1단계: SSL 인증서 발급
```bash
# 스크립트 실행 권한 부여
chmod +x *.sh

# 환경 변수 설정
export DOMAIN_NAME=your-domain.com

# 인증서 발급
./setup-ssl.sh
```

**포함 서비스:**
- nginx-cert (임시 nginx)
- certbot (인증서 발급)

### 2단계: 전체 서비스 시작
```bash
# 전체 서비스 시작
./start-full.sh
```

**포함 서비스:**
- mcmp-postgres (데이터베이스)
- mc-infra-connector (인프라 커넥터)
- mc-infra-manager (인프라 관리자)
- mc-infra-manager-etcd (인프라 관리자 etcd)
- mc-iam-keycloak (IAM Keycloak)
- mc-iam-manager (IAM 관리자)
- mcmp-nginx (SSL 적용된 최종 nginx)

## 수동 실행 방법

### 인증서 발급만
```bash
docker-compose -f docker-compose.cert.yaml up -d
# 인증서 발급 완료 후
docker-compose -f docker-compose.cert.yaml down
```

### 전체 서비스
```bash
docker-compose -f docker-compose.yaml up -d
```

## 서비스 정리

### 전체 정리
```bash
docker-compose -f docker-compose.yaml down
```

### 인증서 서비스만 정리
```bash
docker-compose -f docker-compose.cert.yaml down
```

## 장점

### 1. 간결성
- **인증서 발급**: 2개 서비스만 (nginx + certbot)
- **명확한 분리**: 인증서 발급과 애플리케이션 서비스 완전 분리

### 2. 효율성
- **리소스 절약**: 인증서 발급 시 불필요한 서비스 실행 안함
- **빠른 실행**: 인증서 발급이 매우 빠름

### 3. 안정성
- **의존성 단순화**: 순환 의존성 문제 완전 해결
- **오류 격리**: 인증서 발급 실패가 애플리케이션에 영향 없음

### 4. 유지보수성
- **명확한 역할**: 각 파일의 역할이 명확
- **독립적 관리**: 각 단계를 독립적으로 관리 가능

## 문제 해결

### 인증서 발급 실패
```bash
# 로그 확인
docker-compose -f docker-compose.cert.yaml logs certbot

# 포트 확인
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### 서비스 시작 실패
```bash
# 로그 확인
docker-compose -f docker-compose.yaml logs

# 인증서 확인
ls -la ./container-volume/certs/live/${DOMAIN_NAME}/
```

## 인증서 갱신
```bash
# 인증서 갱신
docker-compose -f docker-compose.cert.yaml run --rm certbot renew
```

## 접속 정보

### 인증서 발급 중 (1단계)
- HTTP: http://${DOMAIN_NAME} (임시 nginx)

### 전체 서비스 (2단계)
- HTTPS: https://${DOMAIN_NAME}
- Keycloak: https://${DOMAIN_NAME}/auth/
- IAM Manager API: https://${DOMAIN_NAME}/api/
- Infra Manager: http://localhost:1323
- Infra Connector: http://localhost:1024

## 주의사항

1. **순서 준수**: 반드시 1단계 → 2단계 순서로 실행
2. **도메인 설정**: `DOMAIN_NAME` 환경 변수 필수
3. **포트 충돌**: 80, 443 포트 사용 가능 여부 확인
4. **인증서 확인**: 2단계 실행 전 인증서 발급 완료 확인 