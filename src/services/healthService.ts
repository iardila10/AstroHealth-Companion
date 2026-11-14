
import api from "./api";

// Health measurement structure
export interface HealthMeasurements {
  heart_rate: number;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  temperature: number;
  sleep_hours: number;
  glucose: number;
  fatigue_level: number;
}

// Health dashboard response
export interface HealthDashboard {
  astronautId: string;
  environment: "spacecraft" | "lunar_base";
  overallStatus: "normal" | "warning" | "critical" | "unknown";
  metrics: HealthMeasurements;
  updatedAt: string;
}

// Retrieve health dashboard
export async function getHealthDashboard(): Promise<HealthDashboard> {
  return await api.get<HealthDashboard>("/health/dashboard");
}

// Submit health measurements
export async function submitMeasurements(
  measurements: HealthMeasurements
): Promise<HealthDashboard> {
  return await api.post<HealthDashboard>(
    "/health/measurements",
    measurements
  );
}
