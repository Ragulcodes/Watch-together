#!/bin/sh
set -e

# Apply the Prisma schema to the database before booting the app.
# (This project uses `db push`; swap for `prisma migrate deploy` once you adopt
# versioned migrations.)
echo "→ Syncing database schema…"
# Invoke the Prisma CLI directly (no npx network lookup in the slim image).
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "→ Starting Watch Together on :${PORT:-3030}"
exec "$@"
