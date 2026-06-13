"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Send, X, Smile } from "lucide-react";
import {
  CHAT_TOPIC,
  PRESENCE_TOPIC,
  type ChatEvent,
  type PresenceEvent,
  decode,
  encode,
} from "@/lib/sync";
import { useRoomData } from "@/lib/useRoomData";
import { GifPicker } from "./GifPicker";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  at: number;
};

const STICKERS = ["😻", "🥳", "🍿", "😂", "❤️", "🤍", "🔥", "👏", "😮", "😢", "🎉", "👍", "🙈", "💯", "✨", "😍"];
const IMG_RE = /^https?:\/\/\S+\.(?:gif|png|jpe?g|webp)(?:\?\S*)?$/i;
const isImageUrl = (s: string) => IMG_RE.test(s.trim());
const isSticker = (s: string) => {
  const t = s.trim();
  return t.length <= 6 && /\p{Extended_Pictographic}/u.test(t) && !/[a-z0-9]/i.test(t);
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
  const [typers, setTypers] = useState<Record<string, string>>({});
  const [showStickers, setShowStickers] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "gifs" | "stickers">("emoji");
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingSent = useRef(0);

  const broadcastTyping = useCallback(
    (typing: boolean) => {
      const ev: PresenceEvent = {
        type: "typing",
        senderId: currentUserId,
        senderName: room.localParticipant.name ?? "Someone",
        typing,
      };
      room.localParticipant
        .publishData(encode(ev), { reliable: false, topic: PRESENCE_TOPIC })
        .catch(() => undefined);
    },
    [currentUserId, room],
  );

  const onBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBody(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 1500) {
      lastTypingSent.current = now;
      broadcastTyping(true);
    }
  };

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

  // Typing indicators from others (auto-expire after 4s of silence).
  useRoomData(PRESENCE_TOPIC, (payload) => {
    const ev = decode<PresenceEvent>(payload);
    if (ev.type !== "typing" || ev.senderId === currentUserId) return;
    clearTimeout(typingTimers.current[ev.senderId]);
    if (ev.typing) {
      setTypers((t) => ({ ...t, [ev.senderId]: ev.senderName }));
      typingTimers.current[ev.senderId] = setTimeout(() => {
        setTypers((t) => {
          const n = { ...t };
          delete n[ev.senderId];
          return n;
        });
      }, 4000);
    } else {
      setTypers((t) => {
        const n = { ...t };
        delete n[ev.senderId];
        return n;
      });
    }
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const postMessage = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
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
      // Optimistic local append + broadcast + persist.
      setMessages((m) => [...m, { id, body: text, senderId: currentUserId, senderName, at: ev.at }]);
      room.localParticipant
        .publishData(encode(ev), { reliable: true, topic: CHAT_TOPIC })
        .catch(() => undefined);
      fetch(`/api/chat/${roomSlug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      }).catch(() => undefined);
    },
    [currentUserId, room, roomSlug],
  );

  const send = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!body.trim()) return;
      postMessage(body);
      setBody("");
      broadcastTyping(false);
      lastTypingSent.current = 0;
    },
    [body, postMessage, broadcastTyping],
  );

  const sendSticker = useCallback(
    (emoji: string) => {
      postMessage(emoji);
      setShowStickers(false);
    },
    [postMessage],
  );

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-white font-medium">Chat</h2>
        {onClose && (
          <button onClick={onClose} className="btn-ghost p-1" aria-label="Close chat" title="Close chat">
            <X size={18} />
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-muted text-sm text-center py-10">
            Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const own = m.senderId === currentUserId;
            const img = isImageUrl(m.body);
            const sticker = !img && isSticker(m.body);
            return (
              <div key={m.id} className={`max-w-[85%] ${own ? "ml-auto" : ""}`}>
                {!own && (
                  <div className="text-[10px] uppercase tracking-wide text-muted mb-0.5">
                    {m.senderName}
                  </div>
                )}
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.body}
                    alt="shared gif"
                    loading="lazy"
                    className={`rounded-lg max-h-52 max-w-full ${own ? "ml-auto" : ""}`}
                  />
                ) : sticker ? (
                  <div className={`text-5xl leading-none ${own ? "text-right" : ""}`}>{m.body}</div>
                ) : (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                      own ? "bg-accent text-white" : "bg-panel2 text-white"
                    }`}
                  >
                    {m.body}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {Object.keys(typers).length > 0 && (
        <div className="px-4 pb-1 text-xs text-muted italic shrink-0">
          {(() => {
            const names = Object.values(typers);
            return names.length === 1
              ? `${names[0]} is typing…`
              : `${names.slice(0, 2).join(" & ")} are typing…`;
          })()}
        </div>
      )}
      {showStickers && (
        <div className="border-t border-border pt-2 shrink-0">
          <div className="px-3 flex gap-1 text-xs">
            {(["emoji", "gifs", "stickers"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPickerTab(tab)}
                className={`px-2.5 py-1 rounded-full capitalize transition ${
                  pickerTab === tab ? "bg-accent text-white" : "text-muted hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {pickerTab === "emoji" ? (
            <div className="px-3 pt-2 grid grid-cols-8 gap-1">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendSticker(s)}
                  className="text-2xl rounded-lg hover:bg-white/10 py-1 transition"
                  aria-label={`Send ${s} sticker`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="pt-2">
              <GifPicker
                type={pickerTab === "gifs" ? "gifs" : "stickers"}
                onPick={(url) => {
                  postMessage(url);
                  setShowStickers(false);
                }}
              />
            </div>
          )}
        </div>
      )}
      <form onSubmit={send} className="p-3 border-t border-border flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowStickers((s) => !s)}
          className={`btn-secondary px-2.5 ${showStickers ? "border-accent/60" : ""}`}
          aria-label="Stickers"
          title="Stickers"
        >
          <Smile size={16} />
        </button>
        <input
          className="input"
          placeholder="Message or paste a GIF link…"
          value={body}
          onChange={onBodyChange}
          maxLength={2000}
        />
        <button className="btn-primary" type="submit" aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </>
  );
}
