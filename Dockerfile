# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (incl. prisma CLI for runtime migrations) ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
# --ignore-scripts: skip the `prisma generate` postinstall here (no schema yet);
# the build stage runs it explicitly once the prisma/ dir is present.
RUN npm ci --ignore-scripts

# ---- build: generate prisma client + compile Next ----
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXTAUTH_SECRET is only needed at build time for route collection; the real
# value is injected at runtime, so inline a throwaway placeholder here.
RUN npx prisma generate && NEXTAUTH_SECRET=build-time-placeholder npm run build

# ---- run: slim standalone runtime + prisma CLI for boot-time schema sync ----
FROM node:20-alpine AS run
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3030
ENV HOSTNAME=0.0.0.0

# Self-contained Next server bundle (traces in @prisma/client + query engine).
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
# Prisma CLI + engines so docker-entrypoint can apply the schema at boot.
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3030
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
