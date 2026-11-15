type AlertSeverity = "attention" | "critical";

export interface HealthAlert {
  key: string;
  id: number;
  title: string;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
  recommendation: string;
}

interface AlertsPanelProps {
  alerts: HealthAlert[];
  acknowledgingAlertId: number | null;
  actionError: string | null;
  onAcknowledge: (alertId: number) => void;
}

const severityConfig: Record<
  AlertSeverity,
  { label: string; color: string; background: string; border: string }
> = {
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

function AlertsPanel({
  alerts,
  acknowledgingAlertId,
  actionError,
  onAcknowledge,
}: AlertsPanelProps) {
  return (
    <aside className="alerts-panel" aria-label="Alertas de salud pendientes">
      <div className="alerts-heading">
        <div>
          <p className="section-eyebrow">CENTRO DE ALERTAS</p>
          <h2 className="section-title">Alertas pendientes</h2>
          <p className="section-description">
            Recomendaciones por completar
          </p>
        </div>
        <div className="alerts-total" aria-live="polite">
          <p className="section-eyebrow">TOTAL</p>
          <p className="alerts-total-value">{alerts.length}</p>
        </div>
      </div>

      {actionError && (
        <p className="alert-action-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="alert-list" aria-live="polite">
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <p className="alerts-empty-title">Sin alertas pendientes</p>
            <p>Las nuevas alertas aparecerán aquí.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const isAcknowledging = acknowledgingAlertId === alert.id;

            return (
              <article
                key={alert.key}
                className={`health-alert status-${alert.severity} ${config.background} ${config.border}`}
              >
                <div className="alert-header">
                  <div>
                    <span className="alert-dot" aria-hidden="true" />
                    <h3 className="alert-title">{alert.title}</h3>
                  </div>
                  <span
                    className={`indicator-status ${config.color} ${config.background} ${config.border}`}
                  >
                    {config.label}
                  </span>
                </div>

                <p className="alert-message">{alert.message}</p>

                <div className="alert-recommendation">
                  <p className="section-eyebrow">ACCIÓN SUGERIDA</p>
                  <p>{alert.recommendation}</p>
                </div>

                <p className="alert-time">{alert.createdAt}</p>

                <button
                  type="button"
                  className="alert-acknowledge"
                  disabled={acknowledgingAlertId !== null}
                  onClick={() => onAcknowledge(alert.id)}
                  aria-label={`Marcar como realizada: ${alert.title}`}
                >
                  {isAcknowledging ? "Guardando..." : "✓ Marcar como realizada"}
                </button>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default AlertsPanel;
