"use client";
import { useMediaDeviceSelect } from "@livekit/components-react";
import { X, Camera, Mic, Volume2 } from "lucide-react";

function DeviceSelect({
  kind,
  icon,
  label,
}: {
  kind: MediaDeviceKind;
  icon: React.ReactNode;
  label: string;
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind });

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-muted mb-1">
        {icon} {label}
      </label>
      <select
        className="input"
        value={activeDeviceId}
        onChange={(e) => setActiveMediaDevice(e.target.value)}
      >
        {devices.length === 0 && <option>No devices found</option>}
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `${label} (${d.deviceId.slice(0, 6)}…)`}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DeviceSettings({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/70 grid place-items-center p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Devices</h3>
          <button onClick={onClose} className="btn-ghost p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-muted mt-1">
          Pick your camera, mic, and speakers. Grant browser permission first if
          the lists are empty.
        </p>
        <div className="mt-4 space-y-4">
          <DeviceSelect kind="videoinput" icon={<Camera size={14} />} label="Camera" />
          <DeviceSelect kind="audioinput" icon={<Mic size={14} />} label="Microphone" />
          <DeviceSelect kind="audiooutput" icon={<Volume2 size={14} />} label="Speakers" />
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-primary">Done</button>
        </div>
      </div>
    </div>
  );
}
