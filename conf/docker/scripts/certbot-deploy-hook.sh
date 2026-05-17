#!/bin/bash
# certbot deploy hook — reload mc-iam-manager-nginx after certificate renewal.
#
# Install once:
#   sudo cp conf/docker/scripts/certbot-deploy-hook.sh \
#            /etc/letsencrypt/renewal-hooks/deploy/reload-nginx-docker.sh
#   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx-docker.sh
docker exec mc-iam-manager-nginx nginx -s reload 2>/dev/null \
  && echo "[certbot-deploy] mc-iam-manager-nginx reloaded successfully" \
  || echo "[certbot-deploy] WARNING: failed to reload mc-iam-manager-nginx (container may not be running)"
