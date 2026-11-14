

export type HealthStatus = 'normal' | 'attention' | 'critical' | 'no_data';

export type Environment = 'spacecraft' | 'lunar_base';

export type IndicatorKey =
  | 'heart_rate'
  | 'blood_pressure'
  | 'temperature'
  | 'sleep_hours'
  | 'glucose'
  | 'fatigue_level';

export interface BloodPressure {
  systolic: number | null;
  diastolic: number | null;
}

export interface HealthIndicator {
  key: IndicatorKey;
  label: string;
  value: number | BloodPressure | null;
  unit: string;
  status: HealthStatus;
  lastUpdated: string | null; // ISO string
  threshold?: {
    normal: [number, number] | null;
    attention: [number, number] | null;
    critical: [number, number] | null;
  };
}

export interface HealthSnapshot {
  id: string;
  astronautId: string;
  environment: Environment;
  timestamp: string;
  indicators: Record<IndicatorKey, HealthIndicator>;
  overallStatus: HealthStatus;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedIndicators: IndicatorKey[];
  actionable: boolean;
  estimatedTimeMinutes?: number;
}

export interface Alert {
  id: string;
  indicatorKey: IndicatorKey;
  status: HealthStatus;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MeasurementInput {
  heart_rate?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  temperature?: number;
  sleep_hours?: number;
  glucose?: number;
  fatigue_level?: number; // 1-10
  environment: Environment;
  notes?: string;
}

export type BodyZone =
  | 'head'
  | 'chest'
  | 'abdomen'
  | 'left_arm'
  | 'right_arm'
  | 'left_leg'
  | 'right_leg'
  | 'full_body';

export interface ZoneStatus {
  zone: BodyZone;
  status: HealthStatus;
  relatedIndicators: IndicatorKey[];
}