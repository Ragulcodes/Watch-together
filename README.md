# Watch Together

A production-grade foundation for a watch-party platform — webcams, mic, screen-share with audio, synchronized video playback, and live chat — built on Next.js 14 + LiveKit + Prisma.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript + Tailwind |
| Real-time media | **LiveKit** (SFU) — webcam, mic, screen-share (with audio), data channels |
| Auth | NextAuth (credentials provider, bcrypt) |
| Database | PostgreSQL + Prisma |
| Sync | LiveKit data channels (low-latency) + DB anchor (durable) |

## Why LiveKit

Peer-to-peer WebRTC mesh breaks down past 3-4 participants — every participant has to upload N copies of their stream. LiveKit is a Selective Forwarding Unit (SFU): each client uploads once, the server fans out. It has a React SDK (`@livekit/components-react`), built-in screen-share with audio passthrough, and free dev keys at [cloud.livekit.io](https://cloud.livekit.io).

## Features in this scaffold

- **Auth** — Email/username + password sign-up & sign-in (NextAuth JWT)
- **Rooms** — Create public rooms, browse, deep-link with slugs
- **Video + audio** — LiveKit `useTracks` participant grid with mic/camera toggles
- **Screen share** — Includes system audio (`{ audio: true }` flag)
- **Synced playback** — Host controls play/pause/seek for everyone; periodic heartbeats correct drift; new joiners receive current state via `request-state`
- **Chat** — Persistent (Postgres) + live (LiveKit data channels)
- **Host controls** — Only the room owner authoritatively drives the player

## Setup

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env.local
# Edit .env.local:
#   - DATABASE_URL: point to your Postgres
#   - NEXTAUTH_SECRET: openssl rand -base64 32
#   - LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_URL / NEXT_PUBLIC_LIVEKIT_URL:
#     get free keys at https://cloud.livekit.io

# 3. DB
npm run db:push   # or db:migrate

# 4. Dev
npm run dev
# http://localhost:3030
```

## What's stubbed / next steps for production

- [ ] Private rooms (passcode flow — schema is ready, UI is not)
- [ ] OAuth providers (Google/Discord)
- [ ] Rate limiting & abuse controls (login, chat, room creation)
- [ ] Server-side moderation (block list, host kick/ban)
- [ ] Adaptive bitrate / simulcast tuning
- [ ] Recording (LiveKit Egress)
- [ ] Mobile breakpoints polish
- [ ] e2e tests (Playwright)
- [ ] Observability (Sentry/OpenTelemetry)
- [ ] Containerisation (Dockerfile + compose) + deploy guide

## Architecture notes

- **Sync model**: Host is authoritative. Host's local player events (play/pause/seek) are broadcast as `SyncEvent` over a LiveKit data channel topic (`watch-sync`). Members snap to host state on heartbeat (every 5 s) if drift exceeds `DRIFT_THRESHOLD_SEC` (1.25 s). DB stores the last known anchor (`positionSec` + `positionAt` + `isPlaying`) so late joiners materialise the correct state.
- **Chat**: Optimistic local append → broadcast over `watch-chat` topic → persist to `Message` table. History (last 100) loaded on mount.
- **Auth identity = LiveKit identity**: User ID is the LiveKit participant identity, so server-side membership/role flows directly through to room grants.
