import {
  type RoomOptions,
  type ScreenShareCaptureOptions,
  type TrackPublishOptions,
  VideoPresets,
} from "livekit-client";

/**
 * High-clarity defaults for the watch-party room.
 *
 * - VP9 codec with an H.264 backup for cameras (~40% better quality-per-bitrate).
 * - Simulcast layers (360p/720p/1080p) so each viewer auto-receives the best
 *   quality their bandwidth supports — `adaptiveStream` + `dynacast` pause and
 *   downgrade layers nobody is watching.
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
    // Fallback screen-share encoding (the explicit publish options below win).
    screenShareEncoding: { maxBitrate: 10_000_000, maxFramerate: 60 },
  },
};

/**
 * Screen-share CAPTURE tuned for watching a movie together:
 * - 1080p at 60fps capture.
 * - `contentHint: "motion"` → the encoder favours smooth motion (correct for video).
 * - `audio: true` with all voice-processing OFF → full-fidelity movie soundtrack
 *   (echo cancellation / noise suppression / auto-gain would mangle music).
 * - `systemAudio: "include"` pulls system/tab audio through where the browser allows.
 *
 * Note: audio capture from screen share is browser/OS dependent — sharing a
 * Chrome TAB with "share tab audio" works everywhere; sharing a whole screen
 * only carries audio on Windows/Chrome.
 */
export const movieScreenShareOptions: ScreenShareCaptureOptions = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
  systemAudio: "include",
  contentHint: "motion",
  resolution: { width: 1920, height: 1080, frameRate: 60 },
  selfBrowserSurface: "include",
};

/**
 * Screen-share PUBLISH options — the fix for the "slideshow" problem:
 * - `degradationPreference: "maintain-framerate"` → under load, drop a little
 *   resolution rather than tanking FPS (the default does the opposite, which is
 *   what made movies look like a slideshow).
 * - H.264 → hardware-accelerated encode, smooth at 1080p60 (VP9 1080p60 is
 *   software-encoded and pegs the CPU, causing dropped frames).
 * - `simulcast: false` → one full-quality layer, so viewers always get 1080p60
 *   instead of adaptiveStream picking a downscaled layer.
 * - 10 Mbps / 60fps, high priority.
 */
export const movieScreenSharePublish: TrackPublishOptions = {
  screenShareEncoding: { maxBitrate: 10_000_000, maxFramerate: 60, priority: "high" },
  degradationPreference: "maintain-framerate",
  simulcast: false,
  videoCodec: "h264",
};
