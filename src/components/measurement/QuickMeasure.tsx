
import { Plus } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const QuickMeasure = () => {
  const openMeasurementForm = useUIStore((s) => s.openMeasurementForm);

  return (
    <button
      onClick={openMeasurementForm}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#22D3EE] text-[#0F172A] text-sm font-semibold hover:bg-[#38BDF8] transition-colors shadow-lg shadow-[#22D3EE]/20"
    >
      <Plus size={16} />
      New Measurement
    </button>
  );
};