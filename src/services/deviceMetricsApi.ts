import axios from 'axios'
import type { CommunityMockBundle } from '@/mock/communityMocks'
import { resolveDeviceStatus } from '@/mock/equipmentOperation'
import type { TaskReminderItem } from '@/mock/taskReminder'

const DEVICE_METRICS_API_URL = '/api/devices/metrics'

export interface DeviceMetricItem {
  id: string
  deviceNo: number
  name: string
  onenetName: string | null
  online: boolean
  todayUsage: number
  totalCheckins: number
  /** 土壤湿度 wet，0-100，离线或未上报为 null */
  soilMoisture: number | null
  /** 由打卡次数推算，1500 次后为 0 */
  filterLife: number
  /** 粪便盒超声距离 cm */
  distanceCm: number | null
  /** 距离换算的装满百分比，46cm=0%，27cm=100% */
  fecesBoxPercent: number | null
  waterout: number | null
}

export interface DeviceMetricsAlarm {
  id: string
  deviceNo: number
  deviceName: string
  event: string
  datetime: string
  status: 'pending' | 'done'
  source: 'detection' | 'onenet_warn'
}

export interface DeviceMetricsResponse {
  communityId: string | null
  updatedAt: string
  devices: DeviceMetricItem[]
  summary: {
    total: number
    online: number
    offline: number
  }
  totals: {
    totalCheckins: number
    urineLiters: number
    waterSavingLiters: number
  }
  alarms: DeviceMetricsAlarm[]
}

export async function fetchDeviceMetrics(
  communityId: string,
): Promise<DeviceMetricsResponse> {
  const { data } = await axios.get<DeviceMetricsResponse>(DEVICE_METRICS_API_URL, {
    params: { communityId },
    timeout: 20000,
  })
  return data
}

function formatLiters(value: number): string {
  return value.toFixed(2)
}

const OPERATION_DEVICE_NAMES = ['01号桩', '02号桩'] as const

/** 用真实设备指标覆盖 mock：设备状态环、运行状态表、滤芯报警、底部累计栏 */
export function applyDeviceMetrics(
  bundle: CommunityMockBundle,
  metrics: DeviceMetricsResponse,
): CommunityMockBundle {
  const mockDevices = bundle.operationStatus.devices

  const devices = metrics.devices.slice(0, OPERATION_DEVICE_NAMES.length).map((device, index) => {
    const mockRow = mockDevices[index]

    return {
      id: device.id,
      name: OPERATION_DEVICE_NAMES[index],
      isOffline: !device.online,
      todayUsage: device.todayUsage,
      waterLevel: device.soilMoisture ?? mockRow?.waterLevel ?? 0,
      filterLife: device.filterLife,
      fecesBox: device.fecesBoxPercent ?? mockRow?.fecesBox ?? 0,
    }
  })

  const alarmItems: TaskReminderItem[] = metrics.alarms.map((alarm) => ({
    id: `alert-${alarm.id}`,
    status: alarm.status,
    deviceNo: alarm.deviceNo,
    event: alarm.event,
    datetime: alarm.datetime,
  }))

  const pendingCount = metrics.alarms.filter(
    (alarm) => alarm.status === 'pending',
  ).length

  const faultCount = devices.filter(
    (device) =>
      resolveDeviceStatus(device, bundle.operationStatus.abnormalThreshold) === 'fault',
  ).length

  return {
    ...bundle,
    equipmentStatus: {
      ...bundle.equipmentStatus,
      runningCount: metrics.summary.online,
      legend: bundle.equipmentStatus.legend.map((item) => {
        if (item.key === 'online') return { ...item, count: metrics.summary.online }
        if (item.key === 'offline') return { ...item, count: metrics.summary.offline }
        if (item.key === 'fault') return { ...item, count: faultCount }
        return item
      }),
    },
    operationStatus: {
      ...bundle.operationStatus,
      devices: devices.length > 0 ? devices : bundle.operationStatus.devices,
    },
    taskReminder: {
      ...bundle.taskReminder,
      items: alarmItems,
    },
    bottomStats: bundle.bottomStats.map((item) => {
      if (item.key === 'usage-count') {
        return { ...item, value: String(metrics.totals.totalCheckins) }
      }
      if (item.key === 'processed-urine') {
        return { ...item, value: formatLiters(metrics.totals.urineLiters) }
      }
      if (item.key === 'water-saving') {
        return { ...item, value: formatLiters(metrics.totals.waterSavingLiters) }
      }
      if (item.key === 'pending-events') {
        return { ...item, value: String(pendingCount) }
      }
      return item
    }),
  }
}
