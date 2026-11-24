#!/usr/bin/env bash
# ==============================================================================
# ServiceOps Production Post-Deployment DevOps Verification Suite
# ==============================================================================
set -u

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

check_result() {
  local test_name="$1"
  local status="$2"
  local details="${3:-}"
  TOTAL=$((TOTAL + 1))
  if [ "$status" -eq 0 ]; then
    PASSED=$((PASSED + 1))
    echo -e "  [${GREEN} PASS ${NC}] ${BOLD}${test_name}${NC} ${details}"
  else
    FAILED=$((FAILED + 1))
    echo -e "  [${RED} FAIL ${NC}] ${BOLD}${test_name}${NC} ${details}"
  fi
}

echo -e "\n${CYAN}==============================================================================${NC}"
echo -e "${CYAN}${BOLD}       ServiceOps Production AWS DevOps Health & Connectivity Audit           ${NC}"
echo -e "${CYAN}==============================================================================${NC}\n"

# ------------------------------------------------------------------------------
# 1. CONTAINER INTEGRITY CHECK
# ------------------------------------------------------------------------------
echo -e "${YELLOW}─── 1. Docker Containers Status ──────────────────────────────────────────────${NC}"

for container in serviceops-postgres serviceops-redis serviceops-backend serviceops-frontend serviceops-nginx; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container")
    check_result "Container: ${container}" 0 "(${STATUS})"
  else
    check_result "Container: ${container}" 1 "(Not Running)"
  fi
done

# ------------------------------------------------------------------------------
# 2. DATABASE & REDIS CONNECTIVITY
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}─── 2. Data & Cache Layer Connectivity ───────────────────────────────────────${NC}"

# Test PostgreSQL
if docker exec -t serviceops-postgres pg_isready -U postgres -d serviceops_db >/dev/null 2>&1; then
  check_result "PostgreSQL 16 Connection" 0 "Ready & Accepting Queries on port 5432"
else
  check_result "PostgreSQL 16 Connection" 1 "Database port unreachable or not accepting queries"
fi

# Test Redis
if docker exec -t serviceops-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
  check_result "Redis 7 In-Memory Cache" 0 "Responding with PONG on port 6379"
else
  check_result "Redis 7 In-Memory Cache" 1 "Redis broker not responding"
fi

# ------------------------------------------------------------------------------
# 3. BACKEND API ENGINE HEALTH
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}─── 3. Backend API Engine & Database Connection ──────────────────────────────${NC}"

# Liveness probe
LIVENESS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health/liveness 2>/dev/null || echo "000")
if [ "$LIVENESS_CODE" = "200" ]; then
  check_result "Backend Liveness Probe" 0 "(HTTP 200 OK)"
else
  check_result "Backend Liveness Probe" 1 "(HTTP ${LIVENESS_CODE})"
fi

# Database health via API
DB_HEALTH=$(curl -s http://localhost:4000/api/v1/health 2>/dev/null || echo "")
if echo "$DB_HEALTH" | grep -q '"status":"ok"'; then
  check_result "Backend-to-PostgreSQL Link" 0 "Active & Verified via /api/v1/health"
else
  check_result "Backend-to-PostgreSQL Link" 1 "Health check endpoint failed"
fi

# ------------------------------------------------------------------------------
# 4. NGINX REVERSE PROXY & INGRESS ROUTING
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}─── 4. Nginx Reverse Proxy & Ingress Routing ─────────────────────────────────${NC}"

# API routing via Nginx (Port 80)
NGINX_API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/health/liveness 2>/dev/null || echo "000")
if [ "$NGINX_API_CODE" = "200" ]; then
  check_result "Nginx API Reverse Proxy" 0 "Port 80 -> Backend:4000 Routing Functional"
else
  check_result "Nginx API Reverse Proxy" 1 "Port 80 -> Backend:4000 Failed (HTTP ${NGINX_API_CODE})"
fi

# Frontend UI via Nginx (Port 80)
NGINX_UI_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$NGINX_UI_CODE" = "200" ] || [ "$NGINX_UI_CODE" = "307" ] || [ "$NGINX_UI_CODE" = "308" ]; then
  check_result "Nginx Frontend Web Proxy" 0 "Port 80 -> Frontend:3000 Serving Next.js (HTTP ${NGINX_UI_CODE})"
else
  check_result "Nginx Frontend Web Proxy" 1 "Port 80 -> Frontend:3000 Failed (HTTP ${NGINX_UI_CODE})"
fi

# ------------------------------------------------------------------------------
# 5. USER DATABASE SEED & AUTHENTICATION READINESS
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}─── 5. User Database & Identity Records ──────────────────────────────────────${NC}"

USERS_COUNT=$(docker exec -t serviceops-backend node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); process.exit(0); }).catch(() => { console.log(-1); process.exit(0); });
" 2>/dev/null | tr -d '\r\n')

if [ "$USERS_COUNT" -gt 0 ] 2>/dev/null; then
  check_result "Database Seeding Status" 0 "Verified (${USERS_COUNT} active users found in database)"
else
  check_result "Database Seeding Status" 1 "Database is empty! Run seed command."
fi

# ------------------------------------------------------------------------------
# FINAL AUDIT SUMMARY
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}==============================================================================${NC}"
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  🎉 AUDIT RESULT: 100% HEALTHY (${PASSED}/${TOTAL} Tests Passed)                   ${NC}"
  echo -e "${CYAN}==============================================================================${NC}"
  echo -e "Your ServiceOps production deployment is fully operational on AWS!"
  echo -e "Access your live platform: ${BOLD}http://$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo 'YOUR_EC2_PUBLIC_IP')${NC}\n"
else
  echo -e "${RED}${BOLD}  ⚠️  AUDIT RESULT: ${FAILED} ISSUES DETECTED (${PASSED}/${TOTAL} Passed)                    ${NC}"
  echo -e "${CYAN}==============================================================================${NC}"
  echo -e "Inspect the failed checks above to resolve connectivity issues.\n"
fi
