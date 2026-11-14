
type HealthStatus = "normal" | "warning" | "critical" | "unknown";

type HealthIndicator = {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  status: HealthStatus;
};

interface IndicatorsGridProps {
  indicators: HealthIndicator[];
}

function IndicatorsGrid({ indicators }: IndicatorsGridProps) {

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
      label: "ATTENTION",
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

  return (
    <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-cyan-400">
          BIOMETRIC MONITORING
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-100">
          Health Indicators
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Current astronaut health measurements
        </p>
      </div>

      {/* Indicators Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {indicators.map((indicator) => {

          const config = statusConfig[indicator.status];

          return (
            <article
              key={indicator.id}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
            >

              {/* Indicator Name */}
              <p className="text-sm font-medium text-slate-400">
                {indicator.label}
              </p>

              {/* Indicator Value */}
              <div className="mt-3 flex items-baseline gap-2">

                <span className="text-3xl font-bold tabular-nums text-slate-100">
                  {indicator.value ?? "--"}
                </span>

                <span className="text-sm text-slate-500">
                  {indicator.unit}
                </span>

              </div>

              {/* Indicator Status */}
              <div className="mt-4">

                <span
                  className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold tracking-wide ${config.color} ${config.background} ${config.border}`}
                >
                  {config.label}
                </span>

              </div>

            </article>
          );
        })}

      </div>

    </section>
  );
}

export default IndicatorsGrid;
