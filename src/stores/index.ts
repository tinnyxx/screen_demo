import { create } from 'zustand'

interface AppState {
  title: string
  setTitle: (title: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  title: '瓴界·数据监测平台',
  setTitle: (title) => set({ title }),
}))
