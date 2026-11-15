import { useEffect, useMemo, useState } from "react";
import AlertsPanel from "./components/dashboard/AlertsPanel";
import HealthOverview from "./components/dashboard/HealthOverview";
import IndicatorsGrid from "./components/dashboard/IndicatorsGrid";
import TrendsChart from "./components/dashboard/TrendsChart";
import {
  getEvaluations,
  listAstronauts,
  listMeasurements,
  type Astronaut,
  type EvaluationRecord,
  type MeasurementRecord,
} from "./services/healthService";

type HealthStatus = "normal" | "warning" | "critical" | "unknown";

const statusMap: Record<string, HealthStatus> = {
  green: "normal",
  yellow: "warning",
  red: "critical",
};

function mapStatus(status?: string): HealthStatus {
  return statusMap[status ?? ""] ?? "unknown";
}

function formatDate(value?: string | null): string {
  if (!value) return "No data yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function App() {
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loadingAstronauts, setLoadingAstronauts] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setError(cause instanceof Error ? cause.message : "Could not load crew");
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
          setError(cause instanceof Error ? cause.message : "Could not load health data");
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAstronautId]);

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
    const bloodPressureStatuses = [
      mapStatus(statuses.blood_pressure_sys?.status),
      mapStatus(statuses.blood_pressure_dia?.status),
    ];
    const bloodPressureStatus: HealthStatus = bloodPressureStatuses.includes("critical")
      ? "critical"
      : bloodPressureStatuses.includes("warning")
        ? "warning"
        : bloodPressureStatuses.includes("normal")
          ? "normal"
          : "unknown";

    return [
      { id: "heart-rate", label: "Heart Rate", unit: "bpm", value: values?.heart_rate ?? null, status: mapStatus(statuses.heart_rate?.status) },
      { id: "blood-pressure", label: "Blood Pressure", unit: "mmHg", value: values ? `${values.blood_pressure_sys}/${values.blood_pressure_dia}` : null, status: bloodPressureStatus },
      { id: "temperature", label: "Temperature", unit: "°C", value: values?.temperature ?? null, status: mapStatus(statuses.temperature?.status) },
      { id: "sleep-hours", label: "Sleep Hours", unit: "h", value: values?.sleep_hours ?? null, status: mapStatus(statuses.sleep_hours?.status) },
      { id: "glucose", label: "Glucose", unit: "mg/dL", value: values?.glucose ?? null, status: mapStatus(statuses.glucose?.status) },
      { id: "fatigue-level", label: "Fatigue Level", unit: "/10", value: values?.fatigue_level ?? null, status: mapStatus(statuses.fatigue_level?.status) },
    ];
  }, [latestMeasurement, latestEvaluation]);

  const history = useMemo(
    () =>
      [...measurements]
        .reverse()
        .map((measurement) => ({
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
      title: recommendation?.title ?? "Health alert",
      message: evaluation.summary ?? "A health indicator needs attention.",
      severity: mapStatus(evaluation.overall_status) === "critical" ? "critical" as const : "warning" as const,
      createdAt: formatDate(evaluation.created_at),
      recommendation: recommendation?.description ?? "Review the latest health measurements.",
    };
  });

  const connectionStatus = loadingAstronauts
    ? "Connecting to health database..."
    : error
      ? "Backend connection error"
      : astronauts.length === 0
        ? "Connected · no crew data"
        : "Connected to health database";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">ASTROHEALTH COMPANION</p>
          <h1>Mission Control</h1>
          <p className="app-subtitle">
            Health monitoring for your crew, wherever the mission takes you.
          </p>
          {astronauts.length > 0 && (
            <label className="crew-selector">
              Crew member
              <select
                value={selectedAstronautId ?? ""}
                onChange={(event) => setSelectedAstronautId(Number(event.target.value))}
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
        <span className="connection-status">{connectionStatus}</span>
      </header>

      <main className="dashboard">
        {error && <p role="alert" className="data-error">{error}</p>}
        {!loadingAstronauts && astronauts.length === 0 && !error && (
          <p className="data-empty">No astronauts are registered in the database yet.</p>
        )}
        {loadingData && <p className="data-loading">Loading health data...</p>}
        <HealthOverview
          status={mapStatus(latestEvaluation?.overall_status)}
          environment={latestMeasurement?.environment ?? selectedAstronaut?.current_environment ?? "spacecraft"}
          updatedAt={formatDate(latestMeasurement?.recorded_at)}
          alertCount={activeAlerts.length}
        />
        <IndicatorsGrid indicators={indicators} />
        <div className="dashboard-columns">
          <TrendsChart history={history} />
          <AlertsPanel alerts={alerts} />
        </div>
      </main>
    </div>
  );
}

export default App;
