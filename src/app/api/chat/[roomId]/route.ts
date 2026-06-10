import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, maybeCleanup } from "@/lib/rateLimit";

export async function GET(
  _req: Request,
  { params }: { params: { roomId: string } },
) {
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: params.roomId }, { slug: params.roomId }] },
    select: { id: true },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { id: true, displayName: true } } },
  });
  return NextResponse.json({ messages: messages.reverse() });
}

const postSchema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Max 10 messages / 10s per user.
  maybeCleanup(10_000);
  const limit = rateLimit(`chat:${session.user.id}`, 10, 10_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Slow down a little." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: params.roomId }, { slug: params.roomId }] },
    select: { id: true },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const msg = await prisma.message.create({
    data: {
      roomId: room.id,
      userId: session.user.id,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, displayName: true } } },
  });
  return NextResponse.json({ message: msg });
}
