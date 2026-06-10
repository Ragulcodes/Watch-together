"use client";
import { useState } from "react";
import { VideoStage } from "./VideoStage";
import { Controls } from "./Controls";
import { SyncedPlayer } from "./SyncedPlayer";
import { ChatPanel } from "./ChatPanel";
import { ScreenShareView } from "./ScreenShareView";
import { Crown } from "lucide-react";

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
  const isHost = props.currentUserId === props.ownerId;

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-white font-medium">{props.roomName}</h1>
            <div className="text-xs text-muted flex items-center gap-1">
              <Crown size={12} className="text-accent2" /> Hosted by {props.ownerName}
            </div>
          </div>
          <Controls onToggleChat={() => setShowChat((s) => !s)} chatOpen={showChat} />
        </div>

        <div className="flex-1 grid grid-rows-[1fr_auto] min-h-0">
          {/* Main stage: screen share if any, else synced player, else placeholder */}
          <div className="relative bg-black min-h-0 overflow-hidden">
            <ScreenShareView />
            <SyncedPlayer
              roomSlug={props.roomSlug}
              isHost={isHost}
              currentUserId={props.currentUserId}
              initialMedia={props.initialMedia}
            />
          </div>
          {/* Participants strip */}
          <div className="bg-panel border-t border-border">
            <VideoStage />
          </div>
        </div>
      </div>

      {showChat && (
        <aside className="w-80 border-l border-border bg-panel flex flex-col">
          <ChatPanel roomSlug={props.roomSlug} currentUserId={props.currentUserId} />
        </aside>
      )}
    </div>
  );
}
