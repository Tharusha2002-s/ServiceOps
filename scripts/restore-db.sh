#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ServiceOps Automated PostgreSQL Database Restore Script
# Usage: ./scripts/restore-db.sh [path-to-backup.sql.gz]
# ==============================================================================

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

CONTAINER_NAME="${POSTGRES_CONTAINER:-serviceops-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-serviceops_db}"

if [ -z "${1:-}" ]; then
  echo -e "${RED}[ERROR] Backup file path is required!${NC}"
  echo "Usage: ./scripts/restore-db.sh ./backups/postgres/serviceops_db_20261123T000000Z.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo -e "${RED}[ERROR] File '${BACKUP_FILE}' not found!${NC}"
  exit 1
fi

echo -e "${CYAN}[ServiceOps Restore] Restoring ${DB_NAME} from ${BACKUP_FILE}...${NC}"

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Decompressing and streaming backup into container '${CONTAINER_NAME}'..."
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
  echo -e "${GREEN}✓ Database restore completed successfully via Docker!${NC}"
elif [ -n "${DATABASE_URL:-}" ]; then
  echo "Decompressing and streaming backup via DATABASE_URL..."
  gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"
  echo -e "${GREEN}✓ Database restore completed successfully via direct connection!${NC}"
else
  echo -e "${RED}[ERROR] Neither running container '${CONTAINER_NAME}' nor DATABASE_URL is available.${NC}" >&2
  exit 1
fi
