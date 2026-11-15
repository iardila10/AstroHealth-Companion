
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Environment } from '../types/health';

interface AstronautProfile {
  id: string;
  name: string;
  missionRole: string;
  age: number;
  heightCm: number;
  weightKg: number;
  bloodType?: string;
}

interface AstronautState {
  astronaut: AstronautProfile | null;
  currentEnvironment: Environment;
  points: number;
  completedRecommendations: string[]; // recommendation IDs

  setAstronaut: (astronaut: AstronautProfile) => void;
  setEnvironment: (env: Environment) => void;
  addPoints: (amount: number) => void;
  markRecommendationCompleted: (recommendationId: string) => void;
  resetPoints: () => void;
  reset: () => void;
}

const initialState = {
  astronaut: null,
  currentEnvironment: 'spacecraft' as Environment,
  points: 0,
  completedRecommendations: [],
};

export const useAstronautStore = create<AstronautState>()(
  persist(
    (set) => ({
      ...initialState,

      setAstronaut: (astronaut) => set({ astronaut }),

      setEnvironment: (currentEnvironment) => set({ currentEnvironment }),

      addPoints: (amount) =>
        set((state) => ({
          points: state.points + amount,
        })),

      markRecommendationCompleted: (recommendationId) =>
        set((state) => ({
          completedRecommendations: [
            ...new Set([...state.completedRecommendations, recommendationId]),
          ],
        })),

      resetPoints: () => set({ points: 0 }),

      reset: () => set(initialState),
    }),
    {
      name: 'astrohealth-astronaut-store',
    }
  )
);