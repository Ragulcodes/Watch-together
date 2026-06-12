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
import { UserX, MicOff, Pin, PinOff } from "lucide-react";

type HostProps = {
  isHost: boolean;
  roomSlug: string;
  ownerId: string;
  currentUserId: string;
};
type StageProps = HostProps & {
  pinnedId: string | null;
  onPin: (identity: string) => void;
};

function Tile({
  trackRef,
  host,
  pinnedId,
  onPin,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  host: HostProps;
  pinnedId: string | null;
  onPin: (identity: string) => void;
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
        className={`group relative w-44 h-28 rounded-lg overflow-hidden bg-black flex-shrink-0 border transition-all ${
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

export function VideoStage({ pinnedId, onPin, ...host }: StageProps) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto">
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
          />
        ))
      )}
    </div>
  );
}
