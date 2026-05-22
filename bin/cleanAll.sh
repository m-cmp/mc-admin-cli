#!/bin/bash

# Warning message and user confirmation
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

# Delete all Docker images
echo "All Docker images deleting..."
if [ -n "$(docker images -q)" ]; then
  echo "docker rmi \$(docker images -q) -f"
  docker rmi $(docker images -q) -f
else
  echo "The docker image to delete does not exist."
  echo "All docker images have already been deleted."
fi

echo
# Stop and delete all containers
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
# Clean up all unused Docker system resources (images, containers, networks, build cache)
echo "Cleaning up all unused Docker system resources (images, containers, networks, build cache)..."
echo "docker system prune -a -f"
docker system prune -a -f

echo
# Delete all volumes
echo "Deleting all Docker volumes..."
if [ -n "$(docker volume ls -q)" ]; then
  echo "docker volume rm \$(docker volume ls -q)"
  docker volume rm $(docker volume ls -q)
else
  echo "No volumes to delete."
fi

echo
# Delete all networks (unused networks only)
echo "docker network prune -f"
docker network prune -f

echo
# Force delete all custom networks
echo "Deleting all custom Docker networks..."
if [ -n "$(docker network ls --filter type=custom -q)" ]; then
  echo "docker network rm \$(docker network ls --filter type=custom -q)"
  docker network rm $(docker network ls --filter type=custom -q) 2>/dev/null || true
else
  echo "No custom networks to delete."
fi


echo
# Clean up Docker Compose resources (if docker-compose.yaml exists)
echo "Cleaning up Docker Compose resources..."
if [ -f "../conf/docker/docker-compose.yaml" ]; then
  echo "cd ../conf/docker && docker-compose down -v --remove-orphans"
  cd ../conf/docker && docker-compose down -v --remove-orphans 2>/dev/null || true
  cd - > /dev/null
fi

echo
# Delete container-volume directories (host mount points)
echo "Deleting container-volume directories..."
if [ -d "../conf/docker/container-volume" ]; then
  echo "sudo rm -rf ../conf/docker/container-volume"
  sudo rm -rf ../conf/docker/container-volume
  echo "container-volume directories deleted successfully."
else
  echo "container-volume directory does not exist."
fi

echo
# Delete mc-iam-manager configuration files
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
# Display Docker system resource information
echo "docker system df"
docker system df

echo
# Restart Docker daemon (optional - commented out)
# echo "Restarting Docker daemon..."
# sudo systemctl restart docker
# sleep 5

echo
# Check status after cleanup
echo "=== Cleanup Status ==="
echo "Remaining images: $(docker images -q | wc -l)"
echo "Remaining containers: $(docker ps -aq | wc -l)"
echo "Remaining volumes: $(docker volume ls -q | wc -l)"
echo "Remaining networks: $(docker network ls -q | wc -l)"
echo "====================="

