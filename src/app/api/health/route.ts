import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Liveness/readiness probe: verifies DB connectivity and reports LiveKit config.
export async function GET() {
  let db: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }
  const livekitConfigured = !!(
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET &&
    process.env.LIVEKIT_URL
  );
  const ok = db === "up";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      db,
      livekitConfigured,
      uptimeSec: Math.round(process.uptime()),
    },
    { status: ok ? 200 : 503 },
  );
}
