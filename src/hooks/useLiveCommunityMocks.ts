import { useEffect, useState } from 'react'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import type { CommunityMockBundle } from '@/mock/communityMocks'
import {
  applyDeviceOnlineStatus,
  fetchDeviceStatuses,
} from '@/services/deviceStatusApi'

const DEVICE_STATUS_REFRESH_MS = 60 * 1000

export function useLiveCommunityMocks(): CommunityMockBundle | null {
  const baseMocks = useCommunityMocks()
  const [liveMocks, setLiveMocks] = useState<CommunityMockBundle | null>(baseMocks)

  useEffect(() => {
    setLiveMocks(baseMocks)
  }, [baseMocks])

  useEffect(() => {
    if (!baseMocks) return

    let cancelled = false

    const loadDeviceStatuses = async () => {
      try {
        const statusData = await fetchDeviceStatuses()
        if (!cancelled) {
          setLiveMocks(applyDeviceOnlineStatus(baseMocks, statusData))
        }
      } catch (error) {
        console.error('获取设备在线状态失败', error)
        if (!cancelled) {
          setLiveMocks(baseMocks)
        }
      }
    }

    void loadDeviceStatuses()
    const timer = window.setInterval(loadDeviceStatuses, DEVICE_STATUS_REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [baseMocks])

  return liveMocks
}
