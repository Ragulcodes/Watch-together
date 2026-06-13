import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { Room } from "@/components/Room";

export default async function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/rooms/${params.roomId}`);
  }
  const room = await prisma.room.findFirst({
    where: { OR: [{ id: params.roomId }, { slug: params.roomId }] },
    include: { owner: { select: { id: true, displayName: true } } },
  });
  if (!room) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-3xl p-10 text-center">
          <h1 className="text-2xl text-white">Room not found</h1>
        </main>
      </div>
    );
  }
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <Nav />
      <Room
        roomSlug={room.slug}
        roomName={room.name}
        ownerId={room.ownerId}
        ownerName={room.owner.displayName}
        currentUserId={session.user.id}
        initialMedia={{
          url: room.mediaUrl,
          title: room.mediaTitle,
          isPlaying: room.isPlaying,
          positionSec: room.positionSec,
          positionAt: room.positionAt.toISOString(),
        }}
      />
    </div>
  );
}
