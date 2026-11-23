#!/usr/bin/env bash
# ==============================================================================
# ServiceOps Enterprise ITSM Platform — Production DevOps Deployment Script
# Targets: Ubuntu 20.04 / 22.04 LTS, Debian 11/12, CentOS/RHEL 9
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}      ServiceOps Production DevOps Automated Deployment Engine               ${NC}"
echo -e "${CYAN}==============================================================================${NC}\n"

# 1. Environment Verification
if [ ! -f .env ]; then
  echo -e "${RED}[ERROR] .env file not found!${NC}"
  echo -e "Please create a production .env file: cp .env.example .env && nano .env"
  exit 1
fi

echo -e "${GREEN}[1/5] Validating production environment settings...${NC}"
source .env

if [ "${JWT_ACCESS_SECRET:-}" = "prod_access_secret_serviceops_minimum_32_characters_random_hex" ]; then
  echo -e "${YELLOW}[WARNING] Default JWT_ACCESS_SECRET detected in .env! Generating secure replacement...${NC}"
  NEW_SECRET=$(openssl rand -hex 32)
  sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${NEW_SECRET}/" .env
fi

# 2. Pull latest code if git repo
echo -e "\n${GREEN}[2/5] Checking Git repository status...${NC}"
if [ -d .git ]; then
  echo "Pulling latest upstream changes on current branch..."
  git pull --ff-only || echo -e "${YELLOW}Notice: git pull failed or local edits present, continuing with local files.${NC}"
fi

# 3. Build & Launch Production Stack
echo -e "\n${GREEN}[3/5] Deploying Production Stack (Nginx + Backend + Frontend + Postgres + Redis + Prometheus + Grafana)...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans

# 4. Health Check Verification
echo -e "\n${GREEN}[4/5] Running zero-downtime health verification...${NC}"
TRIES=0
MAX_TRIES=20
HEALTHY=0

while [ $TRIES -lt $MAX_TRIES ]; do
  if curl -sf http://localhost/api/v1/health/liveness >/dev/null 2>&1 || \
     curl -sf http://localhost:4000/api/v1/health/liveness >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 3
done

if [ $HEALTHY -eq 1 ]; then
  echo -e "${GREEN}✓ Production services are live and passing health checks!${NC}"
else
  echo -e "${RED}[WARNING] Health check timed out. Inspecting container logs:${NC}"
  docker compose logs --tail=50 backend
  exit 1
fi

# 5. Clean up dangling builder caches & Setup cron backup
echo -e "\n${GREEN}[5/5] Performing post-deployment maintenance...${NC}"
docker image prune -f >/dev/null 2>&1 || true

# Check if cron job for backup exists
CRON_JOB="0 2 * * * cd $(pwd) && ./scripts/backup-db.sh >> ./backups/backup.log 2>&1"
if command -v crontab >/dev/null 2>&1; then
  if ! crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
    echo "Installing automated 02:00 AM daily PostgreSQL backup cron..."
    (crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -
    echo -e "${GREEN}✓ Automated daily backup cron installed.${NC}"
  else
    echo -e "${GREEN}✓ Automated backup cron already active.${NC}"
  fi
fi

echo -e "\n${CYAN}==============================================================================${NC}"
echo -e "${GREEN}  🎉 Deployment Succeeded! ServiceOps is live on port 80/443 (via Nginx).     ${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo -e "Production URL:       http://${DOMAIN_NAME:-localhost}"
echo -e "API Documentation:    http://${DOMAIN_NAME:-localhost}/api/v1"
echo -e "Grafana Monitoring:   http://${DOMAIN_NAME:-localhost}:3001"
echo -e "Cryptographic Audit:  http://${DOMAIN_NAME:-localhost}/api/v1/audit/verify"
echo -e "${CYAN}==============================================================================${NC}\n"
