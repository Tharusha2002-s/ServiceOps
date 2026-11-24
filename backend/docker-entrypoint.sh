#!/bin/sh
set -e

echo "========================================================"
echo "    ServiceOps Enterprise ITSM Engine — Initializing   "
echo "========================================================"

# 1. Wait for PostgreSQL readiness
echo "[ServiceOps Entrypoint] Waiting for database connection..."
until nc -z -v -w30 ${DB_HOST:-postgres} ${DB_PORT:-5432} 2>/dev/null || \
      node -e "
        const net = require('net');
        const client = new net.Socket();
        client.connect(${DB_PORT:-5432}, '${DB_HOST:-postgres}', () => {
          client.end();
          process.exit(0);
        });
        client.on('error', () => process.exit(1));
      " 2>/dev/null; do
  echo "[ServiceOps Entrypoint] PostgreSQL is unavailable — waiting 2 seconds..."
  sleep 2
done
echo "[ServiceOps Entrypoint] PostgreSQL is ready!"

# 2. Synchronize database schema via Prisma
echo "[ServiceOps Entrypoint] Applying Prisma database schema..."
npx prisma generate
npx prisma db push --skip-generate

# 3. Check if database is seeded, if not run initial seed
echo "[ServiceOps Entrypoint] Checking database seed status..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[ServiceOps Entrypoint] Database is unseeded. Running initial seed...');
      require('child_process').execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
      console.log('[ServiceOps Entrypoint] Seed completed successfully!');
    } else {
      console.log('[ServiceOps Entrypoint] Database already initialized with ' + userCount + ' users. Skipping seed.');
    }
  } catch (err) {
    console.warn('[ServiceOps Entrypoint] Seed check warning:', err.message);
  } finally {
    await prisma.\$disconnect();
    process.exit(0);
  }
}
check();
" || true

echo "========================================================"
echo "    ServiceOps Engine Ready — Launching Server         "
echo "========================================================"

if [ "$1" = "node" ] && [ "$2" = "dist/main" ] && [ ! -f "dist/main.js" ] && [ -f "dist/src/main.js" ]; then
  set -- node dist/src/main.js
fi

exec "$@"
