import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoomServiceClient } from "@/lib/livekit";

const schema = z.object({
  action: z.enum(["kick", "mute"]),
  targetIdentity: z.string().min(1),
});

// Host-only moderation. Identities are user IDs (set as the LiveKit identity
// when minting tokens), so target lookups line up with our DB roles.
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

  const membership = await prisma.membership.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
  });
  const isHost =
    room.ownerId === session.user.id ||
    membership?.role === "owner" ||
    membership?.role === "host";
  if (!isHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { action, targetIdentity } = parsed.data;
  if (targetIdentity === room.ownerId) {
    return NextResponse.json({ error: "Cannot moderate the owner" }, { status: 400 });
  }

  const svc = getRoomServiceClient();
  try {
    if (action === "kick") {
      await svc.removeParticipant(room.slug, targetIdentity);
    } else {
      // Mute every track the participant is currently publishing.
      const p = await svc.getParticipant(room.slug, targetIdentity);
      await Promise.all(
        (p.tracks ?? []).map((t) =>
          svc.mutePublishedTrack(room.slug, targetIdentity, t.sid, true),
        ),
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Moderation action failed", detail: String(e) },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
