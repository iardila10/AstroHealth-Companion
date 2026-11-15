import { useEffect, useMemo, useState } from "react";
import AlertsPanel from "./components/dashboard/AlertsPanel";
import HealthOverview from "./components/dashboard/HealthOverview";
import IndicatorsGrid from "./components/dashboard/IndicatorsGrid";
import TrendsChart from "./components/dashboard/TrendsChart";
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
import {
  listQueuedMeasurements,
} from "./services/offlineStorage";
import type { Environment, HealthStatus } from "./types/health";

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
      setSyncMessage("Sin conexión: las nuevas mediciones se guardarán en este dispositivo.");
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
          setError(cause instanceof Error ? cause.message : "No se pudo cargar la tripulación.");
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
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos de salud.");
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
      severity: evaluation.overall_status === "red" ? "critical" as const : "attention" as const,
      createdAt: formatDate(evaluation.created_at),
      recommendation:
        recommendation?.message ??
        recommendation?.description ??
        recommendation?.actions?.join(" ") ??
        "Revisa las mediciones de salud recientes.",
    };
  });

  const handleCreateAstronaut = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setError(cause instanceof Error ? cause.message : "No se pudo registrar al tripulante.");
    } finally {
      setIsCreatingAstronaut(false);
    }
  };

  const connectionStatus = !isOnline
    ? "Sin conexión"
    : loadingAstronauts
    ? "Conectando con el backend..."
    : error
      ? "Error de sincronización"
      : "Backend conectado";

  const environment: Environment =
    latestMeasurement?.environment ??
    selectedAstronaut?.current_environment ??
    "spacecraft";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">ASTROHEALTH COMPANION</p>
          <h1>Mission Control</h1>
          <p className="app-subtitle">
            Monitoreo de salud de la tripulación durante la misión.
          </p>
          {astronauts.length > 0 && (
            <label className="crew-selector">
              Tripulante
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
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="connection-status">{connectionStatus}</span>
          {selectedAstronautId !== null && (
            <button
              type="button"
              onClick={() => setIsMeasurementFormOpen(true)}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Registrar medición
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreateAstronaut((show) => !show)}
            className="text-sm text-cyan-300 underline"
          >
            {showCreateAstronaut ? "Cancelar registro" : "Agregar tripulante"}
          </button>
        </div>
      </header>

      {showCreateAstronaut && (
        <form
          onSubmit={handleCreateAstronaut}
          className="mx-auto mt-6 flex max-w-5xl flex-wrap items-end gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
        >
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-slate-300">
            Nombre
            <input
              required
              value={astronautName}
              onChange={(event) => setAstronautName(event.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-slate-300">
            Rol
            <input
              required
              value={astronautRole}
              onChange={(event) => setAstronautRole(event.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <button
            type="submit"
            disabled={isCreatingAstronaut}
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
          >
            {isCreatingAstronaut ? "Guardando..." : "Registrar"}
          </button>
        </form>
      )}

      <main className="dashboard">
        {error && <p role="alert" className="data-error">{error}</p>}
        {syncMessage && (
          <p role="status" className="data-loading">{syncMessage}</p>
        )}
        {pendingCount > 0 && (
          <p role="status" className="data-loading">
            {pendingCount} medición(es) pendiente(s) de enviar al servidor central.
          </p>
        )}
        {!loadingAstronauts && astronauts.length === 0 && !error && (
          <p className="data-empty">
            No hay tripulantes registrados. Usa “Agregar tripulante” para comenzar.
          </p>
        )}
        {loadingData && <p className="data-loading">Cargando datos de salud...</p>}
        <HealthOverview
          status={mapStatus(latestEvaluation?.overall_status)}
          environment={environment}
          updatedAt={formatDate(latestMeasurement?.recorded_at)}
          alertCount={activeAlerts.length}
        />
        <IndicatorsGrid indicators={indicators} />
        <div className="dashboard-columns">
          <TrendsChart history={history} />
          <AlertsPanel alerts={alerts} />
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
  );
}

export default App;
