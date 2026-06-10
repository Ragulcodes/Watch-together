"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataChannel, useRoomContext } from "@livekit/components-react";
import { Link2, RotateCcw } from "lucide-react";
import {
  DRIFT_THRESHOLD_SEC,
  SYNC_TOPIC,
  decode,
  encode,
  type SyncEvent,
} from "@/lib/sync";

type InitialMedia = {
  url: string | null;
  title: string | null;
  isPlaying: boolean;
  positionSec: number;
  positionAt: string;
};

export function SyncedPlayer(props: {
  roomSlug: string;
  isHost: boolean;
  currentUserId: string;
  initialMedia: InitialMedia;
}) {
  const room = useRoomContext();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const suppressNextEvent = useRef(false);
  const [media, setMedia] = useState<{ url: string | null; title: string | null }>({
    url: props.initialMedia.url,
    title: props.initialMedia.title,
  });
  const [showLoad, setShowLoad] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const send = useCallback(
    (ev: SyncEvent) => {
      room.localParticipant
        .publishData(encode(ev), { reliable: true, topic: SYNC_TOPIC })
        .catch(() => undefined);
    },
    [room],
  );

  // Compute the expected position at "now" given last anchor (positionSec, positionAt, isPlaying).
  const initialPosRef = useRef<number>(
    props.initialMedia.isPlaying
      ? props.initialMedia.positionSec +
        Math.max(
          0,
          (Date.now() - new Date(props.initialMedia.positionAt).getTime()) / 1000,
        )
      : props.initialMedia.positionSec,
  );

  // Apply initial state once metadata is loaded.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !media.url) return;
    const onLoaded = () => {
      v.currentTime = initialPosRef.current || 0;
      if (props.initialMedia.isPlaying) v.play().catch(() => undefined);
    };
    v.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [media.url, props.initialMedia.isPlaying]);

  // Listen for sync events from peers.
  useDataChannel(SYNC_TOPIC, (msg) => {
    const ev = decode<SyncEvent>(msg.payload);
    if (ev.senderId === props.currentUserId) return;
    const v = videoRef.current;
    if (!v) return;
    suppressNextEvent.current = true;
    if (ev.type === "load") {
      setMedia({ url: ev.mediaUrl, title: ev.title ?? null });
    } else if (ev.type === "play") {
      v.currentTime = ev.positionSec;
      v.play().catch(() => undefined);
    } else if (ev.type === "pause") {
      v.currentTime = ev.positionSec;
      v.pause();
    } else if (ev.type === "seek") {
      v.currentTime = ev.positionSec;
    } else if (ev.type === "heartbeat") {
      const drift = Math.abs(v.currentTime - ev.positionSec);
      if (drift > DRIFT_THRESHOLD_SEC) v.currentTime = ev.positionSec;
      if (ev.isPlaying && v.paused) v.play().catch(() => undefined);
      if (!ev.isPlaying && !v.paused) v.pause();
    } else if (ev.type === "request-state" && props.isHost) {
      send({
        type: "heartbeat",
        positionSec: v.currentTime,
        isPlaying: !v.paused,
        at: Date.now(),
        senderId: props.currentUserId,
      });
    }
    // Allow our own events to flow again after this tick.
    setTimeout(() => { suppressNextEvent.current = false; }, 50);
  });

  // Heartbeat from host every 5s
  useEffect(() => {
    if (!props.isHost) {
      send({ type: "request-state", senderId: props.currentUserId });
      return;
    }
    const i = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      send({
        type: "heartbeat",
        positionSec: v.currentTime,
        isPlaying: !v.paused,
        at: Date.now(),
        senderId: props.currentUserId,
      });
    }, 5000);
    return () => clearInterval(i);
  }, [props.isHost, props.currentUserId, send]);

  // Local video event handlers (only the host broadcasts authoritative play/pause/seek;
  // members' local interactions are absorbed by the heartbeat snap-back).
  const onPlay = () => {
    if (suppressNextEvent.current || !props.isHost) return;
    const v = videoRef.current!;
    send({ type: "play", positionSec: v.currentTime, at: Date.now(), senderId: props.currentUserId });
    persistState({ isPlaying: true, positionSec: v.currentTime });
  };
  const onPause = () => {
    if (suppressNextEvent.current || !props.isHost) return;
    const v = videoRef.current!;
    send({ type: "pause", positionSec: v.currentTime, at: Date.now(), senderId: props.currentUserId });
    persistState({ isPlaying: false, positionSec: v.currentTime });
  };
  const onSeeked = () => {
    if (suppressNextEvent.current || !props.isHost) return;
    const v = videoRef.current!;
    send({ type: "seek", positionSec: v.currentTime, at: Date.now(), senderId: props.currentUserId });
    persistState({ positionSec: v.currentTime });
  };

  const persistState = (patch: { isPlaying?: boolean; positionSec?: number; mediaUrl?: string | null; mediaTitle?: string | null }) => {
    fetch(`/api/rooms/${props.roomSlug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => undefined);
  };

  const loadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setMedia({ url: urlInput, title: null });
    send({ type: "load", mediaUrl: urlInput, senderId: props.currentUserId });
    persistState({ mediaUrl: urlInput, mediaTitle: null, isPlaying: false, positionSec: 0 });
    setUrlInput("");
    setShowLoad(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1 grid place-items-center">
        {media.url ? (
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-full object-contain bg-black"
            controls
            playsInline
            onPlay={onPlay}
            onPause={onPause}
            onSeeked={onSeeked}
          />
        ) : (
          <div className="text-center text-muted">
            <p className="text-lg text-white">Nothing playing yet</p>
            <p className="text-sm mt-1">
              {props.isHost
                ? "Paste a video URL to start the watch party."
                : "Waiting for the host to start something…"}
            </p>
            {props.isHost && (
              <button onClick={() => setShowLoad(true)} className="btn-primary mt-4">
                <Link2 size={16} /> Load video
              </button>
            )}
          </div>
        )}
      </div>

      {props.isHost && media.url && (
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="btn-secondary" onClick={() => setShowLoad(true)}>
            <Link2 size={14} /> Change
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.currentTime = 0;
              send({ type: "seek", positionSec: 0, at: Date.now(), senderId: props.currentUserId });
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      {showLoad && (
        <div className="absolute inset-0 bg-black/70 z-20 grid place-items-center">
          <form onSubmit={loadUrl} className="card p-6 w-full max-w-md">
            <h3 className="text-white font-medium">Load a video</h3>
            <p className="text-muted text-xs mt-1">
              Direct .mp4 / .webm URL, or any media the browser can play.
            </p>
            <input
              autoFocus
              className="input mt-3"
              placeholder="https://example.com/movie.mp4"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button type="button" className="btn-ghost" onClick={() => setShowLoad(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">Load</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
