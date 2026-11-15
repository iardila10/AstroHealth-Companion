import { useEffect, useMemo, useState } from "react";
import AlertsPanel from "./components/dashboard/AlertsPanel";
import IndicatorsGrid from "./components/dashboard/IndicatorsGrid";
import SensorBodyMap from "./components/dashboard/SensorBodyMap";
import TrendCard from "./components/dashboard/TrendCard";
import { MeasurementForm } from "./components/measurement/MeasurementForm";
import {
  createAstronaut,
  getEvaluations,
  listAstronauts,
  listMeasurements,
  mapStatus,
  syncQueuedMeasurements,
  type Astronaut,
  type EvaluationRecord,
  type MeasurementRecord,
} from "./services/healthService";
import { listQueuedMeasurements } from "./services/offlineStorage";
import type { Environment, HealthStatus, IndicatorKey } from "./types/health";

const sensorCategories = [
  { name: "Fisiológicos", detail: "Señales vitales", count: "5/5", icon: "♥", active: true },
  { name: "Bioquímicos", detail: "Glucosa", count: "1/1", icon: "◉", active: false },
  { name: "Moleculares", detail: "Próximamente", count: "", icon: "✣", active: false },
  { name: "Celulares", detail: "Próximamente", count: "", icon: "▦", active: false },
  { name: "Neurológicos", detail: "Próximamente", count: "", icon: "⌁", active: false },
  { name: "Imágenes", detail: "Próximamente", count: "", icon: "▧", active: false },
  { name: "Wearables", detail: "Próximamente", count: "", icon: "⌚", active: false },
  { name: "Ambientales", detail: "Entorno de misión", count: "1/1", icon: "◌", active: false },
  { name: "Órganos", detail: "Próximamente", count: "", icon: "✦", active: false },
];

const statusLabels: Record<HealthStatus, string> = {
  normal: "ESTADO NORMAL",
  attention: "REQUIERE ATENCIÓN",
  critical: "ESTADO CRÍTICO",
  no_data: "ESPERANDO DATOS",
};

function formatDate(value?: string | null): string {
  if (!value) return "Sin datos";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function App() {
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState<number | null>(
    null
  );
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loadingAstronauts, setLoadingAstronauts] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false);
  const [showCreateAstronaut, setShowCreateAstronaut] = useState(false);
  const [astronautName, setAstronautName] = useState("");
  const [astronautRole, setAstronautRole] = useState("");
  const [isCreatingAstronaut, setIsCreatingAstronaut] = useState(false);

  useEffect(() => {
    let active = true;

    const updatePendingCount = async () => {
      const pending = await listQueuedMeasurements();
      if (active) setPendingCount(pending.length);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncMessage(
        "Sin conexión: las nuevas mediciones se guardarán en este dispositivo."
      );
    };

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncMessage("Conexión disponible. Sincronizando mediciones...");

      try {
        const syncedCount = await syncQueuedMeasurements();
        await updatePendingCount();
        if (syncedCount > 0) {
          setRefreshToken((token) => token + 1);
          setSyncMessage(`${syncedCount} medición(es) sincronizada(s).`);
        } else {
          setSyncMessage(null);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron sincronizar las mediciones pendientes."
        );
        await updatePendingCount();
      }
    };

    void updatePendingCount();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleOnline);
    const retryInterval = window.setInterval(() => {
      if (navigator.onLine) void handleOnline();
    }, 30_000);
    if (navigator.onLine) void handleOnline();

    return () => {
      active = false;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleOnline);
      window.clearInterval(retryInterval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    listAstronauts()
      .then((items) => {
        if (!active) return;
        setAstronauts(items);
        setSelectedAstronautId(items[0]?.id ?? null);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo cargar la tripulación."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingAstronauts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedAstronautId === null) {
      setMeasurements([]);
      setEvaluations([]);
      setLoadingData(false);
      return;
    }

    let active = true;
    setLoadingData(true);
    setError(null);
    setMeasurements([]);
    setEvaluations([]);

    Promise.all([
      listMeasurements(selectedAstronautId),
      getEvaluations(selectedAstronautId),
    ])
      .then(([measurementItems, evaluationItems]) => {
        if (!active) return;
        setMeasurements(measurementItems);
        setEvaluations(evaluationItems);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudieron cargar los datos de salud."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAstronautId, refreshToken]);

  const latestMeasurement = measurements[0];
  const latestEvaluation = evaluations.find(
    (evaluation) => evaluation.measurement_id === latestMeasurement?.id
  );
  const activeAlerts = evaluations.filter(
    (evaluation) =>
      !evaluation.acknowledged && evaluation.overall_status !== "green"
  );
  const selectedAstronaut = astronauts.find(
    (astronaut) => astronaut.id === selectedAstronautId
  );
  const overallStatus = mapStatus(latestEvaluation?.overall_status);

  const indicators = useMemo(() => {
    const values = latestMeasurement;
    const statuses = latestEvaluation?.indicator_statuses ?? {};
    const pressureStatuses = [
      mapStatus(statuses.blood_pressure_sys?.status),
      mapStatus(statuses.blood_pressure_dia?.status),
    ];
    const bloodPressureStatus: HealthStatus = pressureStatuses.includes("critical")
      ? "critical"
      : pressureStatuses.includes("attention")
        ? "attention"
        : pressureStatuses.includes("normal")
          ? "normal"
          : "no_data";

    return [
      {
        id: "heart-rate",
        label: "Frecuencia cardíaca",
        unit: "bpm",
        value: values?.heart_rate ?? null,
        status: mapStatus(statuses.heart_rate?.status),
      },
      {
        id: "blood-pressure",
        label: "Presión arterial",
        unit: "mmHg",
        value: values
          ? `${values.blood_pressure_sys}/${values.blood_pressure_dia}`
          : null,
        status: bloodPressureStatus,
      },
      {
        id: "temperature",
        label: "Temperatura",
        unit: "°C",
        value: values?.temperature ?? null,
        status: mapStatus(statuses.temperature?.status),
      },
      {
        id: "sleep-hours",
        label: "Horas de sueño",
        unit: "h",
        value: values?.sleep_hours ?? null,
        status: mapStatus(statuses.sleep_hours?.status),
      },
      {
        id: "glucose",
        label: "Glucosa",
        unit: "mg/dL",
        value: values?.glucose ?? null,
        status: mapStatus(statuses.glucose?.status),
      },
      {
        id: "fatigue-level",
        label: "Nivel de fatiga",
        unit: "/10",
        value: values?.fatigue_level ?? null,
        status: mapStatus(statuses.fatigue_level?.status),
      },
    ];
  }, [latestMeasurement, latestEvaluation]);

  const history = useMemo(
    () =>
      [...measurements].reverse().map((measurement) => ({
        timestamp: formatDate(measurement.recorded_at),
        heart_rate: measurement.heart_rate,
        blood_pressure_sys: measurement.blood_pressure_sys,
        blood_pressure_dia: measurement.blood_pressure_dia,
        temperature: measurement.temperature,
        sleep_hours: measurement.sleep_hours,
        glucose: measurement.glucose,
        fatigue_level: measurement.fatigue_level,
      })),
    [measurements]
  );

  const alerts = activeAlerts.map((evaluation) => {
    const recommendation = evaluation.recommendations[0];
    return {
      id: String(evaluation.id),
      title: recommendation?.title ?? "Alerta de salud",
      message: evaluation.summary || "Un indicador de salud requiere atención.",
      severity:
        evaluation.overall_status === "red"
          ? ("critical" as const)
          : ("attention" as const),
      createdAt: formatDate(evaluation.created_at),
      recommendation:
        recommendation?.message ??
        recommendation?.description ??
        recommendation?.actions?.join(" ") ??
        "Revisa las mediciones de salud recientes.",
    };
  });

  const handleCreateAstronaut = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setIsCreatingAstronaut(true);

    try {
      const astronaut = await createAstronaut({
        name: astronautName.trim(),
        role: astronautRole.trim(),
        current_environment: "spacecraft",
      });
      setAstronauts((current) => [...current, astronaut]);
      setSelectedAstronautId(astronaut.id);
      setAstronautName("");
      setAstronautRole("");
      setShowCreateAstronaut(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar al tripulante."
      );
    } finally {
      setIsCreatingAstronaut(false);
    }
  };

  const connectionStatus = !isOnline
    ? "Sin conexión"
    : loadingAstronauts
      ? "Conectando..."
      : error
        ? "Error de sincronización"
        : "En línea";
  const environment: Environment =
    latestMeasurement?.environment ??
    selectedAstronaut?.current_environment ??
    "spacecraft";
  const sensorStatuses: Partial<Record<IndicatorKey, HealthStatus>> = {
    heart_rate: mapStatus(latestEvaluation?.indicator_statuses.heart_rate?.status),
    blood_pressure:
      indicators.find((indicator) => indicator.id === "blood-pressure")?.status ??
      "no_data",
    temperature: mapStatus(latestEvaluation?.indicator_statuses.temperature?.status),
    sleep_hours: mapStatus(latestEvaluation?.indicator_statuses.sleep_hours?.status),
    glucose: mapStatus(latestEvaluation?.indicator_statuses.glucose?.status),
    fatigue_level: mapStatus(latestEvaluation?.indicator_statuses.fatigue_level?.status),
  };
  const heartRateValues = history.map((point) => point.heart_rate);
  const glucoseValues = history.map((point) => point.glucose);

  return (
    <div className="app-shell">
      <aside className="sensor-sidebar">
        <div className="brand-lockup">
          <span className="brand-symbol">✦</span>
          <span className="brand-copy">
            <strong>ASTROHEALTH</strong>
            <small>COMPANION / MISSION 04</small>
          </span>
        </div>

        <div className="sidebar-monitor">
          <span className="live-dot" />
          <span>MONITOREO DE MISIÓN</span>
        </div>

        <div className="sensor-sidebar-title">CATEGORÍAS DE SENSORES</div>
        <nav className="sensor-category-list" aria-label="Categorías de sensores">
          {sensorCategories.map((category) => (
            <div
              key={category.name}
              className={`sensor-category ${category.active ? "is-active" : ""}`}
              aria-current={category.active ? "page" : undefined}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-copy">
                <strong>{category.name}</strong>
                <small>{category.detail}</small>
                {category.active && (
                  <span className="category-progress">
                    <i />
                  </span>
                )}
              </span>
              {category.count && (
                <span className="category-count">{category.count}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`connection-light ${isOnline ? "is-online" : ""}`} />
          <span>{connectionStatus}</span>
          {pendingCount > 0 && (
            <strong className="pending-count">{pendingCount}</strong>
          )}
        </div>
      </aside>

      <div className="main-screen">
        <header className="app-header">
          <div className="header-title">
            <p className="app-eyebrow">TELEMETRÍA BIOMÉDICA · EN VIVO</p>
            <h1>Centro de salud</h1>
            <p className="app-subtitle">
              Monitoreo fisiológico de la tripulación
            </p>
          </div>
          <div className="header-actions">
            {astronauts.length > 0 && (
              <label className="crew-picker">
                <span>TRIPULANTE</span>
                <select
                  value={selectedAstronautId ?? ""}
                  onChange={(event) =>
                    setSelectedAstronautId(Number(event.target.value))
                  }
                >
                  {astronauts.map((astronaut) => (
                    <option key={astronaut.id} value={astronaut.id}>
                      {astronaut.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span
              className={`connection-pill ${isOnline ? "is-online" : "is-offline"}`}
            >
              <i />
              {connectionStatus}
            </span>
            <button
              type="button"
              onClick={() => setShowCreateAstronaut((show) => !show)}
              className="button button-secondary"
            >
              {showCreateAstronaut ? "Cancelar" : "＋ Tripulante"}
            </button>
            {selectedAstronautId !== null && (
              <button
                type="button"
                onClick={() => setIsMeasurementFormOpen(true)}
                className="button button-primary"
              >
                ＋ Medición
              </button>
            )}
          </div>
        </header>

        {showCreateAstronaut && (
          <form onSubmit={handleCreateAstronaut} className="new-astronaut-form">
            <label className="form-field">
              Nombre
              <input
                required
                value={astronautName}
                onChange={(event) => setAstronautName(event.target.value)}
              />
            </label>
            <label className="form-field">
              Rol
              <input
                required
                value={astronautRole}
                onChange={(event) => setAstronautRole(event.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={isCreatingAstronaut}
              className="button button-primary"
            >
              {isCreatingAstronaut ? "Guardando..." : "Registrar"}
            </button>
          </form>
        )}

        <main className="dashboard">
          {error && <p role="alert" className="data-error">{error}</p>}
          {syncMessage && (
            <p role="status" className="sync-message">{syncMessage}</p>
          )}
          {pendingCount > 0 && (
            <p role="status" className="sync-message is-pending">
              {pendingCount} medición(es) pendiente(s) de enviar al servidor central.
            </p>
          )}
          {!loadingAstronauts && astronauts.length === 0 && !error && (
            <p className="data-empty">
              No hay tripulantes registrados. Usa “＋ Tripulante” para comenzar.
            </p>
          )}

          <section className={`diagnostic-banner status-${overallStatus}`}>
            <span className="diagnostic-symbol">✧</span>
            <div className="diagnostic-copy">
              <p className="section-eyebrow">ANÁLISIS AUTOMÁTICO</p>
              <h2>{statusLabels[overallStatus]}</h2>
              <p>
                {latestEvaluation?.summary ??
                  "Registra una medición para generar el análisis de salud."}
              </p>
            </div>
            <div className="diagnostic-meta">
              <span>{environment === "spacecraft" ? "NAVE ESPACIAL" : "BASE LUNAR"}</span>
              <small>Actualizado: {formatDate(latestMeasurement?.recorded_at)}</small>
            </div>
            <button
              type="button"
              className="refresh-button"
              onClick={() => setRefreshToken((token) => token + 1)}
              aria-label="Actualizar análisis de salud"
              title="Actualizar datos"
            >
              ↻
            </button>
          </section>

          {loadingData && <p className="data-loading">Cargando datos de salud...</p>}

          <div className="dashboard-layout">
            <section className="body-panel">
              <div className="body-panel-heading">
                <div>
                  <p className="section-eyebrow">MAPA CORPORAL DE SENSORES</p>
                  <h2>Vista fisiológica</h2>
                  <p className="section-description">
                    Distribución de las señales biométricas
                  </p>
                </div>
                <span className="live-badge"><i /> LIVE</span>
              </div>
              <SensorBodyMap statuses={sensorStatuses} />
              <div className="body-legend">
                <span><i className="legend-normal" /> Normal</span>
                <span><i className="legend-attention" /> Atención</span>
                <span><i className="legend-critical" /> Crítico</span>
                <span><i className="legend-no-data" /> Sin datos</span>
              </div>
            </section>

            <div className="health-workspace">
              <IndicatorsGrid indicators={indicators} />
              <div className="trend-grid">
                <TrendCard
                  title="Frecuencia cardíaca"
                  unit="bpm"
                  color="#ff5470"
                  values={heartRateValues}
                />
                <TrendCard
                  title="Glucosa"
                  unit="mg/dL"
                  color="#22d3ee"
                  values={glucoseValues}
                />
              </div>
              <AlertsPanel alerts={alerts} />
            </div>
          </div>
        </main>

        {selectedAstronautId !== null && (
          <MeasurementForm
            astronautId={selectedAstronautId}
            environment={environment}
            isOpen={isMeasurementFormOpen}
            onClose={() => setIsMeasurementFormOpen(false)}
            onSubmitted={(synced) => {
              setSyncMessage(
                synced
                  ? "Medición guardada y sincronizada."
                  : "Medición guardada en este dispositivo; se enviará al recuperar la conexión."
              );
              setPendingCount((count) => count + (synced ? 0 : 1));
              setRefreshToken((token) => token + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
