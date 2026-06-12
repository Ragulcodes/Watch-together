"use client";
import { useCallback } from "react";
import {
  useTracks,
  ParticipantTile,
  ConnectionQualityIndicator,
  TrackRefContext,
  useIsSpeaking,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { UserX, MicOff, Pin, PinOff, Maximize2 } from "lucide-react";

type TileSize = "sm" | "md" | "lg";
const SIZE_DIMS: Record<TileSize, string> = {
  sm: "w-32 h-20",
  md: "w-44 h-28",
  lg: "w-64 h-40",
};
const SIZE_ORDER: TileSize[] = ["sm", "md", "lg"];

type HostProps = {
  isHost: boolean;
  roomSlug: string;
  ownerId: string;
  currentUserId: string;
};
type StageProps = HostProps & {
  pinnedId: string | null;
  onPin: (identity: string) => void;
  size: TileSize;
  onSize: (s: TileSize) => void;
};

function Tile({
  trackRef,
  host,
  pinnedId,
  onPin,
  dims,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  host: HostProps;
  pinnedId: string | null;
  onPin: (identity: string) => void;
  dims: string;
}) {
  const participant = trackRef.participant as Participant;
  const speaking = useIsSpeaking(participant);
  const identity = participant.identity;
  const isPinned = pinnedId === identity;
  const canModerate =
    host.isHost && identity !== host.currentUserId && identity !== host.ownerId;

  const moderate = useCallback(
    async (action: "kick" | "mute") => {
      if (action === "kick" && !confirm(`Remove ${participant.name ?? identity} from the room?`))
        return;
      await fetch(`/api/rooms/${encodeURIComponent(host.roomSlug)}/moderate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, targetIdentity: identity }),
      }).catch(() => undefined);
    },
    [host.roomSlug, identity, participant],
  );

  return (
    <TrackRefContext.Provider value={trackRef}>
      <div
        className={`group relative ${dims} rounded-lg overflow-hidden bg-black flex-shrink-0 border transition-all ${
          isPinned
            ? "border-accent ring-2 ring-accent/70"
            : speaking
              ? "border-accent2 ring-2 ring-accent2/60"
              : "border-border"
        }`}
      >
        <ParticipantTile trackRef={trackRef} />
        <div className="absolute top-1 right-1 rounded bg-black/50 px-1 py-0.5">
          <ConnectionQualityIndicator />
        </div>
        <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onPin(identity)}
            title={isPinned ? "Exit spotlight" : "Spotlight"}
            aria-label={isPinned ? "Exit spotlight" : "Spotlight this person"}
            className="grid place-items-center w-6 h-6 rounded bg-black/70 hover:bg-black text-white"
          >
            {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          {canModerate && (
            <>
              <button
                onClick={() => moderate("mute")}
                title="Mute their tracks"
                className="grid place-items-center w-6 h-6 rounded bg-black/70 hover:bg-black text-white"
              >
                <MicOff size={13} />
              </button>
              <button
                onClick={() => moderate("kick")}
                title="Remove from room"
                className="grid place-items-center w-6 h-6 rounded bg-danger/80 hover:bg-danger text-white"
              >
                <UserX size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </TrackRefContext.Provider>
  );
}

export function VideoStage({ pinnedId, onPin, size, onSize, ...host }: StageProps) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );
  const nextSize = SIZE_ORDER[(SIZE_ORDER.indexOf(size) + 1) % SIZE_ORDER.length];

  return (
    <div className="flex items-stretch gap-2 px-4 py-3 overflow-x-auto">
      {tracks.length > 0 && (
        <button
          onClick={() => onSize(nextSize)}
          title={`Resize videos (${size.toUpperCase()})`}
          aria-label="Resize participant videos"
          className="btn-icon bg-white/10 text-white hover:bg-white/20 sticky left-0 z-10 flex-shrink-0 self-center"
        >
          <Maximize2 size={16} />
        </button>
      )}
      {tracks.length === 0 ? (
        <div className="text-muted text-sm py-6">
          Turn on your camera or mic to join the conversation.
        </div>
      ) : (
        tracks.map((trackRef) => (
          <Tile
            key={trackRef.participant.identity + ":" + trackRef.source}
            trackRef={trackRef}
            host={host}
            pinnedId={pinnedId}
            onPin={onPin}
            dims={SIZE_DIMS[size]}
          />
        ))
      )}
    </div>
  );
}
