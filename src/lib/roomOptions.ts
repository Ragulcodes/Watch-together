import {
  type RoomOptions,
  type ScreenShareCaptureOptions,
  VideoPresets,
} from "livekit-client";

/**
 * High-clarity defaults for the watch-party room.
 *
 * - VP9 codec with an H.264 backup → ~40% better quality-per-bitrate than VP8,
 *   while still serving Safari/older subscribers via the backup encoding.
 * - Simulcast layers (360p/720p/1080p) so each viewer auto-receives the best
 *   quality their bandwidth supports — `adaptiveStream` + `dynacast` pause and
 *   downgrade layers nobody is watching, saving CPU/bandwidth for what matters.
 * - 1080p capture default; audio with RED (packet-loss redundancy) + DTX.
 */
export const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h1080.resolution,
  },
  audioCaptureDefaults: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
  },
  publishDefaults: {
    simulcast: true,
    videoSimulcastLayers: [
      VideoPresets.h360,
      VideoPresets.h720,
      VideoPresets.h1080,
    ],
    videoCodec: "vp9",
    backupCodec: true,
    red: true,
    dtx: true,
    videoEncoding: VideoPresets.h1080.encoding,
    // High-bitrate screen share — this is the movie stream, so clarity matters most.
    screenShareEncoding: { maxBitrate: 6_000_000, maxFramerate: 30 },
  },
};

/**
 * Screen-share capture tuned for watching video together:
 * - `contentHint: "motion"` tells the encoder to favour smooth motion over
 *   per-frame sharpness (correct for movies; use "detail" for slides/code).
 * - `systemAudio: "include"` + `audio: true` pull the movie's soundtrack through.
 */
export const movieScreenShareOptions: ScreenShareCaptureOptions = {
  audio: true,
  systemAudio: "include",
  contentHint: "motion",
  resolution: VideoPresets.h1080.resolution,
  selfBrowserSurface: "include",
};
