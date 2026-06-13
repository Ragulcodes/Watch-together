"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useParticipants } from "@livekit/components-react";
import { VideoStage } from "./VideoStage";
import { Controls } from "./Controls";
import { SyncedPlayer } from "./SyncedPlayer";
import { ChatPanel } from "./ChatPanel";
import { ScreenShareView } from "./ScreenShareView";
import { DeviceSettings } from "./DeviceSettings";
import { Reactions } from "./Reactions";
import { RecordButton } from "./RecordButton";
import { FocusView } from "./FocusView";
import { Toasts } from "./Toasts";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { ShareQuality } from "@/lib/roomOptions";
import { Crown, Users, Link2, Trash2, Check } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  const [shareQuality, setShareQuality] = useState<ShareQuality>("1080p60");
  const [pinned, setPinned] = useState<string | null>(null);
  const [tileSize, setTileSize] = useState<"sm" | "md" | "lg">("md");
  const isHost = props.currentUserId === props.ownerId;
  const participants = useParticipants();
  const router = useRouter();

  const togglePin = useCallback(
    (id: string) => setPinned((p) => (p === id ? null : id)),
    [],
  );

  const copyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }, []);

  const deleteRoom = useCallback(async () => {
    if (!confirm("Delete this room for everyone? This can't be undone.")) return;
    const res = await fetch(`/api/rooms/${encodeURIComponent(props.roomSlug)}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/rooms");
  }, [props.roomSlug, router]);

  return (
    <div className="flex-1 flex min-h-0 relative">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="px-3 md:px-6 py-3 border-b border-border bg-white/[0.04] backdrop-blur-xl flex items-center justify-between gap-2 flex-wrap">
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
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={copyInvite}
              className="btn-secondary"
              title="Copy invite link"
              aria-label="Copy invite link to clipboard"
            >
              {copied ? <Check size={16} /> : <Link2 size={16} />}
              <span className="hidden md:inline">{copied ? "Copied!" : "Invite"}</span>
            </button>
            {isHost && (
              <button
                onClick={deleteRoom}
                className="btn bg-danger/80 hover:bg-danger text-white"
                title="Delete room"
                aria-label="Delete this room"
              >
                <Trash2 size={16} />
              </button>
            )}
            <RecordButton roomSlug={props.roomSlug} isHost={isHost} />
            <Controls
              onToggleChat={() => setShowChat((s) => !s)}
              chatOpen={showChat}
              onOpenSettings={() => setShowSettings(true)}
              shareQuality={shareQuality}
            />
          </div>
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
            {pinned && <FocusView identity={pinned} onUnpin={() => setPinned(null)} />}
            <Reactions />
            <Toasts currentUserId={props.currentUserId} />
          </div>
          {/* Participants strip */}
          <div className="bg-panel border-t border-border backdrop-blur-xl">
            <VideoStage
              isHost={isHost}
              roomSlug={props.roomSlug}
              ownerId={props.ownerId}
              currentUserId={props.currentUserId}
              pinnedId={pinned}
              onPin={togglePin}
              size={tileSize}
              onSize={setTileSize}
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
          className="flex flex-col bg-panel border-l border-border backdrop-blur-xl z-40
                     fixed inset-y-0 right-0 w-full max-w-sm
                     md:static md:inset-auto md:w-80 md:max-w-none md:z-auto"
        >
          <ChatPanel
            roomSlug={props.roomSlug}
            currentUserId={props.currentUserId}
            onClose={() => setShowChat(false)}
          />
        </aside>
      )}

      {showSettings && (
        <DeviceSettings
          onClose={() => setShowSettings(false)}
          shareQuality={shareQuality}
          setShareQuality={setShareQuality}
        />
      )}
    </div>
  );
}
