import { create } from 'zustand'

export interface Alert {
  id: string
  message: string
  timestamp: number
  type: 'info' | 'warning' | 'critical'
}

interface AppState {
  precision: number
  weather: number
  showFusion: boolean
  showAnomalies: boolean
  isAnalysisOpen: boolean
  isTutorialOpen: boolean
  alerts: Alert[]
  setPrecision: (value: number) => void
  setWeather: (value: number) => void
  toggleFusion: () => void
  toggleAnomalies: () => void
  setAnalysisOpen: (isOpen: boolean) => void
  setTutorialOpen: (isOpen: boolean) => void
  addAlert: (message: string, type?: 'info' | 'warning' | 'critical') => void
  removeAlert: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  precision: 0.85,
  weather: 0.3,
  showFusion: true,
  showAnomalies: true,
  isAnalysisOpen: false,
  isTutorialOpen: false,
  alerts: [],
  setPrecision: (value) => set({ precision: value }),
  setWeather: (value) => set({ weather: value }),
  toggleFusion: () => set((state) => ({ showFusion: !state.showFusion })),
  toggleAnomalies: () => set((state) => ({ showAnomalies: !state.showAnomalies })),
  setAnalysisOpen: (isOpen) => set({ isAnalysisOpen: isOpen }),
  setTutorialOpen: (isOpen) => set({ isTutorialOpen: isOpen }),
  addAlert: (message, type = 'info') => set((state) => ({
    alerts: [
      { id: Math.random().toString(36).substr(2, 9), message, timestamp: Date.now(), type },
      ...state.alerts
    ].slice(0, 5) // Keep last 5
  })),
  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((alert) => alert.id !== id)
  })),
}))
