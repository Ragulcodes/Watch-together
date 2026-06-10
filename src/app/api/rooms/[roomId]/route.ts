import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  mediaUrl: z.string().url().nullable().optional(),
  mediaTitle: z.string().max(200).nullable().optional(),
  isPlaying: z.boolean().optional(),
  positionSec: z.number().min(0).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { roomId: string } },
) {
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: params.roomId }, { slug: params.roomId }] },
    include: {
      owner: { select: { id: true, displayName: true, username: true } },
      _count: { select: { memberships: true } },
    },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ room });
}

export async function PATCH(
  req: Request,
  { params }: { params: { roomId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: params.roomId }, { slug: params.roomId }] },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const membership = await prisma.membership.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
  });
  // Allow host roles to mutate playback state authoritatively.
  if (!membership || (membership.role !== "owner" && membership.role !== "host")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updated = await prisma.room.update({
    where: { id: room.id },
    data: {
      ...parsed.data,
      positionAt: parsed.data.positionSec != null ? new Date() : undefined,
    },
  });
  return NextResponse.json({ room: updated });
}
