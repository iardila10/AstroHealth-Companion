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

type Language = "en" | "es";

const translations = {
  en: {
    noData: "No data",
    connectionMonitoring: "MISSION MONITORING",
    sensorCategories: "SENSOR CATEGORIES",
    apiOnline: "Local API active",
    apiOffline: "Local API disconnected",
    noMeasurements: "No measurements",
    offlineMessage:
      "No internet: the local API will be used; if it does not respond, the data remains pending on this device.",
    onlineMessage: "Connection available. Synchronizing measurements...",
    syncSuccess: (count: number) => `${count} measurement(s) synchronized.`,
    syncFailure: "Could not synchronize pending measurements.",
    loadCrewFailure: "Could not load the crew.",
    loadHealthFailure: "Could not load health data.",
    telemetryLive: "BIOMEDICAL TELEMETRY · LIVE",
    healthCenter: "Health center",
    crewMonitoring: "Crew physiological monitoring",
    crewMember: "CREW MEMBER",
    addCrew: "Add crew member",
    addMeasurement: "Add measurement",
    cancel: "Cancel",
    name: "Name",
    role: "Role",
    saving: "Saving...",
    register: "Register",
    pendingSyncSummary: (count: number) =>
      `${count} measurement(s) pending to send to the central server.`,
    emptyCrew: "No crew members registered. Use “＋ Add crew member” to begin.",
    localDemoMode: "LOCAL DEMO MODE",
    simulatingTelemetry: "Simulating telemetry",
    sensorSimulator: "Sensor simulator",
    syntheticDataWarning:
      "Synthetic data; not real clinical readings or evaluations.",
    profile: "PROFILE",
    normal: "Normal",
    attention: "Attention",
    critical: "Critical",
    pauseDemo: "Pause demo",
    startDemo: "Start demo",
    automaticAnalysis: "AUTOMATIC ANALYSIS",
    waitingForMeasurement:
      "Record a measurement to generate the health analysis.",
    environmentSpacecraft: "SPACECRAFT",
    environmentLunarBase: "LUNAR BASE",
    updated: "Updated:",
    loadingHealthData: "Loading health data...",
    bodyMapTitle: "Astronaut suit",
    bodyMapSummary: "Persistent summary of biometric alerts",
    legendNormal: "Normal",
    legendAttention: "Attention",
    legendCritical: "Critical",
    legendNoData: "No data",
    heartRate: "Heart rate",
    bloodPressure: "Blood pressure",
    temperature: "Temperature",
    sleepHours: "Sleep hours",
    glucose: "Glucose",
    fatigueLevel: "Fatigue level",
    alertHealth: "Health alert",
    genericAlertMessage: "A health indicator requires attention.",
    alertRecommendation:
      "Review the recent health measurements and recommended actions.",
    failedAckAlert: "Could not mark the alert as handled.",
    createAstronautFailure: "Could not register the crew member.",
    apiCheckNoConnection: "Local API disconnected",
    demoProgressStatus: "Demo in progress",
    noDataMessage: "No data available",
    sensorCategoriesData: [
      { name: "Physiological", detail: "Vital signs", count: "5/5", icon: "♥", active: true },
      { name: "Biochemical", detail: "Glucose", count: "1/1", icon: "◉", active: false },
      { name: "Molecular", detail: "Coming soon", count: "", icon: "✣", active: false },
      { name: "Cellular", detail: "Coming soon", count: "", icon: "▦", active: false },
      { name: "Neurological", detail: "Coming soon", count: "", icon: "⌁", active: false },
      { name: "Imaging", detail: "Coming soon", count: "", icon: "▧", active: false },
      { name: "Wearables", detail: "Coming soon", count: "", icon: "⌚", active: false },
      { name: "Environmental", detail: "Mission environment", count: "1/1", icon: "◌", active: false },
      { name: "Organs", detail: "Coming soon", count: "", icon: "✦", active: false },
    ],
    statusLabels: {
      normal: "NORMAL STATUS",
      attention: "REQUIRES ATTENTION",
      critical: "CRITICAL STATUS",
      no_data: "WAITING FOR DATA",
    } as Record<HealthStatus, string>,
  },
  es: {
    noData: "No data",
    connectionMonitoring: "MISSION MONITORING",
    sensorCategories: "SENSOR CATEGORIES",
    apiOnline: "Local API active",
    apiOffline: "Local API disconnected",
    noMeasurements: "No measurements",
    offlineMessage:
      "No internet: the local API will be used; if it does not respond, the data remains pending on this device.",
    onlineMessage: "Connection available. Synchronizing measurements...",
    syncSuccess: (count: number) => `${count} measurement(s) synchronized.`,
    syncFailure: "Could not synchronize pending measurements.",
    loadCrewFailure: "Could not load the crew.",
    loadHealthFailure: "Could not load health data.",
    telemetryLive: "BIOMEDICAL TELEMETRY · LIVE",
    healthCenter: "Health center",
    crewMonitoring: "Crew physiological monitoring",
    crewMember: "CREW MEMBER",
    addCrew: "Add crew member",
    addMeasurement: "Add measurement",
    cancel: "Cancel",
    name: "Name",
    role: "Role",
    saving: "Saving...",
    register: "Register",
    pendingSyncSummary: (count: number) =>
      `${count} measurement(s) pending to send to the central server.`,
    emptyCrew: "No crew members registered. Use “＋ Add crew member” to begin.",
    localDemoMode: "LOCAL DEMO MODE",
    simulatingTelemetry: "Simulating telemetry",
    sensorSimulator: "Sensor simulator",
    syntheticDataWarning:
      "Synthetic data; not real clinical readings or evaluations.",
    profile: "PROFILE",
    normal: "Normal",
    attention: "Attention",
    critical: "Critical",
    pauseDemo: "Pause demo",
    startDemo: "Start demo",
    automaticAnalysis: "AUTOMATIC ANALYSIS",
    waitingForMeasurement:
      "Record a measurement to generate the health analysis.",
    environmentSpacecraft: "SPACECRAFT",
    environmentLunarBase: "LUNAR BASE",
    updated: "Updated:",
    loadingHealthData: "Loading health data...",
    bodyMapTitle: "Astronaut suit",
    bodyMapSummary: "Persistent summary of biometric alerts",
    legendNormal: "Normal",
    legendAttention: "Attention",
    legendCritical: "Critical",
    legendNoData: "No data",
    heartRate: "Heart rate",
    bloodPressure: "Blood pressure",
    temperature: "Temperature",
    sleepHours: "Sleep hours",
    glucose: "Glucose",
    fatigueLevel: "Fatigue level",
    alertHealth: "Health alert",
    genericAlertMessage: "A health indicator requires attention.",
    alertRecommendation:
      "Review the recent health measurements and recommended actions.",
    failedAckAlert: "Could not mark the alert as handled.",
    createAstronautFailure: "Could not register the crew member.",
    apiCheckNoConnection: "Local API disconnected",
    demoProgressStatus: "Demo in progress",
    noDataMessage: "No data available",
    sensorCategoriesData: [
      { name: "Physiological", detail: "Vital signs", count: "5/5", icon: "♥", active: true },
      { name: "Biochemical", detail: "Glucose", count: "1/1", icon: "◉", active: false },
      { name: "Molecular", detail: "Coming soon", count: "", icon: "✣", active: false },
      { name: "Cellular", detail: "Coming soon", count: "", icon: "▦", active: false },
      { name: "Neurological", detail: "Coming soon", count: "", icon: "⌁", active: false },
      { name: "Imaging", detail: "Coming soon", count: "", icon: "▧", active: false },
      { name: "Wearables", detail: "Coming soon", count: "", icon: "⌚", active: false },
      { name: "Environmental", detail: "Mission environment", count: "1/1", icon: "◌", active: false },
      { name: "Organs", detail: "Coming soon", count: "", icon: "✦", active: false },
    ],
    statusLabels: {
      normal: "NORMAL STATUS",
      attention: "REQUIRES ATTENTION",
      critical: "CRITICAL STATUS",
      no_data: "WAITING FOR DATA",
    } as Record<HealthStatus, string>,
  },
} as const;

const sensorCategories = [
  { name: "Physiological", detail: "Vital signs", count: "5/5", icon: "♥", active: true },
  { name: "Biochemical", detail: "Glucose", count: "1/1", icon: "◉", active: false },
  { name: "Molecular", detail: "Coming soon", count: "", icon: "✣", active: false },
  { name: "Cellular", detail: "Coming soon", count: "", icon: "▦", active: false },
  { name: "Neurological", detail: "Coming soon", count: "", icon: "⌁", active: false },
  { name: "Imaging", detail: "Coming soon", count: "", icon: "▧", active: false },
  { name: "Wearables", detail: "Coming soon", count: "", icon: "⌚", active: false },
  { name: "Environmental", detail: "Mission environment", count: "1/1", icon: "◌", active: false },
  { name: "Organs", detail: "Coming soon", count: "", icon: "✦", active: false },
];

const statusLabels: Record<HealthStatus, string> = {
  normal: "NORMAL STATUS",
  attention: "REQUIRES ATTENTION",
  critical: "CRITICAL STATUS",
  no_data: "WAITING FOR DATA",
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

const recommendationCopy: Record<string, { title: string; description: string }> = {
  REC_CARDIO_01: {
    title: "Reduce cardiovascular strain",
    description:
      "Your heart rate and blood pressure are elevated. Reduce physical activity and take slow, deep breaths for 5 minutes.",
  },
  REC_REST_01: {
    title: "Rest immediately",
    description:
      "Your body is showing signs of strain. Reduce physical and cognitive demands now.",
  },
  REC_SLEEP_01: {
    title: "Recover from sleep debt",
    description:
      "You have slept less than recommended and your fatigue level is high. Sleep loss can significantly affect decision-making and cognitive performance.",
  },
  REC_REST_02: {
    title: "Schedule short breaks",
    description:
      "Although your condition is not critical, the combination of insufficient sleep and fatigue calls for early action.",
  },
  REC_GLUCOSE_01: {
    title: "Check glucose levels",
    description:
      "Your glucose levels are outside the target range and combined with fatigue may affect your energy and concentration.",
  },
  REC_TEMP_01: {
    title: "Regulate body temperature",
    description:
      "Your body temperature is outside the safe range. Treat this as a priority in the space environment.",
  },
  REC_GENERAL_01: {
    title: "Review overall health",
    description:
      "Several indicators require attention. While none may be critical on its own, the combination increases risk.",
  },
};

const indicatorNames: Record<string, string> = {
  heart_rate: "Heart rate",
  blood_pressure_sys: "Systolic blood pressure",
  blood_pressure_dia: "Diastolic blood pressure",
  temperature: "Temperature",
  sleep_hours: "Sleep hours",
  glucose: "Glucose",
  fatigue_level: "Fatigue level",
};

function formatDate(value?: string | null, locale: Language = "en"): string {
  if (!value) return translations[locale].noData;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "es" ? "es-ES" : "en-US");
}

function formatAlertSummary(
  evaluation: EvaluationRecord,
  priorityAction: string
): string {
  const outOfRangeIndicators = Object.entries(evaluation.indicator_statuses)
    .filter(([, indicator]) => indicator.status !== "green")
    .map(
      ([key, indicator]) =>
        `${indicatorNames[key] ?? key.replaceAll("_", " ")} (${indicator.status})`
    );

  if (outOfRangeIndicators.length === 0) {
    return translations.en.genericAlertMessage;
  }

  return `Overall status: ${evaluation.overall_status.toUpperCase()}. Out-of-range indicators: ${outOfRangeIndicators.join(", ")}. Priority action: ${priorityAction}.`;
}

function App() {
  const language: Language = "en";
  const t = translations[language];
  const sensorCategories = t.sensorCategoriesData;
  const statusLabels = t.statusLabels;
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
      setSyncMessage(t.offlineMessage);
    };

    const handleOnline = async () => {
      const networkAvailable = navigator.onLine;
      if (networkAvailable) {
        setSyncMessage(t.onlineMessage);
      }

      try {
        const syncedCount = await syncQueuedMeasurements();
        await updatePendingCount();
        if (syncedCount > 0) {
          setRefreshToken((token) => token + 1);
          setSyncMessage(t.syncSuccess(syncedCount));
        } else if (networkAvailable) {
          setSyncMessage(null);
        }
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : t.syncFailure
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
  }, [language]);

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
          setError(cause instanceof Error ? cause.message : t.loadCrewFailure);
        }
      })
      .finally(() => {
        if (active) setLoadingAstronauts(false);
      });

    return () => {
      active = false;
    };
  }, [language]);

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
          setError(cause instanceof Error ? cause.message : t.loadHealthFailure);
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAstronautId, refreshToken, language]);

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
        label: t.heartRate,
        unit: "bpm",
        value: values?.heart_rate ?? null,
        status: mapStatus(statuses.heart_rate?.status),
      },
      {
        id: "blood-pressure",
        label: t.bloodPressure,
        unit: "mmHg",
        value: values
          ? `${values.blood_pressure_sys}/${values.blood_pressure_dia}`
          : null,
        status: bloodPressureStatus,
      },
      {
        id: "temperature",
        label: t.temperature,
        unit: "°C",
        value: values?.temperature ?? null,
        status: mapStatus(statuses.temperature?.status),
      },
      {
        id: "sleep-hours",
        label: t.sleepHours,
        unit: "h",
        value: values?.sleep_hours ?? null,
        status: mapStatus(statuses.sleep_hours?.status),
      },
      {
        id: "glucose",
        label: t.glucose,
        unit: "mg/dL",
        value: values?.glucose ?? null,
        status: mapStatus(statuses.glucose?.status),
      },
      {
        id: "fatigue-level",
        label: t.fatigueLevel,
        unit: "/10",
        value: values?.fatigue_level ?? null,
        status: mapStatus(statuses.fatigue_level?.status),
      },
    ];
  }, [latestMeasurement, latestEvaluation, t]);

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
    const copy = recommendation
      ? recommendationCopy[recommendation.id ?? ""]
      : undefined;
    const title = copy?.title ?? t.alertHealth;
    return {
      key,
      id: evaluation.id,
      title,
      message: formatAlertSummary(evaluation, title),
      severity:
        evaluation.overall_status === "red"
          ? ("critical" as const)
          : ("attention" as const),
      createdAt: formatDate(evaluation.created_at, language),
      recommendation: copy?.description ?? t.alertRecommendation,
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
        cause instanceof Error ? cause.message : t.failedAckAlert
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
      setError(cause instanceof Error ? cause.message : t.createAstronautFailure);
    } finally {
      setIsCreatingAstronaut(false);
    }
  };

  const connectionStatus = isApiAvailable ? t.apiOnline : t.apiOffline;
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
          cause instanceof Error ? cause.message : t.syncFailure
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
          <span>{t.connectionMonitoring}</span>
        </div>

        <div className="sensor-sidebar-title">{t.sensorCategories}</div>
        <nav className="sensor-category-list" aria-label={t.sensorCategories}>
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
            <p className="app-eyebrow">{t.telemetryLive}</p>
            <h1>{t.healthCenter}</h1>
            <p className="app-subtitle">{t.crewMonitoring}</p>
          </div>
          <div className="header-actions">
            {astronauts.length > 0 && (
              <label className="crew-picker">
                <span>{t.crewMember}</span>
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
              {showCreateAstronaut ? t.cancel : t.addCrew}
            </button>
            {selectedAstronautId !== null && (
              <button
                type="button"
                onClick={() => setIsMeasurementFormOpen(true)}
                className="button button-primary"
              >
                {t.addMeasurement}
              </button>
            )}
          </div>
        </header>

        {showCreateAstronaut && (
          <form onSubmit={handleCreateAstronaut} className="new-astronaut-form">
            <label className="form-field">
              {t.name}
              <input
                required
                value={astronautName}
                onChange={(event) => setAstronautName(event.target.value)}
              />
            </label>
            <label className="form-field">
              {t.role}
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
              {isCreatingAstronaut ? t.saving : t.register}
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
              {t.pendingSyncSummary(pendingCount)}
            </p>
          )}
          {!loadingAstronauts && astronauts.length === 0 && !error && (
            <p className="data-empty">{t.emptyCrew}</p>
          )}

          {import.meta.env.DEV && (
            <section className="simulator-panel" aria-label="Simulador local">
              <div className="simulator-copy">
                <p className="section-eyebrow">{t.localDemoMode}</p>
                <strong>
                  {isSimulatorRunning ? t.simulatingTelemetry : t.sensorSimulator}
                </strong>
                <small>{t.syntheticDataWarning}</small>
              </div>
              <label className="simulator-profile">
                <span>{t.profile}</span>
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
                  <option value="normal">{t.normal}</option>
                  <option value="attention">{t.attention}</option>
                  <option value="critical">{t.critical}</option>
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
                {isSimulatorRunning ? t.pauseDemo : t.startDemo}
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
              <p className="section-eyebrow">{t.automaticAnalysis}</p>
              <h2>{statusLabels[overallStatus]}</h2>
              <p>
                {latestEvaluation?.summary ?? t.waitingForMeasurement}
              </p>
            </div>
            <div className="diagnostic-meta">
              <span>
                {environment === "spacecraft"
                  ? t.environmentSpacecraft
                  : t.environmentLunarBase}
              </span>
              <small>
                {t.updated} {formatDate(latestMeasurement?.recorded_at, language)}
              </small>
            </div>
            <button
              type="button"
              className="refresh-button"
              onClick={() => setRefreshToken((token) => token + 1)}
              aria-label={t.automaticAnalysis}
              title={t.automaticAnalysis}
            >
              ↻
            </button>
          </section>

          {loadingData && <p className="data-loading">{t.loadingHealthData}</p>}

          <div className="dashboard-layout">
            <section className="body-panel">
              <div className="body-panel-heading">
                <div>
                  <p className="section-eyebrow">{t.sensorCategories}</p>
                  <h2>{t.bodyMapTitle}</h2>
                  <p className="section-description">{t.bodyMapSummary}</p>
                </div>
                <span className="live-badge"><i /> LIVE</span>
              </div>
              <SensorBodyMap statuses={sensorStatuses} />
              <div className="body-legend">
                <span><i className="legend-normal" /> {t.legendNormal}</span>
                <span><i className="legend-attention" /> {t.legendAttention}</span>
                <span><i className="legend-critical" /> {t.legendCritical}</span>
                <span><i className="legend-no-data" /> {t.legendNoData}</span>
              </div>
            </section>

            <div className="health-workspace">
              <IndicatorsGrid indicators={indicators} />
              <div className="trend-grid">
                <TrendCard
                  title={t.heartRate}
                  unit="bpm"
                  color="#ff5470"
                  values={heartRateValues}
                />
                <TrendCard
                  title={t.glucose}
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
                  ? "Measurement saved and synchronized."
                  : "Measurement saved on this device; it will be sent when the connection is restored."
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
