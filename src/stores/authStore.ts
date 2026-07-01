import { create } from 'zustand'

const AUTH_STORAGE_KEY = 'screen_demo_auth'

export interface AuthUser {
  username: string
  nickname: string
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadStoredUser(),
  setUser: (user) => {
    persistUser(user)
    set({ user })
  },
  logout: () => {
    persistUser(null)
    set({ user: null })
  },
}))

export function isAuthenticated() {
  return useAuthStore.getState().user !== null
}
