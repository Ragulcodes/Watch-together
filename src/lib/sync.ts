// Wire-format for synced-playback events sent over LiveKit data channels.
export type SyncEvent =
  | { type: "play"; positionSec: number; at: number; senderId: string }
  | { type: "pause"; positionSec: number; at: number; senderId: string }
  | { type: "seek"; positionSec: number; at: number; senderId: string }
  | { type: "load"; mediaUrl: string; title?: string; senderId: string }
  | { type: "heartbeat"; positionSec: number; isPlaying: boolean; at: number; senderId: string }
  | { type: "request-state"; senderId: string };

export const SYNC_TOPIC = "watch-sync";
export const CHAT_TOPIC = "watch-chat";

export type ChatEvent = {
  type: "chat";
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  at: number;
};

export function encode(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj));
}

export function decode<T>(buf: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(buf)) as T;
}

// Drift tolerance (seconds) before snapping the local player to remote state.
export const DRIFT_THRESHOLD_SEC = 1.25;
