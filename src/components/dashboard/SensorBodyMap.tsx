import { lazy, Suspense } from "react";
import type { HealthStatus, IndicatorKey } from "../../types/health";

const AstronautModel3D = lazy(() => import("./AstronautModel3D"));

interface SensorBodyMapProps {
  statuses: Partial<Record<IndicatorKey, HealthStatus>>;
}

const sensors: Array<{ key: IndicatorKey; label: string }> = [
  { key: "sleep_hours", label: "Sleep · head" },
  { key: "heart_rate", label: "Pulse · chest" },
  { key: "blood_pressure", label: "Pressure · arms" },
  { key: "temperature", label: "Temperature · torso" },
  { key: "glucose", label: "Glucose · abdomen" },
  { key: "fatigue_level", label: "Fatigue · legs" },
];

const statusNames: Record<HealthStatus, string> = {
  normal: "normal",
  attention: "needs attention",
  critical: "critical",
  no_data: "no data",
};

function SensorBodyMap({ statuses }: SensorBodyMapProps) {
  return (
    <div className="body-map">
      <Suspense
        fallback={<div className="astronaut-model-frame" aria-hidden="true" />}
      >
        <AstronautModel3D statuses={statuses} />
      </Suspense>
      <ul className="body-map-accessible" aria-label="Sensor states">
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
        <span>Space suit sensors</span>
      </div>
    </div>
  );
}

export default SensorBodyMap;
