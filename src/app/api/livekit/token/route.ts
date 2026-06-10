import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mintLiveKitToken } from "@/lib/livekit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const roomSlug = url.searchParams.get("room");
  if (!roomSlug) {
    return NextResponse.json({ error: "Missing ?room" }, { status: 400 });
  }
  const room = await prisma.room.findUnique({ where: { slug: roomSlug } });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  // Auto-join membership (for public rooms). Private rooms would require a passcode flow.
  await prisma.membership.upsert({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
    update: {},
    create: {
      userId: session.user.id,
      roomId: room.id,
      role: room.ownerId === session.user.id ? "owner" : "member",
    },
  });
  const token = await mintLiveKitToken({
    roomName: room.slug,
    identity: session.user.id,
    name: session.user.name ?? "Guest",
    isHost: room.ownerId === session.user.id,
  });
  return NextResponse.json({
    token,
    url: process.env.LIVEKIT_URL,
    room: { slug: room.slug, name: room.name, ownerId: room.ownerId },
  });
}
