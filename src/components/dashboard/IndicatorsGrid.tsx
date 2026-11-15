
import type { HealthStatus } from "../../types/health";

type HealthIndicator = {
  id: string;
  label: string;
  value: number | string | null;
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
    attention: {
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
    no_data: {
      label: "NO DATA",
      color: "text-slate-400",
      background: "bg-slate-500/10",
      border: "border-slate-500/30",
    },
  };

  return (
    <section className="indicator-panel">

      {/* Header */}
      <div>
        <p className="section-eyebrow">
          BIOMEDICAL TELEMETRY
        </p>

        <h2 className="section-title">
          Physiological indicators
        </h2>

        <p className="section-description">
          Most recent crew readings
        </p>
      </div>

      {/* Indicators Grid */}
      <div className="indicator-grid">

        {indicators.map((indicator) => {

          const config = statusConfig[indicator.status];

          return (
            <article
              key={indicator.id}
              className={`indicator-card status-${indicator.status}`}
            >

              {/* Indicator Name */}
              <p className="indicator-label">
                {indicator.label}
              </p>

              {/* Indicator Value */}
              <div className="indicator-reading">

                <span className="indicator-value">
                  {indicator.value ?? "--"}
                </span>

                <span className="indicator-unit">
                  {indicator.unit}
                </span>

              </div>

              {/* Indicator Status */}
              <div className="mt-4">

                <span
                  className={`indicator-status ${config.color} ${config.background} ${config.border}`}
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
