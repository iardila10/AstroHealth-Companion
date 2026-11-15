import { useEffect, useMemo, useRef, useState } from "react";
import AlertsPanel from "./components/dashboard/AlertsPanel";
import IndicatorsGrid from "./components/dashboard/IndicatorsGrid";
import SensorBodyMap from "./components/dashboard/SensorBodyMap";
import TrendCard from "./components/dashboard/TrendCard";
import { MeasurementForm } from "./components/measurement/MeasurementForm";
import {
  createAstronaut,
  acknowledgeEvaluation,
  checkApiConnection,
  generateDemoTick,
  getEvaluations,
  listAstronauts,
  listMeasurements,
  mapStatus,
  syncQueuedMeasurements,
  type Astronaut,
  type DemoProfile,
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

const sensorKeyByIndicator: Record<string, IndicatorKey> = {
  heart_rate: "heart_rate",
  blood_pressure_sys: "blood_pressure",
  blood_pressure_dia: "blood_pressure",
  temperature: "temperature",
  sleep_hours: "sleep_hours",
  glucose: "glucose",
  fatigue_level: "fatigue_level",
};

const healthStatusPriority: Record<HealthStatus, number> = {
  no_data: 0,
  normal: 1,
  attention: 2,
  critical: 3,
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
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false);
  const [showCreateAstronaut, setShowCreateAstronaut] = useState(false);
  const [astronautName, setAstronautName] = useState("");
  const [astronautRole, setAstronautRole] = useState("");
  const [isCreatingAstronaut, setIsCreatingAstronaut] = useState(false);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [simulatorProfile, setSimulatorProfile] =
    useState<DemoProfile>("normal");
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const [alertBaselineId, setAlertBaselineId] = useState(0);
  const [acknowledgingAlertId, setAcknowledgingAlertId] = useState<number | null>(
    null
  );
  const [alertActionError, setAlertActionError] = useState<string | null>(null);
  const acknowledgedAlertIds = useRef(new Set<number>());

  useEffect(() => {
    let active = true;

    const updatePendingCount = async () => {
      const pending = await listQueuedMeasurements();
      if (active) setPendingCount(pending.length);
    };

    const handleOffline = () => {
      setSyncMessage(
        "Sin Internet: se intentará usar la API local; si no responde, los datos quedan pendientes en este dispositivo."
      );
    };

    const handleOnline = async () => {
      const networkAvailable = navigator.onLine;
      if (networkAvailable) {
        setSyncMessage("Conexión disponible. Sincronizando mediciones...");
      }

      try {
        const syncedCount = await syncQueuedMeasurements();
        await updatePendingCount();
        if (syncedCount > 0) {
          setRefreshToken((token) => token + 1);
          setSyncMessage(`${syncedCount} medición(es) sincronizada(s).`);
        } else if (networkAvailable) {
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
      void handleOnline();
    }, 30_000);
    void handleOnline();

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
    const checkConnection = async () => {
      const available = await checkApiConnection();
      if (active) setIsApiAvailable(available);
    };

    void checkConnection();
    const interval = window.setInterval(() => void checkConnection(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
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
    if (measurements.length === 0 && evaluations.length === 0) {
      setLoadingData(true);
    }
    setError(null);

    Promise.all([
      listMeasurements(selectedAstronautId),
      getEvaluations(selectedAstronautId),
    ])
      .then(([measurementItems, evaluationItems]) => {
        if (!active) return;
        setMeasurements(measurementItems);
        setEvaluations(
          evaluationItems.map((evaluation) =>
            acknowledgedAlertIds.current.has(evaluation.id)
              ? { ...evaluation, acknowledged: true }
              : evaluation
          )
        );
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
  const seenAlertPatterns = new Set<string>();
  const recentAlertsByPattern = new Map<string, EvaluationRecord>();
  [...evaluations]
    .sort((a, b) => b.id - a.id)
    .forEach((evaluation) => {
      if (
        evaluation.id <= alertBaselineId ||
        evaluation.overall_status === "green"
      ) {
        return;
      }

      const pattern = Object.entries(evaluation.indicator_statuses)
        .filter(([, indicator]) => indicator.status !== "green")
        .map(([indicator]) => indicator)
        .sort()
        .join("|");
      if (!pattern || seenAlertPatterns.has(pattern)) return;

      seenAlertPatterns.add(pattern);
      if (!evaluation.acknowledged) {
        recentAlertsByPattern.set(pattern, evaluation);
      }
    });
  const recentAlerts = [...recentAlertsByPattern.entries()].sort(
    ([patternA], [patternB]) => patternA.localeCompare(patternB)
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

  const alerts = recentAlerts.map(([key, evaluation]) => {
    const recommendation = evaluation.recommendations[0];
    return {
      key,
      id: evaluation.id,
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

  const handleAcknowledgeAlert = async (alertId: number) => {
    setAcknowledgingAlertId(alertId);
    setAlertActionError(null);

    try {
      await acknowledgeEvaluation(alertId);
      acknowledgedAlertIds.current.add(alertId);
      setEvaluations((current) =>
        current.map((evaluation) =>
          evaluation.id === alertId
            ? { ...evaluation, acknowledged: true }
            : evaluation
        )
      );
    } catch (cause) {
      setAlertActionError(
        cause instanceof Error
          ? cause.message
          : "No se pudo marcar la alerta como realizada."
      );
    } finally {
      setAcknowledgingAlertId(null);
    }
  };

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
      setMeasurements([]);
      setEvaluations([]);
      setAlertBaselineId(0);
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

  const connectionStatus = isApiAvailable
    ? "API local activa"
    : "API local desconectada";
  const environment: Environment =
    latestMeasurement?.environment ??
    selectedAstronaut?.current_environment ??
    "spacecraft";
  useEffect(() => {
    if (!isSimulatorRunning || selectedAstronautId === null) return;

    let active = true;
    let timer: number | undefined;

    const tick = async () => {
      try {
        await generateDemoTick(
          selectedAstronautId,
          environment,
          simulatorProfile
        );
        if (!active) return;
        setSimulatorError(null);
        setRefreshToken((token) => token + 1);
        timer = window.setTimeout(() => void tick(), 2500);
      } catch (cause) {
        if (!active) return;
        setSimulatorError(
          cause instanceof Error
            ? cause.message
            : "No se pudo generar la lectura simulada."
        );
        setIsSimulatorRunning(false);
      }
    };

    void tick();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    environment,
    isSimulatorRunning,
    selectedAstronautId,
    simulatorProfile,
  ]);
  const normalSensorStatus: HealthStatus = latestMeasurement ? "normal" : "no_data";
  const sensorStatuses: Partial<Record<IndicatorKey, HealthStatus>> = {
    heart_rate: normalSensorStatus,
    blood_pressure: normalSensorStatus,
    temperature: normalSensorStatus,
    sleep_hours: normalSensorStatus,
    glucose: normalSensorStatus,
    fatigue_level: normalSensorStatus,
  };
  recentAlerts.forEach(([, evaluation]) => {
    Object.entries(evaluation.indicator_statuses).forEach(
      ([indicatorKey, indicator]) => {
        const sensorKey = sensorKeyByIndicator[indicatorKey];
        if (!sensorKey || indicator.status === "green") return;

        const status = mapStatus(indicator.status);
        const currentStatus = sensorStatuses[sensorKey] ?? "no_data";
        if (healthStatusPriority[status] > healthStatusPriority[currentStatus]) {
          sensorStatuses[sensorKey] = status;
        }
      }
    );
  });
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
          <span className={`connection-light ${isApiAvailable ? "is-online" : ""}`} />
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
                  onChange={(event) => {
                    setMeasurements([]);
                    setEvaluations([]);
                    setAlertBaselineId(0);
                    setSelectedAstronautId(Number(event.target.value));
                  }}
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
              className={`connection-pill ${isApiAvailable ? "is-online" : "is-offline"}`}
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

          {import.meta.env.DEV && (
            <section className="simulator-panel" aria-label="Simulador local">
              <div className="simulator-copy">
                <p className="section-eyebrow">MODO DEMO LOCAL</p>
                <strong>
                  {isSimulatorRunning
                    ? "Simulando telemetría"
                    : "Simulador de sensores"}
                </strong>
                <small>
                  Datos sintéticos; no son lecturas reales ni evaluación clínica.
                </small>
              </div>
              <label className="simulator-profile">
                <span>PERFIL</span>
                <select
                  value={simulatorProfile}
                  disabled={isSimulatorRunning}
                  onChange={(event) => {
                    setAlertBaselineId(
                      evaluations.reduce(
                        (latestId, evaluation) =>
                          Math.max(latestId, evaluation.id),
                        0
                      )
                    );
                    setSimulatorProfile(event.target.value as DemoProfile);
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="attention">Atención</option>
                  <option value="critical">Crítico</option>
                </select>
              </label>
              <button
                type="button"
                className={`button ${isSimulatorRunning ? "button-secondary" : "button-primary"}`}
                disabled={selectedAstronautId === null || loadingAstronauts}
                onClick={() => {
                  if (!isSimulatorRunning) {
                    setAlertBaselineId(
                      evaluations.reduce(
                        (latestId, evaluation) =>
                          Math.max(latestId, evaluation.id),
                        0
                      )
                    );
                  }
                  setSimulatorError(null);
                  setIsSimulatorRunning((running) => !running);
                }}
              >
                {isSimulatorRunning ? "Pausar demo" : "Iniciar demo"}
              </button>
              {simulatorError && (
                <p className="simulator-error" role="alert">
                  {simulatorError}
                </p>
              )}
            </section>
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
                  <h2>Traje de astronauta</h2>
                  <p className="section-description">
                    Resumen persistente de alertas biométricas
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
            </div>
            <AlertsPanel
              alerts={alerts}
              acknowledgingAlertId={acknowledgingAlertId}
              actionError={alertActionError}
              onAcknowledge={handleAcknowledgeAlert}
            />
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
