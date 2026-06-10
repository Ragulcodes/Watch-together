"use client";
import { useCallback, useEffect, useState } from "react";
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
  const [needPasscode, setNeedPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchToken = useCallback(async () => {
    const res = await fetch(
      `/api/livekit/token?room=${encodeURIComponent(props.roomSlug)}`,
    );
    if (res.status === 403) {
      const d = await res.json().catch(() => ({}));
      if (d.code === "passcode_required") {
        setNeedPasscode(true);
        return;
      }
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not join room");
      return;
    }
    const data = await res.json();
    setToken(data.token);
    setUrl(data.url);
    setNeedPasscode(false);
  }, [props.roomSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchToken();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchToken]);

  const submitPasscode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setJoining(true);
      setErr(null);
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(props.roomSlug)}/join`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ passcode }),
        },
      );
      setJoining(false);
      if (!res.ok) {
        setErr("Incorrect passcode — try again.");
        return;
      }
      await fetchToken();
    },
    [passcode, props.roomSlug, fetchToken],
  );

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

  if (needPasscode) {
    return (
      <main className="flex-1 grid place-items-center p-10">
        <form onSubmit={submitPasscode} className="card p-8 w-full max-w-sm text-center">
          <h2 className="text-xl text-white">🔒 Private room</h2>
          <p className="text-muted mt-2 text-sm">
            Enter the passcode to join <span className="text-white">{props.roomName}</span>.
          </p>
          <input
            autoFocus
            type="password"
            className="input mt-4"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          <button className="btn-primary w-full mt-3" disabled={joining}>
            {joining ? "Joining…" : "Join room"}
          </button>
        </form>
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
