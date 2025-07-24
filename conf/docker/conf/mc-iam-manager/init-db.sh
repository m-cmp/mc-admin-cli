#!/bin/bash

# PostgreSQL 초기화 스크립트
echo "Creating databases for MC IAM Manager and Keycloak..."

# 환경변수에서 값 가져오기 (기본값 설정)
DB_USER=${IAM_DB_USER:-mciamdbadmin}
DB_PASSWORD=${IAM_DB_PASSWORD:-mciamdbpassword}
IAM_DB_NAME=${IAM_DB_DATABASE_NAME:-mc_iam_manager_db}
KEYCLOAK_DB_NAME=${KEYCLOAK_DB_DATABASE_NAME:-mc_iam_keycloak_db}
RECREATE_DB=${IAM_DB_RECREATE:-false}

echo "Using environment variables:"
echo "  DB_USER: $DB_USER"
echo "  IAM_DB_NAME: $IAM_DB_NAME"
echo "  KEYCLOAK_DB_NAME: $KEYCLOAK_DB_NAME"
echo "  IAM_DB_RECREATE: $RECREATE_DB"

# 기존 데이터베이스 확인
if [ "$RECREATE_DB" = "false" ]; then
    echo "Checking if databases already exist..."
    
    # postgres 데이터베이스에 연결해서 두 데이터베이스 모두 확인
    if psql -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw "$IAM_DB_NAME" && \
       psql -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw "$KEYCLOAK_DB_NAME"; then
        echo "Both databases ($IAM_DB_NAME and $KEYCLOAK_DB_NAME) already exist. Skipping initialization."
        echo "To force reinitialization, set IAM_DB_RECREATE=true in environment variables."
        exit 0
    else
        echo "One or both databases are missing. Proceeding with initialization..."
    fi
fi

echo "Initializing databases..."

# Keycloak 데이터베이스 생성 (postgres 데이터베이스에 연결해서 생성)
psql -U $DB_USER -d postgres -c "CREATE DATABASE \"$KEYCLOAK_DB_NAME\";"
psql -U $DB_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$KEYCLOAK_DB_NAME\" TO $DB_USER;"

# MC IAM Manager 데이터베이스 권한 확인/설정
psql -U $DB_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$IAM_DB_NAME\" TO $DB_USER;"

echo "Databases created successfully!" 

