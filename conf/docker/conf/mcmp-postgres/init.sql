-- PostgreSQL 초기화 스크립트
-- MC-IAM-Manager용 데이터베이스 생성
CREATE DATABASE mciam;

-- Keycloak용 데이터베이스 생성
CREATE DATABASE keycloak;

-- 권한 설정
GRANT ALL PRIVILEGES ON DATABASE mciam TO mcmpadmin;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO mcmpadmin;

-- 연결 확인
\c mciam;
\c keycloak; 