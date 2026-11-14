
import { Camera, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const CameraInput = () => {
  const { isCameraMode, setCameraMode, closeMeasurementForm } = useUIStore();

  if (!isCameraMode) {
    return (
      <button
        onClick={() => setCameraMode(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#334155] text-sm text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors"
      >
        <Camera size={16} />
        Use Camera
      </button>
    );
  }

  return (
    <div className="relative bg-[#0F172A] border border-[#334155] rounded-xl overflow-hidden">
      <div className="aspect-video flex items-center justify-center bg-[#1E293B]">
        <div className="text-center">
          <Camera size={40} className="mx-auto text-[#64748B] mb-3" />
          <p className="text-sm text-[#94A3B8]">Camera feed placeholder</p>
          <p className="text-xs text-[#64748B] mt-1">
            (Will be connected in future iteration)
          </p>
        </div>
      </div>

      <button
        onClick={() => setCameraMode(false)}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-black/50 text-[#F8FAFC] hover:bg-black/70"
      >
        <X size={16} />
      </button>
    </div>
  );
};