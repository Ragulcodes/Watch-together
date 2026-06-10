import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, maybeCleanup } from "@/lib/rateLimit";
import { slugify } from "@/lib/slug";

const createSchema = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().max(280).optional().nullable(),
    isPrivate: z.boolean().optional().default(false),
    passcode: z.string().min(4).max(128).optional().nullable(),
  })
  .refine((d) => !d.isPrivate || (d.passcode && d.passcode.length >= 4), {
    message: "Private rooms require a passcode of at least 4 characters",
    path: ["passcode"],
  });

export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { isPrivate: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      createdAt: true,
      _count: { select: { memberships: true } },
      owner: { select: { displayName: true, username: true } },
    },
  });
  return NextResponse.json({ rooms });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Max 5 room creations / minute per user.
  maybeCleanup(60_000);
  const limit = rateLimit(`room-create:${session.user.id}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many rooms created. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  let slug =
    slugify(parsed.data.name) || `room-${Math.random().toString(36).slice(2, 8)}`;
  // Ensure uniqueness
  while (await prisma.room.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
  }
  const isPrivate = parsed.data.isPrivate ?? false;
  const passcodeHash =
    isPrivate && parsed.data.passcode
      ? await bcrypt.hash(parsed.data.passcode, 12)
      : null;
  const room = await prisma.room.create({
    data: {
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      isPrivate,
      passcodeHash,
      ownerId: session.user.id,
      memberships: {
        create: { userId: session.user.id, role: "owner" },
      },
    },
  });
  return NextResponse.json({ room });
}
