"use client";
import { useCallback, useState } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, MessageSquare, PhoneOff, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { movieScreenShareOptions, movieScreenSharePublish } from "@/lib/roomOptions";

export function Controls({
  onToggleChat,
  chatOpen,
  onOpenSettings,
}: {
  onToggleChat: () => void;
  chatOpen: boolean;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [shareOn, setShareOn] = useState(false);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, [micOn, localParticipant]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
  }, [camOn, localParticipant]);

  const toggleShare = useCallback(async () => {
    const next = !shareOn;
    try {
      await localParticipant.setScreenShareEnabled(
        next,
        next ? movieScreenShareOptions : undefined,
        next ? movieScreenSharePublish : undefined,
      );
      setShareOn(next);
    } catch {
      setShareOn(false);
    }
  }, [shareOn, localParticipant]);

  const leave = useCallback(async () => {
    await room.disconnect();
    router.push("/rooms");
  }, [room, router]);

  return (
    <div className="flex items-center gap-2">
      <IconBtn active={micOn} onClick={toggleMic}
        on={<Mic size={18} />} off={<MicOff size={18} />} label="Mic" />
      <IconBtn active={camOn} onClick={toggleCam}
        on={<Video size={18} />} off={<VideoOff size={18} />} label="Camera" />
      <IconBtn active={shareOn} onClick={toggleShare}
        on={<MonitorUp size={18} />} off={<MonitorOff size={18} />} label="Share" />
      <button
        className="btn-icon bg-white/10 text-white hover:bg-white/20"
        onClick={onOpenSettings}
        title="Camera & mic settings"
        aria-label="Open camera and microphone settings"
      >
        <Settings size={18} />
      </button>
      <button
        className={`btn-icon text-white ${chatOpen ? "bg-accent" : "bg-white/10 hover:bg-white/20"}`}
        onClick={onToggleChat}
        title="Toggle chat"
        aria-label="Toggle chat panel"
        aria-pressed={chatOpen}
      >
        <MessageSquare size={18} />
      </button>
      <button
        onClick={leave}
        className="btn-icon bg-danger text-white hover:brightness-110"
        title="Leave room"
        aria-label="Leave room"
      >
        <PhoneOff size={18} />
      </button>
    </div>
  );
}

function IconBtn({
  active, onClick, on, off, label,
}: {
  active: boolean;
  onClick: () => void;
  on: React.ReactNode;
  off: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={`${label}: ${active ? "on" : "off"}`}
      aria-pressed={active}
      className={`btn-icon text-white ${active ? "bg-accent" : "bg-white/10 hover:bg-white/20"}`}
    >
      {active ? on : off}
    </button>
  );
}
