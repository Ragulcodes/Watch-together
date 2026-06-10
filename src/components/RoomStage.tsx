"use client";
import { useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { VideoStage } from "./VideoStage";
import { Controls } from "./Controls";
import { SyncedPlayer } from "./SyncedPlayer";
import { ChatPanel } from "./ChatPanel";
import { ScreenShareView } from "./ScreenShareView";
import { DeviceSettings } from "./DeviceSettings";
import { Reactions } from "./Reactions";
import { Crown, Users } from "lucide-react";

export function RoomStage(props: {
  roomSlug: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  currentUserId: string;
  initialMedia: {
    url: string | null;
    title: string | null;
    isPlaying: boolean;
    positionSec: number;
    positionAt: string;
  };
}) {
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const isHost = props.currentUserId === props.ownerId;
  const participants = useParticipants();

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-white font-medium">{props.roomName}</h1>
            <div className="text-xs text-muted flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Crown size={12} className="text-accent2" /> Hosted by {props.ownerName}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {participants.length} here
              </span>
            </div>
          </div>
          <Controls
            onToggleChat={() => setShowChat((s) => !s)}
            chatOpen={showChat}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>

        <div className="flex-1 grid grid-rows-[1fr_auto] min-h-0">
          {/* Main stage: screen share if any, else synced player, else placeholder */}
          <div className="relative bg-black min-h-0 overflow-hidden">
            <ScreenShareView />
            <SyncedPlayer
              roomSlug={props.roomSlug}
              isHost={isHost}
              ownerId={props.ownerId}
              currentUserId={props.currentUserId}
              initialMedia={props.initialMedia}
            />
            <Reactions />
          </div>
          {/* Participants strip */}
          <div className="bg-panel border-t border-border">
            <VideoStage
              isHost={isHost}
              roomSlug={props.roomSlug}
              ownerId={props.ownerId}
              currentUserId={props.currentUserId}
            />
          </div>
        </div>
      </div>

      {showChat && (
        <aside className="w-80 border-l border-border bg-panel flex flex-col">
          <ChatPanel roomSlug={props.roomSlug} currentUserId={props.currentUserId} />
        </aside>
      )}

      {showSettings && <DeviceSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
