import api from "./api";
import type {
  HealthStatus,
  HealthSnapshot,
  HealthIndicator,
  IndicatorKey,
  Environment,
  Recommendation,
} from "../types/health";

// ========== API Types ==========

export interface MeasurementCreatePayload {
  astronaut_id: number;
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

export interface IndicatorStatus {
  status: "green" | "yellow" | "red";
  value: number;
  explanation?: string;
}

export interface RecommendationFromAPI {
  id?: string;
  title: string;
  description: string;
  priority?: "high" | "medium" | "low" | string;
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

// ========== API Calls ==========

export async function submitMeasurement(
  payload: MeasurementCreatePayload
): Promise<EvaluationResult> {
  return api.post<EvaluationResult>("/api/v1/measurements/", payload);
}

export async function getEvaluations(astronautId?: number) {
  const query = astronautId != null ? `?astronaut_id=${astronautId}` : "";
  return api.get(`/api/v1/evaluations/${query}`);
}

export async function listAstronauts() {
  return api.get("/api/v1/astronauts/");
}

export async function createAstronaut(data: {
  name: string;
  role: string;
  current_environment: Environment;
}) {
  return api.post("/api/v1/astronauts/", data);
}

// ========== Mappers ==========

export function mapStatus(
  backendStatus: "green" | "yellow" | "red"
): HealthStatus {
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

const INDICATOR_LABELS: Record<string, string> = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  temperature: "Temperature",
  sleep_hours: "Sleep Hours",
  glucose: "Glucose",
  fatigue_level: "Fatigue Level",
};

const INDICATOR_UNITS: Record<string, string> = {
  heart_rate: "bpm",
  blood_pressure: "mmHg",
  temperature: "°C",
  sleep_hours: "h",
  glucose: "mg/dL",
  fatigue_level: "/10",
};

export function mapEvaluationToSnapshot(
  result: EvaluationResult,
  astronautId: string
): HealthSnapshot {
  const indicators = {} as Record<IndicatorKey, HealthIndicator>;

  for (const [key, ind] of Object.entries(result.indicator_statuses)) {
    const typedKey = key as IndicatorKey;
    indicators[typedKey] = {
      key: typedKey,
      label: INDICATOR_LABELS[key] ?? key,
      value: ind.value,
      unit: INDICATOR_UNITS[key] ?? "",
      status: mapStatus(ind.status),
      lastUpdated: result.evaluated_at ?? new Date().toISOString(),
    };
  }

  return {
    id: crypto.randomUUID(),
    astronautId,
    environment: result.environment as Environment,
    timestamp: result.evaluated_at ?? new Date().toISOString(),
    indicators,
    overallStatus: mapStatus(result.overall_status),
  };
}

export function mapRecommendations(
  recs: EvaluationResult["recommendations"]
): Recommendation[] {
  return recs.map((r, index) => ({
    id: r.id ?? `rec-${index}`,
    title: r.title,
    description: r.description,
    priority: (r.priority as Recommendation["priority"]) ?? "medium",
    relatedIndicators: (r.related_indicators as IndicatorKey[]) ?? [],
    actionable: r.actionable ?? true,
    estimatedTimeMinutes: r.estimated_time_minutes,
  }));
}