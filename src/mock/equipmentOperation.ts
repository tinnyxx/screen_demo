export type DeviceRunStatus = 'normal' | 'offline' | 'fault'

export function formatPileName(deviceNo: number): string {
  return `${String(deviceNo).padStart(2, '0')}号桩`
}

export type MetricKey = 'waterLevel' | 'filterLife' | 'fecesBox'

export interface DeviceOperationRow {
  id: string
  name: string
  /** 离线设备不参与指标异常计算 */
  isOffline: boolean
  todayUsage: number
  waterLevel: number
  filterLife: number
  fecesBox: number
}

export interface OperationStatusData {
  updateTime: string
  abnormalThreshold: number
  warningColor: string
  metricColors: Record<MetricKey, string>
  columns: string[]
  devices: DeviceOperationRow[]
}

export const operationMetricColors = {
  waterLevel: '#4A8BDB',
  filterLife: '#61B060',
  fecesBox: '#D7B160',
} as const

export const operationWarningColor = '#D7B160'

export const operationStatusMock: OperationStatusData = {
  updateTime: '2026.06.24',
  abnormalThreshold: 80,
  warningColor: operationWarningColor,
  metricColors: operationMetricColors,
  columns: ['设备名称', '状态', '今日使用', '土壤湿度情况', '滤芯寿命', '粪便盒状态'],
  devices: [
    {
      id: '1',
      name: '01号桩',
      isOffline: false,
      todayUsage: 12,
      waterLevel: 56,
      filterLife: 72,
      fecesBox: 35,
    },
    {
      id: '2',
      name: '02号桩',
      isOffline: true,
      todayUsage: 0,
      waterLevel: 48,
      filterLife: 65,
      fecesBox: 20,
    },
  ],
}

export function isMetricAbnormal(key: MetricKey, value: number, threshold = 80): boolean {
  if (key === 'filterLife') {
    return value <= 100 - threshold
  }

  return value >= threshold
}

export function resolveDeviceStatus(device: DeviceOperationRow, threshold = 80): DeviceRunStatus {
  if (device.isOffline) return 'offline'

  const metrics: MetricKey[] = ['waterLevel', 'filterLife', 'fecesBox']
  const hasAbnormal = metrics.some((key) =>
    isMetricAbnormal(key, device[key], threshold),
  )

  return hasAbnormal ? 'fault' : 'normal'
}

export function getMetricColor(
  key: MetricKey,
  value: number,
  defaultColor: string,
  warningColor: string,
  threshold = 80,
): string {
  if (key === 'waterLevel') {
    return defaultColor
  }

  if (key === 'filterLife') {
    return value < 20 ? '#CF6143' : defaultColor
  }

  return isMetricAbnormal(key, value, threshold) ? warningColor : defaultColor
}

export const deviceStatusMeta: Record<
  DeviceRunStatus,
  { label: string; background: string; color: string }
> = {
  normal: {
    label: '正常',
    background: 'rgba(97, 176, 96, 0.2)',
    color: '#61B060',
  },
  offline: {
    label: '离线',
    background: 'rgba(253, 199, 123, 0.2)',
    color: '#FDC77B',
  },
  fault: {
    label: '故障',
    background: 'rgba(215, 177, 96, 0.2)',
    color: '#D7B160',
  },
}
