import api from "./api";
import { ApiRequestError } from "./api";
import {
  cacheApiValue,
  getCachedApiValue,
  listQueuedMeasurements,
  removeQueuedMeasurement,
  saveQueuedMeasurement,
  type QueuedMeasurement,
} from "./offlineStorage";
import type {
  Environment,
  HealthIndicator,
  HealthSnapshot,
  HealthStatus,
  IndicatorKey,
  Recommendation,
} from "../types/health";

export interface MeasurementCreatePayload {
  astronaut_id: number;
  client_measurement_id?: string;
  environment: Environment;
  heart_rate: number;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  temperature: number;
  sleep_hours: number;
  glucose: number;
  fatigue_level: number;
  notes?: string;
}

export interface Astronaut {
  id: number;
  name: string;
  role: string;
  current_environment: Environment;
}

export interface MeasurementRecord extends MeasurementCreatePayload {
  id: number | string;
  recorded_at: string;
}

export interface IndicatorStatus {
  status: "green" | "yellow" | "red";
  value: number;
  explanation?: string;
}

export interface RecommendationFromAPI {
  id?: string;
  title: string;
  message?: string;
  description?: string;
  actions?: string[];
  priority?: number | "high" | "medium" | "low" | string;
  related_indicators?: string[];
  actionable?: boolean;
  estimated_time_minutes?: number;
}

export interface EvaluationResult {
  overall_status: "green" | "yellow" | "red";
  indicator_statuses: Record<string, IndicatorStatus>;
  triggered_rules: string[];
  recommendations: RecommendationFromAPI[];
  summary: string;
  environment: string;
  evaluated_at?: string;
}

export interface EvaluationRecord extends EvaluationResult {
  id: number;
  measurement_id: number;
  astronaut_id: number;
  acknowledged: boolean;
  created_at: string;
}

export interface MeasurementSubmission {
  synced: boolean;
  evaluation?: EvaluationResult;
}

export type DemoProfile = "normal" | "attention" | "critical";

export async function checkApiConnection(): Promise<boolean> {
  try {
    const health = await api.get<{ status: string }>("/health");
    return health.status === "ok";
  } catch {
    return false;
  }
}

export async function generateDemoTick(
  astronautId: number,
  environment: Environment,
  profile: DemoProfile
): Promise<EvaluationResult> {
  return api.post<EvaluationResult>("/api/v1/demo/simulator/tick", {
    astronaut_id: astronautId,
    environment,
    profile,
  });
}

export async function acknowledgeEvaluation(
  evaluationId: number
): Promise<void> {
  await api.patch<{ message: string; alert_id: number }>(
    `/api/v1/evaluations/${evaluationId}/acknowledge`
  );
}

export async function submitMeasurement(
  payload: MeasurementCreatePayload
): Promise<MeasurementSubmission> {
  const queued: QueuedMeasurement = {
    ...payload,
    client_measurement_id: crypto.randomUUID(),
    recorded_at: new Date().toISOString(),
  };
  await saveQueuedMeasurement(queued);

  try {
    const evaluation = await api.post<EvaluationResult>(
      "/api/v1/measurements/",
      queued
    );
    await removeQueuedMeasurement(queued.client_measurement_id);
    return { synced: true, evaluation };
  } catch (cause) {
    if (cause instanceof ApiRequestError && cause.status < 500) {
      await removeQueuedMeasurement(queued.client_measurement_id);
      throw cause;
    }

    return { synced: false };
  }
}

export async function syncQueuedMeasurements(): Promise<number> {
  const queuedMeasurements = (await listQueuedMeasurements()).sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  let synced = 0;

  for (const measurement of queuedMeasurements) {
    try {
      await api.post<EvaluationResult>("/api/v1/measurements/", measurement);
      await removeQueuedMeasurement(measurement.client_measurement_id);
      synced += 1;
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status < 500) {
        throw cause;
      }
      break;
    }
  }

  return synced;
}

export async function listMeasurements(
  astronautId: number
): Promise<MeasurementRecord[]> {
  const cacheKey = `measurements:${astronautId}`;
  let measurements: MeasurementRecord[];

  try {
    measurements = await api.get<MeasurementRecord[]>(
      `/api/v1/measurements/?astronaut_id=${astronautId}`
    );
    await cacheApiValue(cacheKey, measurements);
  } catch (cause) {
    const cached = await getCachedApiValue<MeasurementRecord[]>(cacheKey);
    if (!cached) throw cause;
    measurements = cached;
  }

  const pending = (await listQueuedMeasurements())
    .filter((measurement) => measurement.astronaut_id === astronautId)
    .map((measurement) => ({
      ...measurement,
      id: `pending-${measurement.client_measurement_id}`,
    }));

  return [...measurements, ...pending].sort(
    (a, b) =>
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
}

export async function getEvaluations(
  astronautId?: number
): Promise<EvaluationRecord[]> {
  const query = astronautId != null ? `?astronaut_id=${astronautId}` : "";
  const cacheKey = `evaluations:${astronautId ?? "all"}`;
  try {
    const evaluations = await api.get<EvaluationRecord[]>(
      `/api/v1/evaluations/${query}`
    );
    await cacheApiValue(cacheKey, evaluations);
    return evaluations;
  } catch (cause) {
    const cached = await getCachedApiValue<EvaluationRecord[]>(cacheKey);
    if (!cached) throw cause;
    return cached;
  }
}

export async function listAstronauts(): Promise<Astronaut[]> {
  try {
    const astronauts = await api.get<Astronaut[]>("/api/v1/astronauts/");
    await cacheApiValue("astronauts", astronauts);
    return astronauts;
  } catch (cause) {
    const cached = await getCachedApiValue<Astronaut[]>("astronauts");
    if (!cached) throw cause;
    return cached;
  }
}

export async function createAstronaut(data: {
  name: string;
  role: string;
  current_environment: Environment;
}): Promise<Astronaut> {
  const astronaut = await api.post<Astronaut>("/api/v1/astronauts/", data);
  const cached = (await getCachedApiValue<Astronaut[]>("astronauts")) ?? [];
  await cacheApiValue("astronauts", [...cached, astronaut]);
  return astronaut;
}

export function mapStatus(backendStatus?: string): HealthStatus {
  switch (backendStatus) {
    case "green":
      return "normal";
    case "yellow":
      return "attention";
    case "red":
      return "critical";
    default:
      return "no_data";
  }
}

const INDICATOR_LABELS: Record<IndicatorKey, string> = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  temperature: "Temperature",
  sleep_hours: "Sleep Hours",
  glucose: "Glucose",
  fatigue_level: "Fatigue Level",
};

const INDICATOR_UNITS: Record<IndicatorKey, string> = {
  heart_rate: "bpm",
  blood_pressure: "mmHg",
  temperature: "°C",
  sleep_hours: "h",
  glucose: "mg/dL",
  fatigue_level: "/10",
};

const INDICATOR_KEYS: IndicatorKey[] = [
  "heart_rate",
  "blood_pressure",
  "temperature",
  "sleep_hours",
  "glucose",
  "fatigue_level",
];

export function mapEvaluationToSnapshot(
  result: EvaluationResult,
  astronautId: string
): HealthSnapshot {
  const timestamp = result.evaluated_at ?? new Date().toISOString();
  const systolic = result.indicator_statuses.blood_pressure_sys;
  const diastolic = result.indicator_statuses.blood_pressure_dia;
  const bloodPressureStatus = [systolic?.status, diastolic?.status]
    .map(mapStatus)
    .sort(
      (a, b) =>
        ["no_data", "normal", "attention", "critical"].indexOf(b) -
        ["no_data", "normal", "attention", "critical"].indexOf(a)
    )[0];
  const bloodPressureIndicator: IndicatorStatus | undefined =
    systolic || diastolic
      ? {
          status:
            bloodPressureStatus === "critical"
              ? "red"
              : bloodPressureStatus === "attention"
                ? "yellow"
                : "green",
          value: systolic?.value ?? diastolic?.value ?? 0,
        }
      : undefined;
  const statusByKey: Partial<Record<IndicatorKey, IndicatorStatus>> = {
    ...result.indicator_statuses,
    ...(bloodPressureIndicator
      ? { blood_pressure: bloodPressureIndicator }
      : {}),
  };

  const indicators = Object.fromEntries(
    INDICATOR_KEYS.map((key) => {
      const apiIndicator = statusByKey[key];
      const value = key === "blood_pressure"
        ? { systolic: systolic?.value ?? null, diastolic: diastolic?.value ?? null }
        : apiIndicator?.value ?? null;

      const indicator: HealthIndicator = {
        key,
        label: INDICATOR_LABELS[key],
        value,
        unit: INDICATOR_UNITS[key],
        status: apiIndicator ? mapStatus(apiIndicator.status) : "no_data",
        lastUpdated: apiIndicator ? timestamp : null,
      };

      return [key, indicator];
    })
  ) as Record<IndicatorKey, HealthIndicator>;

  return {
    id: crypto.randomUUID(),
    astronautId,
    environment: result.environment as Environment,
    timestamp,
    indicators,
    overallStatus: mapStatus(result.overall_status),
  };
}

export function mapRecommendations(
  recs: EvaluationResult["recommendations"]
): Recommendation[] {
  return recs.map((recommendation, index) => {
    const priority = typeof recommendation.priority === "number"
      ? recommendation.priority <= 2
        ? "high"
        : recommendation.priority <= 4
          ? "medium"
          : "low"
      : recommendation.priority;

    return {
      id: recommendation.id ?? `rec-${index}`,
      title: recommendation.title,
      description:
        recommendation.message ?? recommendation.description ?? recommendation.actions?.join(" ") ?? "",
      priority: priority === "high" || priority === "low" ? priority : "medium",
      relatedIndicators: (recommendation.related_indicators as IndicatorKey[]) ?? [],
      actionable: recommendation.actionable ?? true,
      estimatedTimeMinutes: recommendation.estimated_time_minutes,
    };
  });
}
