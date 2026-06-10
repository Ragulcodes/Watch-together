#!/bin/sh
set -e

# Apply versioned migrations before booting the app.
echo "→ Applying database migrations…"
# Invoke the Prisma CLI directly (no npx network lookup in the slim image).
node node_modules/prisma/build/index.js migrate deploy

echo "→ Starting Watch Together on :${PORT:-3030}"
exec "$@"
