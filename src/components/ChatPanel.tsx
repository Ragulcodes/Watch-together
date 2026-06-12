"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Send, X } from "lucide-react";
import { CHAT_TOPIC, type ChatEvent, decode, encode } from "@/lib/sync";
import { useRoomData } from "@/lib/useRoomData";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  at: number;
};

export function ChatPanel({
  roomSlug,
  currentUserId,
  onClose,
}: {
  roomSlug: string;
  currentUserId: string;
  onClose?: () => void;
}) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load history.
  useEffect(() => {
    fetch(`/api/chat/${roomSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: {
              id: string; body: string; userId: string;
              user: { displayName: string }; createdAt: string;
            }) => ({
              id: m.id,
              body: m.body,
              senderId: m.userId,
              senderName: m.user.displayName,
              at: new Date(m.createdAt).getTime(),
            })),
          );
        }
      })
      .catch(() => undefined);
  }, [roomSlug]);

  // Live messages over LiveKit data channel (everyone's messages).
  useRoomData(CHAT_TOPIC, (payload) => {
    const ev = decode<ChatEvent>(payload);
    if (ev.type !== "chat") return;
    setMessages((m) =>
      m.some((x) => x.id === ev.id)
        ? m
        : [...m, { id: ev.id, body: ev.body, senderId: ev.senderId, senderName: ev.senderName, at: ev.at }],
    );
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = body.trim();
      if (!text) return;
      setBody("");
      const id = crypto.randomUUID();
      const senderName = room.localParticipant.name ?? "Me";
      const ev: ChatEvent = {
        type: "chat",
        id,
        body: text,
        senderId: currentUserId,
        senderName,
        at: Date.now(),
      };
      // Optimistic local append.
      setMessages((m) => [...m, { id, body: text, senderId: currentUserId, senderName, at: ev.at }]);
      // Broadcast to peers.
      room.localParticipant
        .publishData(encode(ev), { reliable: true, topic: CHAT_TOPIC })
        .catch(() => undefined);
      // Persist.
      fetch(`/api/chat/${roomSlug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      }).catch(() => undefined);
    },
    [body, currentUserId, room, roomSlug],
  );

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-white font-medium">Chat</h2>
        {onClose && (
          <button onClick={onClose} className="btn-ghost p-1" aria-label="Close chat" title="Close chat">
            <X size={18} />
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-muted text-sm text-center py-10">
            Say hi 👋
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.senderId === currentUserId
                  ? "ml-auto bg-accent text-white"
                  : "bg-panel2 text-white"
              }`}
            >
              {m.senderId !== currentUserId && (
                <div className="text-[10px] uppercase tracking-wide text-muted mb-0.5">
                  {m.senderName}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
        <input
          className="input"
          placeholder="Message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <button className="btn-primary" type="submit" aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </>
  );
}
