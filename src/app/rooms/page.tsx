"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Nav } from "@/components/Nav";
import { Plus, Users } from "lucide-react";

type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { memberships: number };
  owner: { displayName: string; username: string };
};

export default function RoomsPage() {
  const { status } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/rooms");
    const data = await res.json();
    setRooms(data.rooms ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description: desc || null }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create room");
      return;
    }
    const { room } = await res.json();
    window.location.href = `/rooms/${room.slug}`;
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Rooms</h1>
            <p className="text-muted mt-1">Public rooms anyone can join.</p>
          </div>
          {status === "authenticated" && (
            <button
              onClick={() => setCreating((c) => !c)}
              className="btn-primary"
            >
              <Plus size={16} /> New room
            </button>
          )}
        </div>

        {creating && (
          <form onSubmit={createRoom} className="card mt-6 p-6 space-y-3">
            <input
              className="input"
              placeholder="Room name (e.g. Friday Movie Night)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
            />
            <input
              className="input"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={280}
            />
            {err && <div className="text-sm text-danger">{err}</div>}
            <div className="flex gap-2">
              <button className="btn-primary" type="submit">Create</button>
              <button className="btn-ghost" type="button"
                onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="text-muted">Loading…</div>
          ) : rooms.length === 0 ? (
            <div className="text-muted col-span-full text-center py-16">
              No rooms yet. Be the first to create one!
            </div>
          ) : (
            rooms.map((r) => (
              <Link
                key={r.id}
                href={`/rooms/${r.slug}`}
                className="card p-5 hover:border-accent/50 transition"
              >
                <div className="font-medium text-white">{r.name}</div>
                <div className="text-sm text-muted mt-1 line-clamp-2 min-h-[2.5em]">
                  {r.description ?? "No description"}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-muted">
                  <span>by {r.owner.displayName}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> {r._count.memberships}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
