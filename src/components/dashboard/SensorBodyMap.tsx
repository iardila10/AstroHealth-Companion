import { lazy, Suspense } from "react";
import type { HealthStatus, IndicatorKey } from "../../types/health";

const AstronautModel3D = lazy(() => import("./AstronautModel3D"));

interface SensorBodyMapProps {
  statuses: Partial<Record<IndicatorKey, HealthStatus>>;
}

const sensors: Array<{ key: IndicatorKey; label: string }> = [
  { key: "sleep_hours", label: "Sueño · cabeza" },
  { key: "heart_rate", label: "Pulso · pecho" },
  { key: "blood_pressure", label: "Presión · brazos" },
  { key: "temperature", label: "Temperatura · torso" },
  { key: "glucose", label: "Glucosa · abdomen" },
  { key: "fatigue_level", label: "Fatiga · piernas" },
];

const statusNames: Record<HealthStatus, string> = {
  normal: "normal",
  attention: "en atención",
  critical: "crítico",
  no_data: "sin datos",
};

function SensorBodyMap({ statuses }: SensorBodyMapProps) {
  return (
    <div className="body-map">
      <Suspense
        fallback={<div className="astronaut-model-frame" aria-hidden="true" />}
      >
        <AstronautModel3D statuses={statuses} />
      </Suspense>
      <ul className="body-map-accessible" aria-label="Estados de los sensores">
        {sensors.map((sensor) => {
          const status = statuses[sensor.key] ?? "no_data";
          return (
            <li key={sensor.key}>
              {sensor.label}: {statusNames[status]}
            </li>
          );
        })}
      </ul>
      <div className="body-map-caption">
        <span className="live-dot" />
        <span>Sensores del traje espacial</span>
      </div>
    </div>
  );
}

export default SensorBodyMap;
