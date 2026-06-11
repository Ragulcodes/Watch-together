# Free hosting: Vercel + Neon + LiveKit Cloud

This is the zero-server, all-free-tier path. Three services:

| Service | Role | Free tier |
|---|---|---|
| **Vercel** | the Next.js app + API routes | Hobby (non-commercial) |
| **Neon** | Postgres | Free project |
| **LiveKit Cloud** | the SFU (video/audio/screen + recording) | Build tier |

> Realtime never touches Vercel — the browser talks to LiveKit directly. Vercel only signs tokens and reads/writes the DB, which is exactly what serverless is good at.

---

## 1. Neon (Postgres)

1. Create a project at [neon.tech](https://neon.tech).
2. From the dashboard, copy **two** connection strings:
   - **Pooled** — host contains `-pooler` → this is `DATABASE_URL` (app runtime).
   - **Direct** — host without `-pooler` → this is `DIRECT_URL` (migrations).
3. Nothing else to do — migrations run automatically on the first production deploy (see `vercel.json`).

> Why two URLs: serverless functions open many short-lived connections, so runtime uses the **pooled** endpoint. Prisma migrations need a **direct** connection (advisory locks don't work through the pooler).

## 2. LiveKit Cloud (SFU)

1. Create a project at [cloud.livekit.io](https://cloud.livekit.io).
2. Copy the **API Key**, **API Secret**, and the **`wss://your-project.livekit.cloud`** URL.
3. Recording (Egress) is run by LiveKit Cloud — no extra setup.

## 3. Deploy the app to Vercel

You can deploy two ways:

**A. From GitHub (auto-deploys on push)**
1. Push this repo to a GitHub repo.
2. In Vercel → "Add New Project" → import it. Framework auto-detects as Next.js; the build command in `vercel.json` is used as-is.

**B. From your machine (no GitHub needed)**
```bash
npm i -g vercel
vercel        # first run links/creates the project
vercel --prod # production deploy
```

### Environment variables (set in Vercel → Project → Settings → Environment Variables)

```
DATABASE_URL             = <Neon POOLED string>        # host has -pooler
DIRECT_URL               = <Neon DIRECT string>         # host without -pooler
NEXTAUTH_URL             = https://<your-app>.vercel.app
NEXTAUTH_SECRET          = <openssl rand -base64 32>
LIVEKIT_API_KEY          = <from LiveKit Cloud>
LIVEKIT_API_SECRET       = <from LiveKit Cloud>
LIVEKIT_URL              = wss://<your-project>.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL  = wss://<your-project>.livekit.cloud
```

After the first deploy, update `NEXTAUTH_URL` to your real domain and redeploy if it changed.

> **`NEXT_PUBLIC_LIVEKIT_URL` must be the public `wss://` URL** — it ships to the browser. This is the #1 mistake.

## 4. Migrations

The production build command runs `prisma migrate deploy` automatically (over `DIRECT_URL`). Preview deploys skip it. To apply manually instead:
```bash
DATABASE_URL="<Neon DIRECT string>" npx prisma migrate deploy
```

## 5. Smoke test (do this once)

1. Open the deployed URL, sign up, create a room.
2. Open the room in a **second** browser / device as a different user.
3. Toggle camera + mic, hit **Share**, paste an `.mp4` URL → confirm both see/hear each other and playback stays in sync.

---

## Caveats (read before relying on it)

- **Vercel Hobby is non-commercial.** Fine for friends; not for a paid product.
- **LiveKit free bandwidth/minutes** are the first thing you'd outgrow if this goes public — check current limits on their pricing page.
- **Neon free DBs autosuspend** when idle → the first request after a quiet period has a ~1–2s cold start.
- **Untested live path:** the env wiring matches the SDK, but a real multi-person LiveKit Cloud call hasn't been smoke-tested from this repo — step 5 is that test.
