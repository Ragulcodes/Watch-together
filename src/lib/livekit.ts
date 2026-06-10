import { AccessToken } from "livekit-server-sdk";

export async function mintLiveKitToken(opts: {
  roomName: string;
  identity: string;
  name: string;
  canPublish?: boolean;
  isHost?: boolean;
}) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are not configured");
  }
  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: 60 * 60 * 6, // 6h
  });
  at.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish: opts.canPublish ?? true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: opts.isHost ?? false,
  });
  return at.toJwt();
}
