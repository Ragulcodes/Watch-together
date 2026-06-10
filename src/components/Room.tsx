"use client";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { RoomStage } from "./RoomStage";
import { roomOptions } from "@/lib/roomOptions";

type InitialMedia = {
  url: string | null;
  title: string | null;
  isPlaying: boolean;
  positionSec: number;
  positionAt: string;
};

export function Room(props: {
  roomSlug: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  currentUserId: string;
  initialMedia: InitialMedia;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(props.roomSlug)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "Could not join room");
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setToken(data.token);
      setUrl(data.url);
    })();
    return () => { cancelled = true; };
  }, [props.roomSlug]);

  if (err) {
    return (
      <main className="flex-1 grid place-items-center p-10">
        <div className="card p-8 text-center">
          <h2 className="text-xl text-white">Couldn’t join</h2>
          <p className="text-muted mt-2">{err}</p>
        </div>
      </main>
    );
  }
  if (!token || !url) {
    return (
      <main className="flex-1 grid place-items-center p-10">
        <div className="text-muted">Connecting…</div>
      </main>
    );
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      token={token}
      serverUrl={url}
      options={roomOptions}
      connect
      video={false}
      audio={false}
      className="flex-1 flex flex-col"
    >
      <RoomAudioRenderer />
      <RoomStage
        roomSlug={props.roomSlug}
        roomName={props.roomName}
        ownerId={props.ownerId}
        ownerName={props.ownerName}
        currentUserId={props.currentUserId}
        initialMedia={props.initialMedia}
      />
    </LiveKitRoom>
  );
}
