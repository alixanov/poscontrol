#!/bin/sh
set -e

WEB_PORT="${PORT:-10000}"

echo "=========================================="
echo "🚀 POSCONTROL CLOUD PRODUCTION STARTUP"
echo "=========================================="

cd /app/server

if [ -z "$DATABASE_URL" ]; then
  echo "ℹ️ No DATABASE_URL specified. Initializing embedded SQLite database..."
  cp prisma/schema.sqlite.prisma prisma/schema.prisma
  npx prisma generate
  npx prisma db push --skip-generate
  node dist/prisma/seed.js || true
else
  echo "✅ PostgreSQL DATABASE_URL detected. Synchronizing schema..."
  npx prisma generate
  npx prisma db push --skip-generate || true
  node dist/prisma/seed.js || true
fi

echo "🚀 Starting NestJS API on internal port 4000..."
PORT=4000 node dist/src/main.js &

sleep 3

# Self keep-alive daemon: ping external URL every 9 minutes so Render never sleeps
(
  while true; do
    sleep 540
    PING_TARGET="${KEEP_ALIVE_URL:-$RENDER_EXTERNAL_URL}"
    if [ -z "$PING_TARGET" ] && [ -n "$RENDER_EXTERNAL_HOSTNAME" ]; then
      PING_TARGET="https://$RENDER_EXTERNAL_HOSTNAME"
    fi
    if [ -n "$PING_TARGET" ]; then
      echo "💓 [Keep-Alive] Pinging $PING_TARGET/api/categories..."
      wget -q -O /dev/null "$PING_TARGET/api/categories" || true
    fi
  done
) &

echo "🌐 Starting Next.js Web on public port $WEB_PORT..."
cd /app/client
exec npx next start -p "$WEB_PORT"