import { create } from 'zustand'

interface AppState {
  title: string
  setTitle: (title: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  title: '数字孪生监控平台',
  setTitle: (title) => set({ title }),
}))
