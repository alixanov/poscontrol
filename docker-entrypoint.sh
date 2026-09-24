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

echo "🌐 Starting Next.js Web on public port $WEB_PORT..."
cd /app/client
exec npx next start -p "$WEB_PORT"