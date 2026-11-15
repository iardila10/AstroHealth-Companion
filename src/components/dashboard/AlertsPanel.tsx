
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
        <section className="alerts-panel">

        {/* Header */}
        <div className="alerts-heading">

            <div>
            <p className="section-eyebrow">
                CENTRO DE ALERTAS
            </p>

            <h2 className="section-title">
                Alertas activas
            </h2>

            <p className="section-description">
                Notificaciones de salud y acciones sugeridas
            </p>
            </div>

            <div className="alerts-total">
            <p className="section-eyebrow">
                TOTAL
            </p>

            <p className="alerts-total-value">
                {alerts.length}
            </p>
            </div>

        </div>

        {/* Alerts List */}
        <div className="alert-list">

            {alerts.length === 0 ? (

            <div className="alerts-empty">

                <p className="alerts-empty-title">
                Sin alertas activas
                </p>

                <p>
                No hay notificaciones de salud pendientes.
                </p>

            </div>

            ) : (

            alerts.map((alert) => {

                const config = severityConfig[alert.severity];

                return (
                <article
                    key={alert.id}
                    className={`health-alert status-${alert.severity} ${config.background} ${config.border}`}
                >

                    {/* Alert Header */}
                    <div className="alert-header">

                    <div className="flex items-center gap-3">

                        <span
                        className={`alert-dot ${
                            alert.severity === "critical"
                            ? "bg-rose-400"
                            : alert.severity === "attention"
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        aria-hidden="true"
                        />

                        <h3 className="alert-title">
                        {alert.title}
                        </h3>

                    </div>

                    <span
                        className={`indicator-status ${config.color} ${config.background} ${config.border}`}
                    >
                        {config.label}
                    </span>

                    </div>

                    {/* Alert Description */}
                    <p className="alert-message">
                    {alert.message}
                    </p>
                    <div className="alert-recommendation">
                    <p className="section-eyebrow">
                    ACCIÓN SUGERIDA
                    </p>

                    <p>
                {alert.recommendation}
                </p>
                </div>
                    {/* Alert Timestamp */}
                    <p className="alert-time">
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
