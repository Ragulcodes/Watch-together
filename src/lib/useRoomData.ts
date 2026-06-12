"use client";
import { useEffect, useRef } from "react";
import { RoomEvent, type RemoteParticipant } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";

/**
 * Subscribe to LiveKit data messages for a single topic via the room's raw
 * `DataReceived` event. This is robust when several topics are in use at once
 * (chat / sync / reactions) — multiple `useDataChannel` hooks can interfere,
 * whereas independent `room.on(DataReceived)` listeners each fire reliably.
 */
export function useRoomData(
  topic: string,
  onData: (payload: Uint8Array, from?: RemoteParticipant) => void,
) {
  const room = useRoomContext();
  const cb = useRef(onData);
  cb.current = onData;

  useEffect(() => {
    const handler = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      msgTopic?: string,
    ) => {
      if (msgTopic !== topic) return;
      cb.current(payload, participant);
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, topic]);
}
