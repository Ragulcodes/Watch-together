import {
  type RoomOptions,
  type ScreenShareCaptureOptions,
  type TrackPublishOptions,
  VideoPresets,
} from "livekit-client";

/**
 * High-clarity defaults for the watch-party room (cameras + audio).
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
    videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720, VideoPresets.h1080],
    videoCodec: "vp9",
    backupCodec: true,
    red: true,
    dtx: true,
    videoEncoding: VideoPresets.h1080.encoding,
    screenShareEncoding: { maxBitrate: 10_000_000, maxFramerate: 60 },
  },
};

/* -------------------------------------------------------------------------- */
/* Screen-share quality presets (host-selectable)                             */
/* -------------------------------------------------------------------------- */

export type ShareQuality = "1080p60" | "1440p60" | "2160p30";

export const SHARE_QUALITIES: {
  id: ShareQuality;
  label: string;
  hint: string;
}[] = [
  { id: "1080p60", label: "1080p · 60fps", hint: "Recommended — smooth on most connections" },
  { id: "1440p60", label: "1440p · 60fps", hint: "Sharper — needs ~15–20 Mbps upload" },
  { id: "2160p30", label: "4K · 30fps", hint: "Max detail — fast wired connection only" },
];

const PRESETS: Record<
  ShareQuality,
  { width: number; height: number; frameRate: number; maxBitrate: number }
> = {
  "1080p60": { width: 1920, height: 1080, frameRate: 60, maxBitrate: 10_000_000 },
  "1440p60": { width: 2560, height: 1440, frameRate: 60, maxBitrate: 16_000_000 },
  "2160p30": { width: 3840, height: 2160, frameRate: 30, maxBitrate: 30_000_000 },
};

/**
 * Screen-share CAPTURE for the chosen quality. Audio is captured with all
 * voice-processing OFF so a movie's soundtrack stays full-fidelity.
 * (Audio still depends on the browser/OS: share a Chrome TAB with "share tab
 * audio" for reliable sound everywhere.)
 */
export function screenShareCaptureFor(q: ShareQuality): ScreenShareCaptureOptions {
  const p = PRESETS[q];
  return {
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    systemAudio: "include",
    contentHint: "motion",
    resolution: { width: p.width, height: p.height, frameRate: p.frameRate },
    selfBrowserSurface: "include",
  };
}

/**
 * Screen-share PUBLISH for the chosen quality:
 * - `maintain-framerate` so motion stays smooth (no slideshow).
 * - H.264 hardware encode, single layer (no simulcast) → full quality to viewers.
 */
export function screenSharePublishFor(q: ShareQuality): TrackPublishOptions {
  const p = PRESETS[q];
  return {
    screenShareEncoding: { maxBitrate: p.maxBitrate, maxFramerate: p.frameRate, priority: "high" },
    degradationPreference: "maintain-framerate",
    simulcast: false,
    videoCodec: "h264",
  };
}
