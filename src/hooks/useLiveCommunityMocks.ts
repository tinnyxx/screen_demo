import { useEffect, useState } from 'react'
import { useCommunityMocks, useResolvedCommunityId } from '@/hooks/useActiveCommunity'
import type { CommunityMockBundle } from '@/mock/communityMocks'
import {
  applyDeviceMetrics,
  fetchDeviceMetrics,
  SHOW_OPS_TASKS,
  type DeviceMetricsResponse,
} from '@/services/deviceMetricsApi'

const DEVICE_METRICS_REFRESH_MS = 60 * 1000
const HUARUN_DEVICE_ID = 'STATION_006'
const URINE_PER_CHECKIN_L = 0.08

/** 华润大屏只展示 01 号 STATION_006 */
function restrictDisplayedMetrics(
  communityId: string,
  metrics: DeviceMetricsResponse,
): DeviceMetricsResponse {
  if (communityId !== 'huarun') return metrics

  const devices = metrics.devices.filter((device) => device.id === HUARUN_DEVICE_ID)
  const deviceNos = new Set(devices.map((device) => device.deviceNo))
  const totalCheckins = devices.reduce((sum, device) => sum + device.totalCheckins, 0)
  const waterSaving = devices.reduce((sum, device) => sum + (device.waterout ?? 0), 0)

  return {
    ...metrics,
    devices,
    summary: {
      total: devices.length,
      online: devices.filter((device) => device.online).length,
      offline: devices.filter((device) => !device.online).length,
    },
    totals: {
      totalCheckins,
      urineLiters: Number((totalCheckins * URINE_PER_CHECKIN_L).toFixed(2)),
      waterSavingLiters: Number(waterSaving.toFixed(2)),
    },
    alarms: metrics.alarms.filter((alarm) => deviceNos.has(alarm.deviceNo)),
  }
}

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
        const metrics = restrictDisplayedMetrics(
          communityId,
          await fetchDeviceMetrics(communityId),
        )
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
