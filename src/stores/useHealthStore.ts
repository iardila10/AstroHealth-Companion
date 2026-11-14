
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  HealthSnapshot,
  HealthIndicator,
  IndicatorKey,
  HealthStatus,
  Alert,
  Recommendation,
  ZoneStatus,
  BodyZone,
} from '../types/health';

interface HealthState {
  currentSnapshot: HealthSnapshot | null;
  alerts: Alert[];
  recommendations: Recommendation[];
  history: HealthSnapshot[];
  isLoading: boolean;
  error: string | null;

  setSnapshot: (snapshot: HealthSnapshot) => void;
  updateIndicator: (key: IndicatorKey, data: Partial<HealthIndicator>) => void;
  setAlerts: (alerts: Alert[]) => void;
  acknowledgeAlert: (alertId: string) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  addToHistory: (snapshot: HealthSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  getOverallStatus: () => HealthStatus;
  getZoneStatuses: () => ZoneStatus[];
  getIndicator: (key: IndicatorKey) => HealthIndicator | null;
}

const initialState = {
  currentSnapshot: null,
  alerts: [],
  recommendations: [],
  history: [],
  isLoading: false,
  error: null,
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSnapshot: (snapshot) =>
        set({
          currentSnapshot: snapshot,
          error: null,
        }),

      updateIndicator: (key, data) =>
        set((state) => {
          if (!state.currentSnapshot) return state;

          const updatedIndicators = {
            ...state.currentSnapshot.indicators,
            [key]: {
              ...state.currentSnapshot.indicators[key],
              ...data,
            },
          };

          const statuses = Object.values(updatedIndicators).map((i) => i.status);
          let overall: HealthStatus = 'normal';
          if (statuses.includes('critical')) overall = 'critical';
          else if (statuses.includes('attention')) overall = 'attention';
          else if (statuses.includes('no_data')) overall = 'no_data';

          return {
            currentSnapshot: {
              ...state.currentSnapshot,
              indicators: updatedIndicators,
              overallStatus: overall,
            },
          };
        }),

      setAlerts: (alerts) => set({ alerts }),

      acknowledgeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
        })),

      setRecommendations: (recommendations) => set({ recommendations }),

      addToHistory: (snapshot) =>
        set((state) => ({
          history: [snapshot, ...state.history].slice(0, 50),
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      reset: () => set(initialState),

      getOverallStatus: () => {
        return get().currentSnapshot?.overallStatus ?? 'no_data';
      },

      getIndicator: (key) => {
        return get().currentSnapshot?.indicators[key] ?? null;
      },

      getZoneStatuses: (): ZoneStatus[] => {
        const snapshot = get().currentSnapshot;

        if (!snapshot) {
          return [
            { zone: 'head', status: 'no_data', relatedIndicators: [] },
            { zone: 'chest', status: 'no_data', relatedIndicators: [] },
            { zone: 'abdomen', status: 'no_data', relatedIndicators: [] },
            { zone: 'left_arm', status: 'no_data', relatedIndicators: [] },
            { zone: 'right_arm', status: 'no_data', relatedIndicators: [] },
            { zone: 'left_leg', status: 'no_data', relatedIndicators: [] },
            { zone: 'right_leg', status: 'no_data', relatedIndicators: [] },
          ];
        }

        const indicators = snapshot.indicators;

        const zoneMap: Record<BodyZone, IndicatorKey[]> = {
          head: ['fatigue_level', 'sleep_hours'],
          chest: ['heart_rate', 'blood_pressure'],
          abdomen: ['glucose', 'temperature'],
          left_arm: ['blood_pressure', 'heart_rate'],
          right_arm: ['blood_pressure', 'heart_rate'],
          left_leg: ['fatigue_level'],
          right_leg: ['fatigue_level'],
          full_body: [
            'heart_rate',
            'blood_pressure',
            'temperature',
            'sleep_hours',
            'glucose',
            'fatigue_level',
          ],
        };

        const getWorstStatus = (keys: IndicatorKey[]): HealthStatus => {
          const statuses = keys.map((k) => indicators[k]?.status ?? 'no_data');
          if (statuses.includes('critical')) return 'critical';
          if (statuses.includes('attention')) return 'attention';
          if (statuses.every((s) => s === 'no_data')) return 'no_data';
          return 'normal';
        };

        return (Object.keys(zoneMap) as BodyZone[]).map((zone) => ({
          zone,
          status: getWorstStatus(zoneMap[zone]),
          relatedIndicators: zoneMap[zone],
        }));
      },
    }),
    {
      name: 'astrohealth-health-store',
      partialize: (state) => ({
        currentSnapshot: state.currentSnapshot,
        history: state.history,
      }),
    }
  )
);