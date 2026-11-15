import type { HealthStatus, IndicatorKey } from "../../types/health";

interface SensorBodyMapProps {
  statuses: Partial<Record<IndicatorKey, HealthStatus>>;
}

const sensors: Array<{
  key: IndicatorKey;
  label: string;
  x: number;
  y: number;
}> = [
  { key: "sleep_hours", label: "Sueño", x: 120, y: 34 },
  { key: "heart_rate", label: "Pulso", x: 120, y: 144 },
  { key: "blood_pressure", label: "Presión", x: 161, y: 158 },
  { key: "temperature", label: "Temp.", x: 91, y: 211 },
  { key: "glucose", label: "Glucosa", x: 120, y: 238 },
  { key: "fatigue_level", label: "Fatiga", x: 120, y: 354 },
];

function SensorBodyMap({ statuses }: SensorBodyMapProps) {
  return (
    <div className="body-map">
      <svg
        viewBox="0 0 240 410"
        role="img"
        aria-label="Mapa corporal de sensores de salud"
        className="body-map-svg"
      >
        <defs>
          <linearGradient id="body-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0d2942" />
            <stop offset="100%" stopColor="#101b35" />
          </linearGradient>
        </defs>
        <circle className="body-silhouette" cx="120" cy="38" r="25" />
        <path
          className="body-silhouette"
          d="M101 68 L84 78 L61 83 L40 151 L52 156 L75 111 L80 175 L88 224 L91 272 L101 287 L106 244 L116 218 L124 218 L134 244 L139 287 L149 272 L152 224 L160 175 L165 111 L188 156 L200 151 L179 83 L156 78 L139 68 Z"
        />
        <path
          className="body-silhouette"
          d="M91 270 L111 270 L108 344 L105 398 L91 398 L85 345 Z M129 270 L149 270 L155 345 L149 398 L135 398 L132 344 Z"
        />
        <path className="body-contour" d="M120 67 L120 210 M87 91 L120 111 L153 91 M93 225 L120 239 L147 225" />
        {sensors.map((sensor) => {
          const status = statuses[sensor.key] ?? "no_data";
          return (
            <g
              key={sensor.key}
              className={`body-sensor body-sensor-${status}`}
            >
              <circle cx={sensor.x} cy={sensor.y} r="14" className="sensor-glow" />
              <circle cx={sensor.x} cy={sensor.y} r="6" className="sensor-core" />
              <title>{`${sensor.label}: ${status}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="body-map-caption">
        <span className="live-dot" />
        <span>Mapa corporal de sensores</span>
      </div>
    </div>
  );
}

export default SensorBodyMap;
