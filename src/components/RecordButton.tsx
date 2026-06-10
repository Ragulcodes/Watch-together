"use client";
import { useCallback, useEffect, useState } from "react";
import { Circle, Square } from "lucide-react";

export function RecordButton({
  roomSlug,
  isHost,
}: {
  roomSlug: string;
  isHost: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/record`);
    if (res.ok) {
      const d = await res.json();
      setRecording(!!d.recording);
    }
  }, [roomSlug]);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 8000); // keep everyone's indicator current
    return () => clearInterval(i);
  }, [refresh]);

  const toggle = useCallback(async () => {
    setBusy(true);
    setNote(null);
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/record`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: recording ? "stop" : "start" }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setNote(d.error ?? "Recording action failed");
      setTimeout(() => setNote(null), 4000);
      return;
    }
    const d = await res.json();
    setRecording(!!d.recording);
  }, [recording, roomSlug]);

  // Non-hosts only see a passive indicator (and only while recording).
  if (!isHost) {
    if (!recording) return null;
    return (
      <span className="flex items-center gap-1 text-xs text-danger" title="This room is being recorded">
        <Circle size={10} className="fill-danger animate-pulse" /> REC
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={busy}
        title={recording ? "Stop recording" : "Record this session"}
        className={`btn ${
          recording
            ? "bg-danger/90 hover:bg-danger text-white"
            : "bg-panel2 text-white border border-border hover:border-accent/60"
        }`}
      >
        {recording ? <Square size={14} className="fill-white" /> : <Circle size={14} className="fill-danger text-danger" />}
        <span className="hidden sm:inline">{recording ? "Stop" : "Record"}</span>
      </button>
      {note && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded bg-panel2 border border-border p-2 text-xs text-danger z-50">
          {note}
        </div>
      )}
    </div>
  );
}
