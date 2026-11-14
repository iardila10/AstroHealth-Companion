
import type { BodyZoneData, HealthStatus } from "./BodyZone";

interface ZoneDetailPanelProps {
  zone: BodyZoneData | null;
  onClose: () => void;
}

function ZoneDetailPanel({
  zone,
  onClose,
}: ZoneDetailPanelProps) {

  const statusConfig: Record<HealthStatus, {
    label: string;
    color: string;
    background: string;
    border: string;
  }> = {
    normal: {
      label: "NORMAL",
      color: "text-emerald-400",
      background: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    warning: {
      label: "ATTENTION REQUIRED",
      color: "text-amber-400",
      background: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    critical: {
      label: "CRITICAL",
      color: "text-rose-400",
      background: "bg-rose-500/10",
      border: "border-rose-500/30",
    },
    unknown: {
      label: "NO DATA",
      color: "text-slate-400",
      background: "bg-slate-500/10",
      border: "border-slate-500/30",
    },
  };

  if (!zone) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 p-6 text-center">

        <div>
          <p className="font-semibold text-slate-300">
            No Zone Selected
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Select a body zone to view its health information.
          </p>
        </div>

      </div>
    );
  }

  const config = statusConfig[zone.status];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-xs font-semibold tracking-widest text-cyan-400">
            BODY ZONE DETAILS
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-100">
            {zone.name}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close zone details"
          className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
        >
          ×
        </button>

      </div>

      {/* Zone Status */}
      <div className={`mt-4 inline-flex rounded-md border px-3 py-2 ${config.background} ${config.border}`}>

        <span className={`text-xs font-bold tracking-wide ${config.color}`}>
          {config.label}
        </span>

      </div>

      {/* Description */}
      <div className="mt-5">

        <p className="text-xs font-semibold tracking-widest text-slate-400">
          DESCRIPTION
        </p>

        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {zone.description}
        </p>

      </div>

      {/* Related Indicators */}
      <div className="mt-6">

        <p className="text-xs font-semibold tracking-widest text-slate-400">
          RELATED INDICATORS
        </p>

        <div className="mt-3 space-y-3">

          {zone.indicators.length === 0 ? (

            <p className="text-sm text-slate-500">
              No indicator data available.
            </p>

          ) : (

            zone.indicators.map((indicator) => {

              const indicatorConfig =
                statusConfig[indicator.status];

              return (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3"
                >

                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {indicator.label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {indicator.value ?? "--"} {indicator.unit}
                    </p>
                  </div>

                  <span className={`text-xs font-bold ${indicatorConfig.color}`}>
                    {indicatorConfig.label}
                  </span>

                </div>
              );
            })

          )}

        </div>

      </div>

    </div>
  );
}

export default ZoneDetailPanel;
