"use client";
import { useCallback, useState } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, MessageSquare, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";

export function Controls({
  onToggleChat,
  chatOpen,
}: {
  onToggleChat: () => void;
  chatOpen: boolean;
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
      await localParticipant.setScreenShareEnabled(next, { audio: true });
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
        on={<Mic size={16} />} off={<MicOff size={16} />} label="Mic" />
      <IconBtn active={camOn} onClick={toggleCam}
        on={<Video size={16} />} off={<VideoOff size={16} />} label="Camera" />
      <IconBtn active={shareOn} onClick={toggleShare}
        on={<MonitorUp size={16} />} off={<MonitorOff size={16} />} label="Share" />
      <button
        className={`btn-secondary ${chatOpen ? "border-accent/60 text-white" : ""}`}
        onClick={onToggleChat}
        title="Toggle chat"
      >
        <MessageSquare size={16} />
      </button>
      <button
        onClick={leave}
        className="btn bg-danger/90 hover:bg-danger text-white"
        title="Leave room"
      >
        <PhoneOff size={16} />
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
      className={`btn ${active ? "bg-accent text-white" : "bg-panel2 text-white border border-border hover:border-accent/60"}`}
    >
      {active ? on : off}
    </button>
  );
}
