import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ passcode: z.string().max(128).optional() });

// Join (or re-join) a room. For private rooms, verifies the passcode unless the
// caller is the owner or already a member.
export async function POST(
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

  const isOwner = room.ownerId === session.user.id;
  const existing = await prisma.membership.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
  });

  if (room.isPrivate && !isOwner && !existing) {
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    const passcode = parsed.success ? parsed.data.passcode : undefined;
    const ok =
      !!room.passcodeHash &&
      !!passcode &&
      (await bcrypt.compare(passcode, room.passcodeHash));
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid passcode", code: "invalid_passcode" },
        { status: 403 },
      );
    }
  }

  await prisma.membership.upsert({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
    update: {},
    create: {
      userId: session.user.id,
      roomId: room.id,
      role: isOwner ? "owner" : "member",
    },
  });
  return NextResponse.json({ ok: true });
}
