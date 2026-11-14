
export type HealthStatus =
  | "normal"
  | "warning"
  | "critical"
  | "unknown";

export interface ZoneIndicator {
  id: string;
  label: string;
  value: string | number | null;
  unit: string;
  status: HealthStatus;
}

export interface BodyZoneData {
  id: string;
  name: string;
  status: HealthStatus;
  description: string;
  indicators: ZoneIndicator[];
  position: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  };
}

interface BodyZoneProps {
  zone: BodyZoneData;
  selected: boolean;
  onSelect: (zoneId: string) => void;
}

function BodyZone({
  zone,
  selected,
  onSelect,
}: BodyZoneProps) {

  const statusColors: Record<HealthStatus, string> = {
    normal: "#10B981",
    warning: "#F59E0B",
    critical: "#F43F5E",
    unknown: "#64748B",
  };

  const zoneColor = statusColors[zone.status];

  return (
    <g
      onClick={() => onSelect(zone.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(zone.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${zone.name}: ${zone.status}`}
      aria-pressed={selected}
      className="cursor-pointer"
    >

      {/* Selection Highlight */}
      {selected && (
        <ellipse
          cx={zone.position.cx}
          cy={zone.position.cy}
          rx={zone.position.rx + 5}
          ry={zone.position.ry + 5}
          fill="none"
          stroke="#22D3EE"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      )}

      {/* Body Zone */}
      <ellipse
        cx={zone.position.cx}
        cy={zone.position.cy}
        rx={zone.position.rx}
        ry={zone.position.ry}
        fill={zoneColor}
        fillOpacity={selected ? 0.55 : 0.30}
        stroke={zoneColor}
        strokeWidth={selected ? 3 : 1.5}
        className="transition-all duration-200 hover:opacity-90"
      />

    </g>
  );
}

export default BodyZone;
