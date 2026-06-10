"use client";
import {
  useTracks,
  ParticipantTile,
  ConnectionQualityIndicator,
  TrackRefContext,
  useIsSpeaking,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";

function Tile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const speaking = useIsSpeaking(trackRef.participant as Participant);
  return (
    <TrackRefContext.Provider value={trackRef}>
      <div
        className={`relative w-44 h-28 rounded-lg overflow-hidden bg-black flex-shrink-0 border transition-all ${
          speaking
            ? "border-accent2 ring-2 ring-accent2/60"
            : "border-border"
        }`}
      >
        <ParticipantTile trackRef={trackRef} />
        <div className="absolute top-1 right-1 rounded bg-black/50 px-1 py-0.5">
          <ConnectionQualityIndicator />
        </div>
      </div>
    </TrackRefContext.Provider>
  );
}

export function VideoStage() {
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
          />
        ))
      )}
    </div>
  );
}
