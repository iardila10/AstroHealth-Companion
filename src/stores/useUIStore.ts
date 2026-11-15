
import { create } from 'zustand';
import type { BodyZone } from '../types/health';

interface UIState {
  // Layout
  sidebarCollapsed: boolean;
  activeView: 'dashboard' | 'measurements' | 'history' | 'settings';

  // Human Figure
  selectedZone: BodyZone | null;
  isZoneDetailOpen: boolean;

  // Measurement Form
  isMeasurementFormOpen: boolean;
  isCameraMode: boolean;

  // Alerts & Feedback
  showReminderToast: boolean;
  toastMessage: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveView: (view: UIState['activeView']) => void;

  selectZone: (zone: BodyZone | null) => void;
  openZoneDetail: (zone: BodyZone) => void;
  closeZoneDetail: () => void;

  openMeasurementForm: () => void;
  closeMeasurementForm: () => void;
  setCameraMode: (enabled: boolean) => void;

  showToast: (message: string) => void;
  hideToast: () => void;

  resetUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeView: 'dashboard',

  selectedZone: null,
  isZoneDetailOpen: false,

  isMeasurementFormOpen: false,
  isCameraMode: false,

  showReminderToast: false,
  toastMessage: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  setActiveView: (activeView) => set({ activeView }),

  selectZone: (selectedZone) => set({ selectedZone }),

  openZoneDetail: (zone) =>
    set({
      selectedZone: zone,
      isZoneDetailOpen: true,
    }),

  closeZoneDetail: () =>
    set({
      selectedZone: null,
      isZoneDetailOpen: false,
    }),

  openMeasurementForm: () => set({ isMeasurementFormOpen: true }),
  closeMeasurementForm: () =>
    set({
      isMeasurementFormOpen: false,
      isCameraMode: false,
    }),

  setCameraMode: (isCameraMode) => set({ isCameraMode }),

  showToast: (message) =>
    set({
      showReminderToast: true,
      toastMessage: message,
    }),

  hideToast: () =>
    set({
      showReminderToast: false,
      toastMessage: null,
    }),

  resetUI: () =>
    set({
      sidebarCollapsed: false,
      activeView: 'dashboard',
      selectedZone: null,
      isZoneDetailOpen: false,
      isMeasurementFormOpen: false,
      isCameraMode: false,
      showReminderToast: false,
      toastMessage: null,
    }),
}));