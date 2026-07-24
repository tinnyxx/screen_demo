import axios from 'axios'
import type { CommunityMockBundle } from '@/mock/communityMocks'
import type { DeviceOperationRow } from '@/mock/equipmentOperation'

const DEVICE_STATUS_API_URL = '/api/devices/status'

export type DeviceStatusKey = 'online' | 'offline' | 'inactive' | 'unknown'

export interface DeviceStatusItem {
  did: number | string
  name: string
  status: number
  statusKey: DeviceStatusKey
  lastTime: string | null
}

export interface DeviceStatusSummary {
  total: number
  online: number
  offline: number
  inactive: number
}

export interface DeviceStatusResponse {
  productId: string
  devices: DeviceStatusItem[]
  summary: DeviceStatusSummary
}

export async function fetchDeviceStatuses(): Promise<DeviceStatusResponse> {
  const { data } = await axios.get<DeviceStatusResponse>(DEVICE_STATUS_API_URL, {
    timeout: 15000,
  })
  return data
}

function buildOperationDevices(
  apiDevices: DeviceStatusItem[],
  mockDevices: DeviceOperationRow[],
): DeviceOperationRow[] {
  return apiDevices.map((apiDevice, index) => {
    const mockDevice = mockDevices[index]

    return {
      id: String(apiDevice.did ?? mockDevice?.id ?? index + 1),
      name: mockDevice?.name ?? apiDevice.name,
      isOffline: apiDevice.status !== 1,
      todayUsage: mockDevice?.todayUsage ?? 0,
      waterLevel: mockDevice?.waterLevel ?? 0,
      filterLife: mockDevice?.filterLife ?? 0,
      fecesBox: mockDevice?.fecesBox ?? 0,
    }
  })
}

/** 用 OneNET 在线状态覆盖 mock 中的设备在线相关数据；故障数仍保留 mock */
export function applyDeviceOnlineStatus(
  bundle: CommunityMockBundle,
  statusData: DeviceStatusResponse,
): CommunityMockBundle {
  const onlineCount = statusData.summary.online
  const offlineCount = statusData.summary.offline + statusData.summary.inactive

  return {
    ...bundle,
    equipmentStatus: {
      ...bundle.equipmentStatus,
      runningCount: onlineCount,
      legend: bundle.equipmentStatus.legend.map((item) => {
        if (item.key === 'online') return { ...item, count: onlineCount }
        if (item.key === 'offline') return { ...item, count: offlineCount }
        return item
      }),
    },
    operationStatus: {
      ...bundle.operationStatus,
      devices: buildOperationDevices(statusData.devices, bundle.operationStatus.devices),
    },
  }
}
