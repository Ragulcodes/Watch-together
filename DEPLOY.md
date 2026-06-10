# Deploying Watch Together

Three paths, easiest → most production-grade.

## 1. One command (full self-hosted stack)

Brings up app + Postgres + LiveKit + Egress (recording) + Redis:

```bash
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d --build
# App: http://localhost:3030
```

What runs:

| Service | Purpose | Port |
|---|---|---|
| `app` | Next.js app (auto-runs `prisma migrate deploy` on boot) | 3030 |
| `postgres` | Database | (internal) |
| `livekit` | SFU — video/audio/screen-share | 7880/7881 + 50000-50100/udp |
| `egress` | Recording worker (RoomComposite → MP4 in `./recordings`) | (internal) |
| `redis` | Shared by LiveKit + Egress | (internal) |

> **macOS note:** LiveKit media + the Egress headless-Chrome compositor expect Linux host networking and a UDP port range. They run cleanly on a Linux host/VM; on Mac, signalling works but media/recording may need `rtc.use_external_ip` tuning. For real multi-user testing, deploy the stack on a Linux box or use LiveKit Cloud (path 3).

Edit credentials before any public deployment: the API secret lives in `deploy/livekit.yaml`, `deploy/egress.yaml`, and `docker-compose.yml` (`LIVEKIT_API_SECRET`) — all three must match. Generate a strong one and replace all occurrences.

## 2. App on Vercel + managed LiveKit + managed Postgres

Best balance for most teams.

1. **Postgres**: Neon / Supabase / RDS → copy the connection string.
2. **LiveKit**: create a project at [cloud.livekit.io](https://cloud.livekit.io) → copy `API Key`, `API Secret`, `wss://…` URL. Recording works out of the box (LiveKit Cloud runs Egress for you).
3. **Vercel**: import the repo, set env:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your Vercel URL), `NEXTAUTH_SECRET`
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` (the `wss://` URL)
   - `NEXT_PUBLIC_LIVEKIT_URL` (same `wss://` URL)
   - For S3 recording uploads: `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
4. Apply migrations once against your DB: `DATABASE_URL=… npx prisma migrate deploy`.

## 3. Container host (Fly.io / Railway / Render) + LiveKit Cloud

```bash
docker build -t watch-together .
# push to your registry, then run with the env vars from path 2.
```

The image runs `prisma migrate deploy` on start (see `docker-entrypoint.sh`), then the standalone server on `$PORT` (default 3030).

## Environment reference

See `.env.example`. The only client-exposed var is `NEXT_PUBLIC_LIVEKIT_URL` — it **must** be reachable from end-user browsers (use the public `wss://` URL, not an internal hostname).

## Recording notes

- Recordings use LiveKit Egress (`RoomComposite`, speaker layout → MP4).
- Self-hosted: files land in `./recordings` (mounted into the egress container).
- Cloud/S3: set the `S3_*` env vars and they upload there automatically.
- A capture needs an active room with connected participants **and** a running Egress worker.
