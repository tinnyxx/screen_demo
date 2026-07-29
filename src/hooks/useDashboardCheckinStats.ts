import { useEffect } from 'react'
import { useResolvedCommunityId } from '@/hooks/useActiveCommunity'
import { useDashboardCheckinStore } from '@/stores/dashboardCheckinStore'
import type { DashboardCheckinStats } from '@/services/dashboardApi'

export function useDashboardCheckinStats(): DashboardCheckinStats | null {
  const communityId = useResolvedCommunityId()
  const stats = useDashboardCheckinStore((state) => state.stats)
  const start = useDashboardCheckinStore((state) => state.start)
  const stop = useDashboardCheckinStore((state) => state.stop)
  const storeCommunityId = useDashboardCheckinStore((state) => state.communityId)

  useEffect(() => {
    if (!communityId) {
      stop()
      return
    }

    start(communityId)
    return () => {
      stop()
    }
  }, [communityId, start, stop])

  if (!communityId || storeCommunityId !== communityId) return null
  return stats
}
