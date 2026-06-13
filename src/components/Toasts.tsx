"use client";
import { useCallback, useEffect, useState } from "react";
import { useRoomContext, useParticipants } from "@livekit/components-react";
import { RoomEvent, type RemoteParticipant } from "livekit-client";
import { useRoomData } from "@/lib/useRoomData";
import { SYNC_TOPIC, decode, type SyncEvent } from "@/lib/sync";

type Toast = { id: number; text: string };
let toastSeq = 0;

/**
 * Transient presence notifications: who paused/resumed/started the movie, and
 * who joined/left. Resolves names from the live participant list.
 */
export function Toasts({ currentUserId }: { currentUserId: string }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string) => {
    toastSeq += 1;
    const id = toastSeq;
    setToasts((t) => [...t.slice(-3), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const nameFor = useCallback(
    (identity: string) =>
      participants.find((p) => p.identity === identity)?.name || "Someone",
    [participants],
  );

  // Movie transport events from others → toast.
  useRoomData(SYNC_TOPIC, (payload) => {
    const ev = decode<SyncEvent>(payload);
    if (ev.senderId === currentUserId) return;
    const who = nameFor(ev.senderId);
    if (ev.type === "play") push(`${who} resumed the movie`);
    else if (ev.type === "pause") push(`${who} paused`);
    else if (ev.type === "load") push(`${who} started a movie`);
  });

  // Join / leave.
  useEffect(() => {
    const onJoin = (p: RemoteParticipant) => push(`${p.name || "Someone"} joined`);
    const onLeave = (p: RemoteParticipant) => push(`${p.name || "Someone"} left`);
    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [room, push]);

  return (
    <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass rounded-full px-4 py-1.5 text-sm text-white whitespace-nowrap"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
