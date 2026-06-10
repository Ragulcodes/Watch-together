import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import {
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from "livekit-server-sdk";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEgressClient } from "@/lib/livekit";

const schema = z.object({ action: z.enum(["start", "stop"]) });

function buildOutput(roomSlug: string): EncodedFileOutput {
  const filepath = `recordings/${roomSlug}-{room_name}-{time}.mp4`;
  const out = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath,
  });
  // If S3 is configured, upload there; otherwise the Egress service writes to
  // its own local/configured storage at `filepath`.
  if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    out.output = {
      case: "s3",
      value: new S3Upload({
        accessKey: process.env.AWS_ACCESS_KEY_ID,
        secret: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.S3_BUCKET,
        region: process.env.AWS_REGION,
      }),
    };
  }
  return out;
}

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

  const egress = getEgressClient();
  try {
    if (parsed.data.action === "start") {
      if (room.recordingEgressId) {
        return NextResponse.json({ error: "Already recording" }, { status: 409 });
      }
      const info = await egress.startRoomCompositeEgress(
        room.slug,
        buildOutput(room.slug),
        { layout: "speaker" },
      );
      await prisma.room.update({
        where: { id: room.id },
        data: { recordingEgressId: info.egressId, recordingStartedAt: new Date() },
      });
      return NextResponse.json({ recording: true, egressId: info.egressId });
    } else {
      if (!room.recordingEgressId) {
        return NextResponse.json({ error: "Not recording" }, { status: 409 });
      }
      await egress.stopEgress(room.recordingEgressId);
      await prisma.room.update({
        where: { id: room.id },
        data: { recordingEgressId: null, recordingStartedAt: null },
      });
      return NextResponse.json({ recording: false });
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "Recording action failed — is the Egress service running?",
        detail: String(e),
      },
      { status: 502 },
    );
  }
}

// Report current recording status (any member can poll).
export async function GET(
  _req: Request,
  { params }: { params: { roomId: string } },
) {
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: params.roomId }, { slug: params.roomId }] },
    select: { recordingEgressId: true, recordingStartedAt: true },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    recording: !!room.recordingEgressId,
    startedAt: room.recordingStartedAt,
  });
}
