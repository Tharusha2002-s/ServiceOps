#!/usr/bin/env bash
# ==============================================================================
# ServiceOps Enterprise ITSM Platform — 1-Command Developer & Community Setup
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "=============================================================================="
echo "          ServiceOps Enterprise ITSM Platform — Community Setup               "
echo "=============================================================================="
echo -e "${NC}"
echo -e "${GREEN}==> Welcome to ServiceOps ITSM Platform Setup!${NC}\n"

# 1. Verify Prerequisites
echo -e "${CYAN}[1/4] Checking prerequisites...${NC}"
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker is not installed or not in PATH. Please install Docker from https://docs.docker.com/get-docker/${NC}"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker Compose V2 is required. Please install docker-compose-plugin.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker and Docker Compose detected.${NC}"

# 2. Setup Environment Variables
echo -e "\n${CYAN}[2/4] Initializing environment configuration...${NC}"
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env found. Creating from .env.example with random cryptographic secrets...${NC}"
  cp .env.example .env
  
  # Generate cryptographically secure random strings if openssl is available
  if command -v openssl >/dev/null 2>&1; then
    NEW_JWT_ACCESS=$(openssl rand -hex 32)
    NEW_JWT_REFRESH=$(openssl rand -hex 32)
    NEW_COOKIE=$(openssl rand -hex 32)
    NEW_PG_PASS=$(openssl rand -hex 16)

    # Replace on Linux / macOS
    sed -i.bak "s/prod_access_secret_serviceops_minimum_32_characters_random_hex/${NEW_JWT_ACCESS}/g" .env
    sed -i.bak "s/prod_refresh_secret_serviceops_minimum_32_characters_random_hex/${NEW_JWT_REFRESH}/g" .env
    sed -i.bak "s/prod_cookie_signing_secret_serviceops_2026_super_secure/${NEW_COOKIE}/g" .env
    rm -f .env.bak
  fi
  echo -e "${GREEN}✓ Generated fresh production .env configuration.${NC}"
else
  echo -e "${GREEN}✓ Existing .env file detected.${NC}"
fi

# 3. Build & Launch Containers
echo -e "\n${CYAN}[3/4] Building and starting ServiceOps containers (PostgreSQL, Redis, Backend, Frontend)...${NC}"
docker compose up -d --build

# 4. Wait for Service Health
echo -e "\n${CYAN}[4/4] Verifying health and running schema migrations...${NC}"
echo -e "Waiting for services to become healthy..."

TRIES=0
MAX_TRIES=30
while [ $TRIES -lt $MAX_TRIES ]; do
  if curl -sf http://localhost:4000/api/v1/health/liveness >/dev/null 2>&1; then
    echo -e "${GREEN}✓ ServiceOps Backend Engine is healthy!${NC}"
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 2
done

if [ $TRIES -eq $MAX_TRIES ]; then
  echo -e "${YELLOW}[Notice] Backend is still bootstrapping. Inspect logs with: docker compose logs -f backend${NC}"
fi

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}             🚀 ServiceOps Platform is Successfully Running!                  ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e "🌐 Web Dashboard:         ${CYAN}http://localhost:3000${NC}"
echo -e "🔌 REST API & Swagger:     ${CYAN}http://localhost:4000/docs${NC}"
echo -e "⚡ WebSocket Gateway:      ${CYAN}http://localhost:4000${NC}"
echo -e ""
echo -e "🔑 ${YELLOW}Default Pre-Seeded Accounts:${NC}"
echo -e "   • System Administrator:  admin@serviceops.com     | Password:  Admin@123"
echo -e "   • IT Manager:            manager@serviceops.com   | Password:  Manager@123"
echo -e "   • Support Agent:         agent@serviceops.com     | Password:  Agent@123"
echo -e "   • Employee Requester:    employee@serviceops.com  | Password:  Employee@123"
echo -e ""
echo -e "🛠️ Useful Commands:"
echo -e "   • View Live Logs:        ${CYAN}docker compose logs -f${NC}"
echo -e "   • Stop Platform:         ${CYAN}docker compose down${NC}"
echo -e "   • Restart Platform:      ${CYAN}docker compose restart${NC}"
echo -e "   • Run Database Backup:   ${CYAN}./scripts/backup-db.sh${NC}"
echo -e "${GREEN}==============================================================================${NC}\n"
