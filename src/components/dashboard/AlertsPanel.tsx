
    type AlertSeverity = "attention" | "critical";

    interface HealthAlert {
    id: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    createdAt: string;
    recommendation: string;
    } 

    interface AlertsPanelProps {
    alerts: HealthAlert[];
    }

    function AlertsPanel({ alerts }: AlertsPanelProps) {

    const severityConfig: Record<AlertSeverity, {
        label: string;
        color: string;
        background: string;
        border: string;
    }> = {
        attention: {
        label: "ATENCIÓN",
        color: "text-amber-400",
        background: "bg-amber-500/10",
        border: "border-amber-500/30",
        },
        critical: {
        label: "CRÍTICO",
        color: "text-rose-400",
        background: "bg-rose-500/10",
        border: "border-rose-500/30",
        },
    };

    return (
        <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">

            <div>
            <p className="text-xs font-semibold tracking-widest text-cyan-400">
                HEALTH MONITORING
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-100">
                Active Alerts
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Health notifications and warnings
            </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2">
            <p className="text-xs text-slate-400">
                TOTAL ALERTS
            </p>

            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">
                {alerts.length}
            </p>
            </div>

        </div>

        {/* Alerts List */}
        <div className="mt-6 space-y-3">

            {alerts.length === 0 ? (

            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 text-center">

                <p className="text-lg font-semibold text-emerald-400">
                No Active Alerts
                </p>

                <p className="mt-2 text-sm text-slate-400">
                No health notifications are currently available.
                </p>

            </div>

            ) : (

            alerts.map((alert) => {

                const config = severityConfig[alert.severity];

                return (
                <article
                    key={alert.id}
                    className={`rounded-lg border p-4 ${config.background} ${config.border}`}
                >

                    {/* Alert Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">

                    <div className="flex items-center gap-3">

                        <span
                        className={`h-2.5 w-2.5 rounded-full ${
                            alert.severity === "critical"
                            ? "bg-rose-400"
                            : alert.severity === "attention"
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        aria-hidden="true"
                        />

                        <h3 className="font-semibold text-slate-100">
                        {alert.title}
                        </h3>

                    </div>

                    <span
                        className={`rounded-md border px-2 py-1 text-xs font-bold tracking-wide ${config.color} ${config.background} ${config.border}`}
                    >
                        {config.label}
                    </span>

                    </div>

                    {/* Alert Description */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {alert.message}
                    </p>
                    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-xs font-bold text-amber-400">
                    RECOMMENDED ACTION
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                {alert.recommendation}
                </p>
                </div>
                    {/* Alert Timestamp */}
                    <p className="mt-3 text-xs text-slate-500">
                    {alert.createdAt}
                    </p>

                </article>
                );
            })

            )}

        </div>

        </section>
    );
    }

    export default AlertsPanel;
