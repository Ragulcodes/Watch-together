"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useRoomData } from "@/lib/useRoomData";
import { Link2, RotateCcw, RefreshCw, Crown } from "lucide-react";
import {
  DRIFT_THRESHOLD_SEC,
  SYNC_TOPIC,
  decode,
  electHost,
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

// Friendly title from a media URL's filename, for watch history.
function titleFromUrl(u: string): string {
  try {
    const last = decodeURIComponent(new URL(u).pathname.split("/").pop() || "");
    const name = last.replace(/\.[a-z0-9]+$/i, "").replace(/[._-]+/g, " ").trim();
    return name || "A movie";
  } catch {
    return "A movie";
  }
}

export function SyncedPlayer(props: {
  roomSlug: string;
  isHost: boolean; // true only for the actual room owner (can persist via PATCH)
  ownerId: string;
  currentUserId: string;
  initialMedia: InitialMedia;
}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const suppressNextEvent = useRef(false);
  const wasBuffering = useRef(false);
  const watchIdRef = useRef<string | null>(null);
  const [media, setMedia] = useState<{ url: string | null; title: string | null }>({
    url: props.initialMedia.url,
    title: props.initialMedia.title,
  });
  const [showLoad, setShowLoad] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  /**
   * Host migration: the owner is authoritative while present. If they leave,
   * every client deterministically elects the same fallback host — the present
   * participant with the lowest identity — so playback keeps syncing. This is
   * computed identically on each client from the shared participant list, so no
   * election messages are needed.
   */
  const { amEffectiveHost, electedHostId } = useMemo(() => {
    const ids = participants.map((p) => p.identity);
    const elected = electHost(ids, props.ownerId, props.currentUserId);
    return { amEffectiveHost: elected === props.currentUserId, electedHostId: elected };
  }, [participants, props.ownerId, props.currentUserId]);

  const isMigratedHost = amEffectiveHost && !props.isHost;

  const send = useCallback(
    (ev: SyncEvent) => {
      room.localParticipant
        .publishData(encode(ev), { reliable: true, topic: SYNC_TOPIC })
        .catch(() => undefined);
    },
    [room],
  );

  // Best-effort durable anchor for late joiners — only the real owner passes PATCH auth.
  const persistState = useCallback(
    (patch: {
      isPlaying?: boolean;
      positionSec?: number;
      mediaUrl?: string | null;
      mediaTitle?: string | null;
    }) => {
      if (!props.isHost) return;
      fetch(`/api/rooms/${props.roomSlug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => undefined);
    },
    [props.isHost, props.roomSlug],
  );

  const requestState = useCallback(() => {
    send({ type: "request-state", senderId: props.currentUserId });
  }, [send, props.currentUserId]);

  // Compute the expected position at "now" given last anchor.
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
  useRoomData(SYNC_TOPIC, (payload) => {
    const ev = decode<SyncEvent>(payload);
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
    } else if (ev.type === "request-state" && amEffectiveHost) {
      send({
        type: "heartbeat",
        positionSec: v.currentTime,
        isPlaying: !v.paused,
        at: Date.now(),
        senderId: props.currentUserId,
      });
    }
    setTimeout(() => {
      suppressNextEvent.current = false;
    }, 50);
  });

  // Effective host heartbeats every 5s; everyone else asks for current state once.
  useEffect(() => {
    if (!amEffectiveHost) {
      requestState();
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
  }, [amEffectiveHost, props.currentUserId, send, requestState]);

  // Accumulate "watched together" time every 30s while actually playing.
  useEffect(() => {
    const i = setInterval(() => {
      const v = videoRef.current;
      if (!amEffectiveHost || !watchIdRef.current || !v || v.paused) return;
      fetch("/api/watch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "tick", id: watchIdRef.current, seconds: 30 }),
      }).catch(() => undefined);
    }, 30000);
    return () => clearInterval(i);
  }, [amEffectiveHost]);

  // Only the effective host broadcasts authoritative transport events.
  const onPlay = () => {
    if (suppressNextEvent.current || !amEffectiveHost) return;
    const v = videoRef.current!;
    send({ type: "play", positionSec: v.currentTime, at: Date.now(), senderId: props.currentUserId });
    persistState({ isPlaying: true, positionSec: v.currentTime });
  };
  const onPause = () => {
    if (suppressNextEvent.current || !amEffectiveHost) return;
    const v = videoRef.current!;
    send({ type: "pause", positionSec: v.currentTime, at: Date.now(), senderId: props.currentUserId });
    persistState({ isPlaying: false, positionSec: v.currentTime });
  };
  const onSeeked = () => {
    if (suppressNextEvent.current || !amEffectiveHost) return;
    const v = videoRef.current!;
    send({ type: "seek", positionSec: v.currentTime, at: Date.now(), senderId: props.currentUserId });
    persistState({ positionSec: v.currentTime });
  };

  // Catch-up: when a viewer's playback stalls (buffering) then resumes, re-ask
  // the host for the live position so they snap back into sync automatically.
  const onWaiting = () => {
    if (!amEffectiveHost) wasBuffering.current = true;
  };
  const onPlaying = () => {
    if (!amEffectiveHost && wasBuffering.current) {
      wasBuffering.current = false;
      requestState();
    }
  };

  const loadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setMedia({ url: urlInput, title: null });
    send({ type: "load", mediaUrl: urlInput, senderId: props.currentUserId });
    persistState({ mediaUrl: urlInput, mediaTitle: null, isPlaying: false, positionSec: 0 });
    // Start a watch-history entry (host only — persistState already gates owner;
    // any effective host records the title so it shows on the welcome page).
    fetch("/api/watch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "start", title: titleFromUrl(urlInput), url: urlInput }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) watchIdRef.current = d.id;
      })
      .catch(() => undefined);
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
            onWaiting={onWaiting}
            onPlaying={onPlaying}
          />
        ) : (
          <div className="text-center text-muted">
            <p className="text-lg text-white">Nothing playing yet</p>
            <p className="text-sm mt-1">
              {amEffectiveHost
                ? "Paste a video URL to start the watch party."
                : "Waiting for the host to start something…"}
            </p>
            {amEffectiveHost && (
              <button onClick={() => setShowLoad(true)} className="btn-primary mt-4">
                <Link2 size={16} /> Load video
              </button>
            )}
          </div>
        )}
      </div>

      {/* Migrated-host badge */}
      {isMigratedHost && media.url && (
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded bg-accent/80 px-2 py-1 text-xs text-white">
          <Crown size={12} /> You’re hosting playback
        </div>
      )}

      {/* Viewer catch-up button */}
      {!amEffectiveHost && media.url && (
        <button
          onClick={requestState}
          className="absolute top-3 right-3 btn-secondary"
          title="Re-sync to the host's position"
        >
          <RefreshCw size={14} /> Sync to host
        </button>
      )}

      {amEffectiveHost && media.url && (
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
