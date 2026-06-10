"use client";
import { useTracks, VideoTrack, isTrackReference } from "@livekit/components-react";
import { Track } from "livekit-client";

export function ScreenShareView() {
  const tracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);
  const share = tracks.find(isTrackReference);
  if (!share) return null;
  return (
    <div className="absolute inset-0 z-10 bg-black">
      <VideoTrack trackRef={share} className="w-full h-full object-contain" />
      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs text-white">
        🖥️ {share.participant.name ?? share.participant.identity} is sharing
      </div>
    </div>
  );
}
