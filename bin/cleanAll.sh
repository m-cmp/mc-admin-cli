#!/bin/bash

# 경고 메시지 및 사용자 확인
cat <<EOF
[WARNING]
This shell script will delete ALL Docker images, containers, volumes, networks, and also remove all container-volume directories used for persistent data.
This is intended to reset your environment to a clean state.
Are you sure you want to continue? (y/n)
EOF
read -r answer
if [[ ! "$answer" =~ ^[Yy]$ ]]; then
  echo "Aborted by user."
  exit 1
fi

# 모든 Docker 이미지 삭제
echo "All Docker images deleting..."
if [ -n "$(docker images -q)" ]; then
  echo "docker rmi \$(docker images -q) -f"
  docker rmi $(docker images -q) -f
else
  echo "The docker image to delete does not exist."
  echo "All docker images have already been deleted."
fi

echo
# 모든 컨테이너 중지 및 삭제
echo "Stopping and deleting all Docker containers..."
if [ -n "$(docker ps -aq)" ]; then
  echo "docker stop \$(docker ps -aq)"
  docker stop $(docker ps -aq)
  echo "docker rm \$(docker ps -aq)"
  docker rm $(docker ps -aq)
else
  echo "No containers to stop or delete."
fi

echo
# 모든 사용되지 않는 Docker 시스템 리소스 정리 (이미지, 컨테이너, 네트워크, 빌드 캐시)
echo "Cleaning up all unused Docker system resources (images, containers, networks, build cache)..."
echo "docker system prune -a -f"
docker system prune -a -f

echo
# 모든 볼륨 삭제
echo "Deleting all Docker volumes..."
if [ -n "$(docker volume ls -q)" ]; then
  echo "docker volume rm \$(docker volume ls -q)"
  docker volume rm $(docker volume ls -q)
else
  echo "No volumes to delete."
fi

echo
# 모든 네트워크 삭제 (사용되지 않는 네트워크만)
echo "docker network prune -f"
docker network prune -f

echo
# 모든 사용자 정의 네트워크 강제 삭제
echo "Deleting all custom Docker networks..."
if [ -n "$(docker network ls --filter type=custom -q)" ]; then
  echo "docker network rm \$(docker network ls --filter type=custom -q)"
  docker network rm $(docker network ls --filter type=custom -q) 2>/dev/null || true
else
  echo "No custom networks to delete."
fi


echo
# Docker Compose 정리 (만약 docker-compose.yaml이 있는 경우)
echo "Cleaning up Docker Compose resources..."
if [ -f "../conf/docker/docker-compose.yaml" ]; then
  echo "cd ../conf/docker && docker-compose down -v --remove-orphans"
  cd ../conf/docker && docker-compose down -v --remove-orphans 2>/dev/null || true
  cd - > /dev/null
fi

echo
# container-volume 폴더 삭제 (호스트 마운트 포인트)
echo "Deleting container-volume directories..."
if [ -d "../conf/docker/container-volume" ]; then
  echo "sudo rm -rf ../conf/docker/container-volume"
  sudo rm -rf ../conf/docker/container-volume
  echo "container-volume directories deleted successfully."
else
  echo "container-volume directory does not exist."
fi

echo
# mc-iam-manager 설정 파일들 삭제
echo "Deleting mc-iam-manager configuration files..."
files_to_delete=(
  "../conf/docker/conf/mc-iam-manager/api.yaml"
  "../conf/docker/conf/mc-iam-manager/menu.yaml"
  "../conf/docker/conf/mc-iam-manager/nginx.conf"
)

for file in "${files_to_delete[@]}"; do
  if [ -f "$file" ]; then
    echo "rm -f $file"
    rm -f "$file"
    echo "$file deleted successfully."
  else
    echo "$file does not exist."
  fi
done

echo
# Docker 시스템 리소스 정보 표시
echo "docker system df"
docker system df

echo
# Docker 데몬 재시작 (선택사항 - 주석 처리)
# echo "Restarting Docker daemon..."
# sudo systemctl restart docker
# sleep 5

echo
# 정리 완료 후 상태 확인
echo "=== Cleanup Status ==="
echo "Remaining images: $(docker images -q | wc -l)"
echo "Remaining containers: $(docker ps -aq | wc -l)"
echo "Remaining volumes: $(docker volume ls -q | wc -l)"
echo "Remaining networks: $(docker network ls -q | wc -l)"
echo "====================="

