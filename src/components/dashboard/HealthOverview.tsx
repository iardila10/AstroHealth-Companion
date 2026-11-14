
type HealthStatus = "normal" | "warning" | "critical" | "unknown";

type Environment = "spacecraft" | "lunar_base";

interface HealthOverviewProps {
  status: HealthStatus;
  environment: Environment;
  updatedAt: string;
  alertCount: number;
}

function HealthOverview({
  status,
  environment,
  updatedAt,
  alertCount,
}: HealthOverviewProps) {

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

  const currentStatus = statusConfig[status];

  const currentEnvironment =
    environment === "spacecraft"
      ? "SPACECRAFT"
      : "LUNAR BASE";

  return (
    <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <p className="text-xs font-semibold tracking-widest text-cyan-400">
            ASTROHEALTH COMPANION
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-100">
            Mission Health Overview
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Current Environment: {currentEnvironment}
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={`rounded-lg border px-5 py-3 ${currentStatus.background} ${currentStatus.border}`}
          role="status"
        >
          <p className="text-xs font-medium text-slate-400">
            OVERALL HEALTH
          </p>

          <p className={`mt-1 text-lg font-bold ${currentStatus.color}`}>
            {currentStatus.label}
          </p>
        </div>

      </div>

      {/* Information Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Active Alerts */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">

          <p className="text-sm text-slate-400">
            Active Alerts
          </p>

          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-100">
            {alertCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Current health notifications
          </p>

        </div>

        {/* Last Update */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">

          <p className="text-sm text-slate-400">
            Last Updated
          </p>

          <p className="mt-2 text-lg font-semibold text-slate-100">
            {updatedAt}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Latest health data synchronization
          </p>

        </div>

      </div>

    </section>
  );
}

export default HealthOverview;
