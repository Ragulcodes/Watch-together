# Build Progress — Watch Together

Self-paced build loop. Each iteration: implement one item → `next build` green → commit → continue.

> This is a standalone product. Nothing here relates to or depends on any other project.

## Done
- [x] Scaffold: Next.js 14 + TS + Tailwind + Prisma + NextAuth + LiveKit
- [x] Auth (signup/signin), rooms (create/list/join), chat (persist + live)
- [x] Synced player (host-authoritative, heartbeat drift correction)
- [x] High-clarity streaming: VP9+backup, simulcast 360/720/1080, adaptiveStream, dynacast, 1080p capture, 6Mbps screen share w/ system audio, audio RED+DTX
- [x] Device picker (camera/mic/speakers), connection-quality indicators, participant count

## Roadmap (in order)
1. [x] Private rooms + passcodes (join gate UI/API) — verified: gate→reject→accept→token, hidden from list
2. [x] Reactions + presence polish — floating emoji reactions (LiveKit data channel), speaking glow ring on tiles
3. [x] Moderation — host kick/mute (LiveKit RoomServiceClient), chat rate limit (10/10s), room-create limit (5/min); verified: 429s + 403 non-host + 400 owner-protect
4. [ ] Resilient sync: host migration, catch-up for late/behind viewers
5. [ ] Mobile-responsive layout + PWA install
6. [ ] Recording (LiveKit Egress) + replay
7. [ ] Deploy: Dockerfile + docker-compose (app + postgres + livekit) + LiveKit Cloud guide
8. [ ] Tests: Playwright e2e for join → share → sync → chat

## Local dev stack (Docker)
- Postgres: `wt-postgres` → localhost:5544 (wt/wt/watch_together)
- LiveKit dev: `wt-livekit` → ws://localhost:7880 (devkey/secret)
- App: `npm run dev` → http://localhost:3030
- Test account: alice@test.dev / password123
