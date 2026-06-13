import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["start", "tick"]),
  title: z.string().max(300).optional(),
  url: z.string().max(2000).optional(),
  id: z.string().optional(),
  seconds: z.number().int().min(0).max(120).optional(),
});

// Records "movies we've watched together" + accumulates total watch time.
// Only the effective host reports, so time isn't multiplied by viewer count.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  if (d.action === "start") {
    const row = await prisma.watchHistory.create({
      data: { title: (d.title || "A movie").slice(0, 300), url: d.url ?? null },
    });
    return NextResponse.json({ id: row.id });
  }

  // tick
  if (d.id && d.seconds) {
    await prisma.watchHistory
      .update({ where: { id: d.id }, data: { seconds: { increment: d.seconds } } })
      .catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
