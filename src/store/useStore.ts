import { create } from 'zustand'

export interface Alert {
  id: string
  message: string
  timestamp: number
  type: 'info' | 'warning' | 'critical'
  coordinates?: { lat: number, lon: number }
}

interface AppState {
  precision: number
  weather: number
  showFusion: boolean
  showAnomalies: boolean
  isAnalysisOpen: boolean
  isTutorialOpen: boolean
  alerts: Alert[]
  selectedAlertId: string | null
  setPrecision: (value: number) => void
  setWeather: (value: number) => void
  toggleFusion: () => void
  toggleAnomalies: () => void
  setAnalysisOpen: (isOpen: boolean) => void
  setTutorialOpen: (isOpen: boolean) => void
  addAlert: (message: string, type?: 'info' | 'warning' | 'critical', coordinates?: { lat: number, lon: number }) => void
  removeAlert: (id: string) => void
  setSelectedAlert: (id: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  precision: 0.85,
  weather: 0.3,
  showFusion: true,
  showAnomalies: true,
  isAnalysisOpen: false,
  isTutorialOpen: false,
  alerts: [],
  selectedAlertId: null,
  setPrecision: (value) => set({ precision: value }),
  setWeather: (value) => set({ weather: value }),
  toggleFusion: () => set((state) => ({ showFusion: !state.showFusion })),
  toggleAnomalies: () => set((state) => ({ showAnomalies: !state.showAnomalies })),
  setAnalysisOpen: (isOpen) => set({ isAnalysisOpen: isOpen }),
  setTutorialOpen: (isOpen) => set({ isTutorialOpen: isOpen }),
  addAlert: (message, type = 'info', coordinates) => set((state) => ({
    alerts: [
      { id: Math.random().toString(36).substr(2, 9), message, timestamp: Date.now(), type, coordinates },
      ...state.alerts
    ].slice(0, 5) 
  })),
  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((alert) => alert.id !== id),
    selectedAlertId: state.selectedAlertId === id ? null : state.selectedAlertId
  })),
  setSelectedAlert: (id) => set({ selectedAlertId: id }),
}))
