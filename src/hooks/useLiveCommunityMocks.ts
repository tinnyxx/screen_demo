import { useEffect, useState } from 'react'
import { useCommunityMocks, useResolvedCommunityId } from '@/hooks/useActiveCommunity'
import type { CommunityMockBundle } from '@/mock/communityMocks'
import { applyDeviceMetrics, fetchDeviceMetrics } from '@/services/deviceMetricsApi'

const DEVICE_METRICS_REFRESH_MS = 60 * 1000

export function useLiveCommunityMocks(): CommunityMockBundle | null {
  const communityId = useResolvedCommunityId()
  const baseMocks = useCommunityMocks()
  const [liveMocks, setLiveMocks] = useState<CommunityMockBundle | null>(baseMocks)

  useEffect(() => {
    setLiveMocks(baseMocks)
  }, [baseMocks])

  useEffect(() => {
    if (!baseMocks || !communityId) return

    let cancelled = false

    const loadDeviceMetrics = async () => {
      try {
        const metrics = await fetchDeviceMetrics(communityId)
        if (!cancelled) {
          setLiveMocks(applyDeviceMetrics(baseMocks, metrics))
        }
      } catch (error) {
        console.error('获取设备运行指标失败', error)
        if (!cancelled) {
          setLiveMocks(baseMocks)
        }
      }
    }

    void loadDeviceMetrics()
    const timer = window.setInterval(loadDeviceMetrics, DEVICE_METRICS_REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [baseMocks, communityId])

  return liveMocks
}
