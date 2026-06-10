"use client";
import { useTracks, ParticipantTile } from "@livekit/components-react";
import { Track } from "livekit-client";

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
          <div
            key={trackRef.participant.identity + ":" + trackRef.source}
            className="w-44 h-28 rounded-lg overflow-hidden border border-border bg-black flex-shrink-0"
          >
            <ParticipantTile trackRef={trackRef} />
          </div>
        ))
      )}
    </div>
  );
}
