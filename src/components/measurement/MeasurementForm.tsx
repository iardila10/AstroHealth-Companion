
import { useState } from 'react';
import { useHealthStore } from '../../stores/useHealthStore';
import { useAstronautStore } from '../../stores/useAstronautStore';
import { useUIStore } from '../../stores/useUIStore';
import type { MeasurementInput, Environment } from '../../types/health';
import { X } from 'lucide-react';

export const MeasurementForm = () => {
  const { isMeasurementFormOpen, closeMeasurementForm } = useUIStore();
  const currentEnvironment = useAstronautStore((s) => s.currentEnvironment);
  const setLoading = useHealthStore((s) => s.setLoading);

  const [formData, setFormData] = useState<Partial<MeasurementInput>>({
    environment: currentEnvironment,
  });

  if (!isMeasurementFormOpen) return null;

  const handleChange = (field: keyof MeasurementInput, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Replace with real API call
    // await healthService.submitMeasurement(formData as MeasurementInput);

    console.log('Submitting measurement:', formData);

    // Simulate success
    setTimeout(() => {
      setLoading(false);
      closeMeasurementForm();
      setFormData({ environment: currentEnvironment });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="text-lg font-semibold text-[#F8FAFC]">
            New Measurement
          </h2>
          <button
            onClick={closeMeasurementForm}
            className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={formData.heart_rate ?? ''}
                onChange={(e) => handleChange('heart_rate', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] tabular-nums"
                placeholder="72"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature ?? ''}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] tabular-nums"
                placeholder="36.6"
              />
            </div>

            {/* Systolic */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Systolic (mmHg)
              </label>
              <input
                type="number"
                value={formData.blood_pressure_sys ?? ''}
                onChange={(e) => handleChange('blood_pressure_sys', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] tabular-nums"
                placeholder="120"
              />
            </div>

            {/* Diastolic */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Diastolic (mmHg)
              </label>
              <input
                type="number"
                value={formData.blood_pressure_dia ?? ''}
                onChange={(e) => handleChange('blood_pressure_dia', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] tabular-nums"
                placeholder="80"
              />
            </div>

            {/* Glucose */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Glucose (mg/dL)
              </label>
              <input
                type="number"
                value={formData.glucose ?? ''}
                onChange={(e) => handleChange('glucose', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] tabular-nums"
                placeholder="95"
              />
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Sleep Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.sleep_hours ?? ''}
                onChange={(e) => handleChange('sleep_hours', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] tabular-nums"
                placeholder="7.5"
              />
            </div>
          </div>

          {/* Fatigue Level */}
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Fatigue Level (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.fatigue_level ?? 5}
              onChange={(e) => handleChange('fatigue_level', e.target.value)}
              className="w-full accent-[#22D3EE]"
            />
            <div className="flex justify-between text-xs text-[#64748B] mt-1">
              <span>1 - Low</span>
              <span className="text-[#F8FAFC] font-medium tabular-nums">
                {formData.fatigue_level ?? 5}
              </span>
              <span>10 - High</span>
            </div>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Environment
            </label>
            <select
              value={formData.environment}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  environment: e.target.value as Environment,
                }))
              }
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE]"
            >
              <option value="spacecraft">Spacecraft</option>
              <option value="lunar_base">Lunar Base</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeMeasurementForm}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#334155] text-sm font-medium text-[#94A3B8] hover:bg-[#334155] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#22D3EE] text-[#0F172A] text-sm font-semibold hover:bg-[#38BDF8] transition-colors"
            >
              Submit Measurement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};