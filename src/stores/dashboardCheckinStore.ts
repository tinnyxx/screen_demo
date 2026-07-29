import { create } from 'zustand'
import {
  fetchDashboardCheckinStats,
  type DashboardCheckinStats,
} from '@/services/dashboardApi'

const REFRESH_MS = 60 * 1000

interface DashboardCheckinState {
  communityId: string | null
  stats: DashboardCheckinStats | null
  start: (communityId: string) => void
  stop: () => void
}

let timer: number | null = null
let activeCommunityId: string | null = null
let refCount = 0

async function loadStats(communityId: string) {
  try {
    const data = await fetchDashboardCheckinStats(communityId)
    if (activeCommunityId === communityId) {
      useDashboardCheckinStore.setState({ stats: data, communityId })
    }
  } catch (error) {
    console.error('获取大屏打卡统计失败', error)
  }
}

export const useDashboardCheckinStore = create<DashboardCheckinState>((set) => ({
  communityId: null,
  stats: null,
  start: (communityId) => {
    refCount += 1

    if (activeCommunityId === communityId && timer !== null) {
      return
    }

    activeCommunityId = communityId
    set({ communityId, stats: null })
    void loadStats(communityId)

    if (timer !== null) {
      window.clearInterval(timer)
    }
    timer = window.setInterval(() => {
      if (activeCommunityId) void loadStats(activeCommunityId)
    }, REFRESH_MS)
  },
  stop: () => {
    refCount = Math.max(0, refCount - 1)
    if (refCount > 0) return

    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    activeCommunityId = null
    set({ communityId: null, stats: null })
  },
}))
