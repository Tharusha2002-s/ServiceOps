#!/usr/bin/env bash
set -euo pipefail

# ServiceOps Automated PostgreSQL Backup Script
# Retention defaults to 14 daily backups.

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-serviceops-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-serviceops_db}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${BACKUP_DIR}/serviceops_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[ServiceOps Backup] Dumping ${DB_NAME} from ${CONTAINER_NAME}..."
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${OUT_FILE}"
elif [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "${DATABASE_URL}" --clean --if-exists | gzip > "${OUT_FILE}"
else
  echo "[ServiceOps Backup] Error: Neither running container '${CONTAINER_NAME}' nor DATABASE_URL is available." >&2
  exit 1
fi

echo "[ServiceOps Backup] Created ${OUT_FILE} ($(du -h "${OUT_FILE}" | cut -f1))"
find "${BACKUP_DIR}" -name "serviceops_${DB_NAME}_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete
echo "[ServiceOps Backup] Pruning complete (retained last ${RETENTION_DAYS} days)."

