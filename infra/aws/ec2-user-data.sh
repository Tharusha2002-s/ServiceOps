#!/bin/bash
# ==============================================================================
# ServiceOps Enterprise ITSM Platform — AWS EC2 UserData Bootstrap Script
# Target: Ubuntu 22.04 LTS on AWS EC2 (t3.medium or t3.large recommended)
# ==============================================================================
set -euo pipefail

# 1. Update system packages
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git openssl ca-certificates gnupg lsb-release

# 2. Install Docker & Docker Compose Plugin
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Clone ServiceOps repository
INSTALL_DIR="/opt/serviceops"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Pull or clone repository
if [ ! -d ".git" ]; then
  git clone https://github.com/your-org/ServiceOps.git .
fi

# 4. Generate Production Secrets
if [ ! -f ".env" ]; then
  cp .env.example .env
  JWT_ACCESS=$(openssl rand -hex 32)
  JWT_REFRESH=$(openssl rand -hex 32)
  COOKIE_SECRET=$(openssl rand -hex 32)
  PG_PASS=$(openssl rand -hex 16)

  sed -i "s/prod_access_secret_serviceops_minimum_32_characters_random_hex/${JWT_ACCESS}/g" .env
  sed -i "s/prod_refresh_secret_serviceops_minimum_32_characters_random_hex/${JWT_REFRESH}/g" .env
  sed -i "s/prod_cookie_signing_secret_serviceops_2026_super_secure/${COOKIE_SECRET}/g" .env
  sed -i "s/postgres123/${PG_PASS}/g" .env
fi

# 5. Launch Production Stack with Nginx reverse proxy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 6. Setup Daily PostgreSQL Backup Cron (02:00 AM)
CRON_ENTRY="0 2 * * * cd /opt/serviceops && ./scripts/backup-db.sh >> /opt/serviceops/backups/backup.log 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "[ServiceOps AWS Bootstrap] Successfully initialized and running on EC2!"
