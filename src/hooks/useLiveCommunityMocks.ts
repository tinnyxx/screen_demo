import { useEffect, useState } from 'react'
import { useCommunityMocks, useResolvedCommunityId } from '@/hooks/useActiveCommunity'
import type { CommunityMockBundle } from '@/mock/communityMocks'
import {
  applyDeviceMetrics,
  fetchDeviceMetrics,
  SHOW_OPS_TASKS,
} from '@/services/deviceMetricsApi'

const DEVICE_METRICS_REFRESH_MS = 60 * 1000

/** mock / 接口失败时也隐藏运维任务，避免短暂露出假数据 */
function withoutOpsTasks(bundle: CommunityMockBundle): CommunityMockBundle {
  if (SHOW_OPS_TASKS) return bundle
  return {
    ...bundle,
    taskReminder: { ...bundle.taskReminder, items: [] },
    bottomStats: bundle.bottomStats.map((item) =>
      item.key === 'pending-events' ? { ...item, value: '0' } : item,
    ),
  }
}

export function useLiveCommunityMocks(): CommunityMockBundle | null {
  const communityId = useResolvedCommunityId()
  const baseMocks = useCommunityMocks()
  const [liveMocks, setLiveMocks] = useState<CommunityMockBundle | null>(
    baseMocks ? withoutOpsTasks(baseMocks) : null,
  )

  useEffect(() => {
    setLiveMocks(baseMocks ? withoutOpsTasks(baseMocks) : null)
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
          setLiveMocks(withoutOpsTasks(baseMocks))
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
