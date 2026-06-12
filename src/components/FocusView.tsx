"use client";
import {
  useTracks,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { X, UserRound } from "lucide-react";

/**
 * Teams-style spotlight: fills the main stage with one pinned participant's
 * camera. "Exit spotlight" returns the stage to the movie / screen share.
 */
export function FocusView({
  identity,
  onUnpin,
}: {
  identity: string;
  onUnpin: () => void;
}) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const ref = tracks.find(
    (t) => t.participant.identity === identity && isTrackReference(t),
  );
  const name = ref?.participant.name || "Participant";

  return (
    <div className="absolute inset-0 z-20 bg-black">
      {ref && isTrackReference(ref) ? (
        <VideoTrack trackRef={ref} className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full grid place-items-center text-muted">
          <div className="text-center">
            <UserRound size={48} className="mx-auto opacity-50" />
            <p className="mt-3">{name}&rsquo;s camera is off</p>
          </div>
        </div>
      )}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 backdrop-blur px-3 py-1 text-xs text-white">
        Spotlighting {name}
      </div>
      <button onClick={onUnpin} className="btn-secondary absolute top-3 right-3 z-20">
        <X size={15} /> Exit spotlight
      </button>
    </div>
  );
}
