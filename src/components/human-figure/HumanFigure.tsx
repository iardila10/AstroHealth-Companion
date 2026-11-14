
import { useState } from "react";

import BodyZone, {
  type BodyZoneData,
} from "./BodyZone";

import ZoneDetailPanel from "./ZoneDetailPanel";

interface HumanFigureProps {
  zones: BodyZoneData[];
}

function HumanFigure({ zones }: HumanFigureProps) {

  const [selectedZoneId, setSelectedZoneId] =
    useState<string | null>(null);

  const selectedZone =
    zones.find((zone) => zone.id === selectedZoneId) ?? null;

  return (
    <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-cyan-400">
          BIOMETRIC VISUALIZATION
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-100">
          Human Health Monitor
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Select a body zone to inspect its health information.
        </p>
      </div>

      {/* Main Content */}
      <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-2">

        {/* Human SVG */}
        <div className="flex justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-4">

          <svg
            viewBox="0 0 300 520"
            className="h-auto w-full max-w-[280px]"
            role="group"
            aria-label="Interactive human body health diagram"
          >

            {/* Human Silhouette */}

            {/* Head */}
            <circle
              cx="150"
              cy="55"
              r="34"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Neck */}
            <rect
              x="136"
              y="87"
              width="28"
              height="30"
              rx="8"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Torso */}
            <path
              d="M110 110
                 L190 110
                 L205 145
                 L195 245
                 L180 310
                 L120 310
                 L105 245
                 L95 145 Z"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Left Arm */}
            <path
              d="M105 120
                 L80 130
                 L45 240
                 L55 250
                 L90 170
                 L120 140 Z"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Right Arm */}
            <path
              d="M195 120
                 L220 130
                 L255 240
                 L245 250
                 L210 170
                 L180 140 Z"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Left Leg */}
            <path
              d="M120 300
                 L145 300
                 L140 440
                 L130 500
                 L110 500
                 L115 430 Z"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Right Leg */}
            <path
              d="M155 300
                 L180 300
                 L185 430
                 L190 500
                 L170 500
                 L160 440 Z"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />

            {/* Interactive Body Zones */}
            {zones.map((zone) => (
              <BodyZone
                key={zone.id}
                zone={zone}
                selected={selectedZoneId === zone.id}
                onSelect={setSelectedZoneId}
              />
            ))}

          </svg>

        </div>

        {/* Zone Details */}
        <div className="min-w-0">

          <ZoneDetailPanel
            zone={selectedZone}
            onClose={() => setSelectedZoneId(null)}
          />

        </div>

      </div>

      {/* Status Legend */}
      <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-700 pt-4">

        {[
          { label: "Normal", color: "#10B981" },
          { label: "Warning", color: "#F59E0B" },
          { label: "Critical", color: "#F43F5E" },
          { label: "No Data", color: "#64748B" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">

            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />

            <span className="text-xs text-slate-400">
              {item.label}
            </span>

          </div>
        ))}

      </div>

    </section>
  );
}

export default HumanFigure;
