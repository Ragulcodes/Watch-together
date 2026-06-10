"use client";
import { useCallback, useState } from "react";
import { useDataChannel, useRoomContext } from "@livekit/components-react";
import {
  REACTION_EMOJIS,
  REACTION_TOPIC,
  decode,
  encode,
  type ReactionEvent,
} from "@/lib/sync";

type Floater = { key: string; emoji: string; left: number; name: string };

let floaterSeq = 0;

/**
 * Floating emoji reactions. The bar publishes a ReactionEvent over a LiveKit
 * data channel; every client (including the sender) renders a floater that
 * drifts up and fades. Pure ephemeral fun — nothing is persisted.
 */
export function Reactions() {
  const room = useRoomContext();
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const spawn = useCallback((emoji: string, name: string) => {
    floaterSeq += 1;
    const key = `${emoji}-${floaterSeq}`;
    const left = 10 + ((floaterSeq * 37) % 80); // pseudo-random horizontal spread
    setFloaters((f) => [...f, { key, emoji, left, name }]);
    setTimeout(() => {
      setFloaters((f) => f.filter((x) => x.key !== key));
    }, 2600);
  }, []);

  useDataChannel(REACTION_TOPIC, (msg) => {
    const ev = decode<ReactionEvent>(msg.payload);
    if (ev.type === "reaction") spawn(ev.emoji, ev.senderName);
  });

  const react = useCallback(
    (emoji: string) => {
      const senderName = room.localParticipant.name ?? "Me";
      const ev: ReactionEvent = {
        type: "reaction",
        emoji,
        senderId: room.localParticipant.identity,
        senderName,
        at: Date.now(),
      };
      spawn(emoji, senderName); // optimistic local
      room.localParticipant
        .publishData(encode(ev), { reliable: false, topic: REACTION_TOPIC })
        .catch(() => undefined);
    },
    [room, spawn],
  );

  return (
    <>
      {/* Floating layer over the stage */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {floaters.map((f) => (
          <div
            key={f.key}
            className="reaction-floater absolute bottom-16 text-4xl"
            style={{ left: `${f.left}%` }}
          >
            {f.emoji}
          </div>
        ))}
      </div>

      {/* Reaction bar */}
      <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-30
                      flex gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-1 border border-border">
        {REACTION_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => react(e)}
            className="text-xl px-1.5 py-0.5 rounded-full hover:bg-white/10 transition active:scale-90"
            title={`React ${e}`}
            aria-label={`Send ${e} reaction`}
          >
            {e}
          </button>
        ))}
      </div>
    </>
  );
}
