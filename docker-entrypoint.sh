#!/bin/sh
set -e

# Apply the Prisma schema to the database before booting the app.
# (This project uses `db push`; swap for `prisma migrate deploy` once you adopt
# versioned migrations.)
echo "→ Syncing database schema…"
npx prisma db push --skip-generate --accept-data-loss

echo "→ Starting Watch Together on :${PORT:-3030}"
exec "$@"
