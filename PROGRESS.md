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
8. [x] Tests — Playwright e2e (4 specs, all green): landing CTAs, signup→create public room→opens, private-room passcode-field + owner bypass, room appears in list. Fake-media launch flags; WebRTC media-path e2e left for a dedicated harness.

---
## 🎉 MVP roadmap (8 items) complete — each built, verified, and committed.

## Tier 2 — production hardening (in order)
T1. [x] Docker image slimming — Next standalone output: 1.1GB → 357MB, boot verified
T2. [x] Versioned migrations — baselined `0_init`, entrypoint runs `migrate deploy`; verified on fresh DB (host + in-container)
T3. [x] Health endpoint `/api/health` (db check + livekit config) + security headers (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy for camera/mic/screen, HSTS). CSP dev/prod-aware; verified e2e-green against BOTH dev and prod servers (caught + fixed a CSP-breaks-JS regression).
T4. [x] Unit tests (Vitest) — extracted `electHost`/`slugify` to pure libs; 14 tests across rateLimit, electHost (incl. migration), slugify. All green; build still passes. `npm test`.
T5. [x] CI workflow (GitHub Actions) — `build-test` job (tsc --noEmit, vitest, next build) + `e2e` job (postgres service, migrate deploy, Playwright/chromium, report artifact on failure). Playwright config CI-aware (reuse server only locally). All invoked commands verified locally; runs on GitHub on push/PR.
T6. [x] Room UX — copy-invite-link (clipboard), owner delete room (DELETE API, cascades), capacity guard in token endpoint (live-count vs ROOM_CAPACITY=12, owner bypass). Verified: non-owner DELETE→403, owner→200, deleted→404, capacity path keeps normal minting intact. Leave room already in Controls.
T7. [ ] Error boundaries + loading/empty states polish + a11y pass

## Local dev stack (Docker)
- Postgres: `wt-postgres` → localhost:5544 (wt/wt/watch_together)
- LiveKit dev: `wt-livekit` → ws://localhost:7880 (devkey/secret)
- App: `npm run dev` → http://localhost:3030
- Test account: alice@test.dev / password123
