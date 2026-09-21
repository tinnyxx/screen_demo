import { create } from 'zustand'
import type { CommunityId } from '@/config/communities'

const COMMUNITY_STORAGE_KEY = 'screen_demo_community'

interface CommunityState {
  communityId: CommunityId | null
  setCommunityId: (communityId: CommunityId | null) => void
  clearCommunity: () => void
}

function loadStoredCommunityId(): CommunityId | null {
  try {
    const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY)
    if (raw === 'lanwan' || raw === 'shengnawei') return raw
    // 华润已从选择页隐藏：旧缓存切到圣拿威
    if (raw === 'huarun') return 'shengnawei'
    return null
  } catch {
    return null
  }
}

function persistCommunityId(communityId: CommunityId | null) {
  if (communityId) {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, communityId)
  } else {
    localStorage.removeItem(COMMUNITY_STORAGE_KEY)
  }
}

export const useCommunityStore = create<CommunityState>((set) => ({
  communityId: loadStoredCommunityId(),
  setCommunityId: (communityId) => {
    persistCommunityId(communityId)
    set({ communityId })
  },
  clearCommunity: () => {
    persistCommunityId(null)
    set({ communityId: null })
  },
}))
