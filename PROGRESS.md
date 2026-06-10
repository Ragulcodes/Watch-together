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
4. [x] Resilient sync — deterministic host migration (owner→lowest-identity fallback, all clients agree), buffering auto-resync + manual "Sync to host"; election logic unit-verified
5. [x] Mobile-responsive + PWA — chat drawer on mobile / sidebar on desktop, adaptive header; manifest + service worker + generated PNG icons (192/512/maskable), installable; all assets verified served
6. [x] Recording (LiveKit Egress) — host start/stop API + REC indicator for all; RoomComposite→MP4, S3 upload if configured. Verified: status GET, non-host→403, host START reaches LiveKit RPC (502 graceful w/o egress worker). NOTE: full capture needs an Egress worker container + storage (not in dev `--dev` LiveKit).
7. [x] Deploy — multi-stage Dockerfile (verified: image builds + boots, entrypoint runs prisma db push + serves 200), docker-compose (app+postgres+livekit+egress+redis, validated), LiveKit/Egress configs, DEPLOY.md (compose / Vercel+LiveKit Cloud / container-host paths)
8. [ ] Tests: Playwright e2e for join → share → sync → chat

## Local dev stack (Docker)
- Postgres: `wt-postgres` → localhost:5544 (wt/wt/watch_together)
- LiveKit dev: `wt-livekit` → ws://localhost:7880 (devkey/secret)
- App: `npm run dev` → http://localhost:3030
- Test account: alice@test.dev / password123
