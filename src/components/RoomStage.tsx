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
import { Crown, Users, X } from "lucide-react";

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
    <div className="flex-1 flex min-h-0 relative">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-3 md:px-6 py-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-white font-medium truncate">{props.roomName}</h1>
            <div className="text-xs text-muted flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1">
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

      {/* Mobile backdrop */}
      {showChat && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowChat(false)}
        />
      )}

      {showChat && (
        <aside
          className="flex flex-col bg-panel border-l border-border z-40
                     fixed inset-y-0 right-0 w-full max-w-sm
                     md:static md:inset-auto md:w-80 md:max-w-none md:z-auto"
        >
          <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="text-white font-medium">Chat</span>
            <button onClick={() => setShowChat(false)} className="btn-ghost p-1" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>
          <ChatPanel roomSlug={props.roomSlug} currentUserId={props.currentUserId} />
        </aside>
      )}

      {showSettings && <DeviceSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
