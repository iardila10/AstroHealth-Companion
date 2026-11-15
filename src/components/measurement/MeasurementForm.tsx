import { useEffect, useState, type SubmitEvent } from "react";
import X from "lucide-react/icons/x";
import type { Environment, MeasurementInput } from "../../types/health";
import {
  submitMeasurement,
  type MeasurementCreatePayload,
} from "../../services/healthService";

interface MeasurementFormProps {
  astronautId: number;
  environment: Environment;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (synced: boolean) => void;
}

type NumericMeasurementField = Exclude<
  keyof MeasurementInput,
  "environment" | "notes"
>;

const numericFields: NumericMeasurementField[] = [
  "heart_rate",
  "temperature",
  "blood_pressure_sys",
  "blood_pressure_dia",
  "glucose",
  "sleep_hours",
];

export const MeasurementForm = ({
  astronautId,
  environment,
  isOpen,
  onClose,
  onSubmitted,
}: MeasurementFormProps) => {
  const [formData, setFormData] = useState<Partial<MeasurementInput>>({
    environment,
    fatigue_level: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({ environment, fatigue_level: 5 });
    setError(null);
  }, [astronautId, environment]);

  if (!isOpen) return null;

  const handleChange = (field: NumericMeasurementField, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value === "" ? undefined : Number(value),
    }));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const requiredValues = numericFields.map((field) => formData[field]);
    if (
      requiredValues.some(
        (value) => typeof value !== "number" || !Number.isFinite(value)
      )
    ) {
      setError("Completa todos los valores de la medición.");
      return;
    }

    if (
      (formData.blood_pressure_sys ?? 0) <=
      (formData.blood_pressure_dia ?? 0)
    ) {
      setError("La presión sistólica debe ser mayor que la diastólica.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: MeasurementCreatePayload = {
        astronaut_id: astronautId,
        environment: formData.environment ?? environment,
        heart_rate: formData.heart_rate!,
        temperature: formData.temperature!,
        blood_pressure_sys: formData.blood_pressure_sys!,
        blood_pressure_dia: formData.blood_pressure_dia!,
        glucose: formData.glucose!,
        sleep_hours: formData.sleep_hours!,
        fatigue_level: formData.fatigue_level ?? 5,
        notes: formData.notes?.trim() || undefined,
      };

      const submission = await submitMeasurement(payload);
      onClose();
      onSubmitted(submission.synced);
      setFormData({ environment, fatigue_level: 5 });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la medición."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const numberInput = (
    field: NumericMeasurementField,
    label: string,
    min: number,
    max: number,
    step = "1"
  ) => (
    <div>
      <label
        htmlFor={field}
        className="mb-1.5 block text-xs font-medium text-[#94A3B8]"
      >
        {label}
      </label>
      <input
        id={field}
        type="number"
        min={min}
        max={max}
        step={step}
        required
        value={formData[field] ?? ""}
        onChange={(event) => handleChange(field, event.target.value)}
        className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none tabular-nums"
      />
    </div>
  );

  return (
    <div className="measurement-overlay">
      <div className="measurement-dialog">
        <div className="measurement-dialog-header">
          <h2 className="text-lg font-semibold text-[#F8FAFC]">
            Nueva medición
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-md p-1.5 text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="measurement-form">
          <div className="measurement-fields">
            {numberInput("heart_rate", "Frecuencia cardíaca (bpm)", 31, 219)}
            {numberInput("temperature", "Temperatura (°C)", 34.1, 41.9, "0.1")}
            {numberInput("blood_pressure_sys", "Presión sistólica (mmHg)", 71, 219)}
            {numberInput("blood_pressure_dia", "Presión diastólica (mmHg)", 41, 139)}
            {numberInput("glucose", "Glucosa (mg/dL)", 41, 399)}
            {numberInput("sleep_hours", "Horas de sueño", 0, 16, "0.5")}
          </div>

          <div>
            <label
              htmlFor="fatigue_level"
              className="mb-1.5 block text-xs font-medium text-[#94A3B8]"
            >
              Nivel de fatiga (1-10)
            </label>
            <input
              id="fatigue_level"
              type="range"
              min="1"
              max="10"
              value={formData.fatigue_level ?? 5}
              onChange={(event) => handleChange("fatigue_level", event.target.value)}
              className="w-full accent-[#22D3EE]"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>1 - Baja</span>
              <span className="font-medium text-[#F8FAFC]">
                {formData.fatigue_level ?? 5}
              </span>
              <span>10 - Alta</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="environment"
              className="mb-1.5 block text-xs font-medium text-[#94A3B8]"
            >
              Entorno
            </label>
            <select
              id="environment"
              value={formData.environment ?? environment}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  environment: event.target.value as Environment,
                }))
              }
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
            >
              <option value="spacecraft">Nave espacial</option>
              <option value="lunar_base">Base lunar</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-xs font-medium text-[#94A3B8]"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              maxLength={500}
              value={formData.notes ?? ""}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="measurement-actions">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#334155] px-4 py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-[#334155]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#22D3EE] px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar medición"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
