import { create } from 'zustand'

const APP_MODE_STORAGE_KEY = 'screen_demo_app_mode'

export type AppMode = 'hub' | 'redeem' | 'monitor'

interface AppModeState {
  mode: AppMode
  setMode: (mode: AppMode) => void
  resetMode: () => void
}

function loadStoredMode(): AppMode {
  try {
    const raw = sessionStorage.getItem(APP_MODE_STORAGE_KEY)
    if (raw === 'hub' || raw === 'redeem' || raw === 'monitor') return raw
    return 'hub'
  } catch {
    return 'hub'
  }
}

function persistMode(mode: AppMode) {
  try {
    sessionStorage.setItem(APP_MODE_STORAGE_KEY, mode)
  } catch {
    // ignore storage errors
  }
}

export const useAppModeStore = create<AppModeState>((set) => ({
  mode: loadStoredMode(),
  setMode: (mode) => {
    persistMode(mode)
    set({ mode })
  },
  resetMode: () => {
    persistMode('hub')
    set({ mode: 'hub' })
  },
}))
