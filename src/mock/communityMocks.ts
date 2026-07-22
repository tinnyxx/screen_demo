import type { CommunityId } from '@/config/communities'
import type { BottomStatItem } from '@/mock/bottomStats'
import type { CoreDataPanelData } from '@/mock/coreData'
import type { EquipmentStatusData } from '@/mock/equipmentStatus'
import type { OperationStatusData } from '@/mock/equipmentOperation'
import {
  operationMetricColors,
  operationWarningColor,
} from '@/mock/equipmentOperation'
import type { HeaderInfoData } from '@/mock/headerInfo'
import type { MapDevicesData } from '@/mock/mapDevices'
import type { MonthlyReportData } from '@/mock/monthlyReport'
import type { TaskReminderData } from '@/mock/taskReminder'
import type { UsageStatusData } from '@/mock/usageStatus'

export interface CommunityMockBundle {
  headerInfo: HeaderInfoData
  mapDevices: MapDevicesData
  monthlyReport: MonthlyReportData
  coreData: CoreDataPanelData
  bottomStats: BottomStatItem[]
  equipmentStatus: EquipmentStatusData
  operationStatus: OperationStatusData
  taskReminder: TaskReminderData
  usageStatus: UsageStatusData
}

const hours = Array.from({ length: 24 }, (_, index) => {
  return `${String(index).padStart(2, '0')}:00`
})

const lanwanMocks: CommunityMockBundle = {
  headerInfo: {
    weatherCity: '深圳',
    weather: {
      temperature: 28,
      description: '晴',
    },
    managerName: '蓝湾管理员',
  },
  mapDevices: {
    markers: [
      { id: '1', label: '1号设备', left: 32, top: 38, offsetX: 413, offsetY: 270 },
      { id: '2', label: '2号设备', left: 32, top: 38, offsetX: 183, offsetY: 270 },
    ],
  },
  monthlyReport: {
    meta: {
      year: 2026,
      month: 5,
      city: '深圳',
      communityName: '蓝湾小区',
    },
    items: [
      {
        key: 'urine',
        title: '上月累计处理尿液',
        current: 128.5,
        target: 200,
        targetStep: 50,
        unit: 'L',
        decimals: 1,
        color: '#DBFCFF',
      },
      {
        key: 'checkin',
        title: '上月累计打卡次数',
        current: 38,
        target: 50,
        targetStep: 50,
        unit: '次',
        decimals: 0,
        color: '#F9B38D',
      },
      {
        key: 'water-saving',
        title: '上月节水累计估算',
        current: 32.4,
        target: 50,
        targetStep: 50,
        unit: 'L',
        decimals: 1,
        color: '#93C5FD',
      },
      {
        key: 'bag-refill',
        title: '上月拾便袋补给',
        current: 16,
        target: 20,
        targetStep: 50,
        unit: '次',
        decimals: 0,
        color: '#FFB4AB',
      },
    ],
    footerLines: [
      '每一次文明遛宠都会让小区环境更干净一点、',
      '草坪更健康一些。',
      '让我们一起把宠物友好社区，变成日常生活的一部分。',
    ],
    actionLabel: '查看报告',
  },
  coreData: {
    columns: [
      {
        key: 'checkin',
        title: '今日打卡次数',
        value: '86',
        unit: '次',
        comparePercent: 12.5,
        trend: 'up',
      },
      {
        key: 'urine',
        title: '今日处理尿液',
        value: '28.6',
        unit: 'L',
        comparePercent: 8.3,
        trend: 'down',
      },
      {
        key: 'water-saving',
        title: '今日节水估算',
        value: '45.2',
        unit: 'L',
        comparePercent: 5.1,
        trend: 'down',
      },
    ],
  },
  bottomStats: [
    {
      key: 'usage-count',
      label: '累计使用次数',
      value: '1286',
      unit: '次',
    },
    {
      key: 'processed-urine',
      label: '累计处理尿液',
      value: '356.8',
      unit: 'L',
    },
    {
      key: 'water-saving',
      label: '累计节水估算',
      value: '892.5',
      unit: 'L',
    },
    {
      key: 'pending-events',
      label: '待处理事件',
      value: '3',
      unit: '项',
      valueColor: '#FFB4AB',
    },
  ],
  equipmentStatus: {
    runningLabel: '运行设备',
    runningCount: 5,
    legend: [
      {
        key: 'online',
        label: '在线',
        color: '#4FF0DD',
        gradientFrom: '#9DE0F5',
        gradientTo: '#4FF0DD',
        count: 5,
      },
      {
        key: 'offline',
        label: '离线',
        color: '#ECB12F',
        gradientFrom: '#FEEB9F',
        gradientTo: '#ECB12F',
        count: 1,
      },
      {
        key: 'fault',
        label: '故障',
        color: '#FF998D',
        gradientFrom: '#FCA097',
        gradientTo: '#E5614A',
        count: 1,
      },
    ],
  },
  operationStatus: {
    updateTime: '2026.06.24',
    abnormalThreshold: 80,
    warningColor: operationWarningColor,
    metricColors: operationMetricColors,
    columns: ['设备名称', '状态', '今日使用', '土壤湿度情况', '滤芯寿命', '粪便盒状态'],
    devices: [
      {
        id: '1',
        name: '1号桩',
        isOffline: false,
        todayUsage: 12,
        waterLevel: 56,
        filterLife: 72,
        fecesBox: 35,
      },
      {
        id: '2',
        name: '2号桩',
        isOffline: true,
        todayUsage: 0,
        waterLevel: 48,
        filterLife: 65,
        fecesBox: 20,
      },
      {
        id: '3',
        name: '3号桩',
        isOffline: false,
        todayUsage: 9,
        waterLevel: 62,
        filterLife: 58,
        fecesBox: 83,
      },
      {
        id: '4',
        name: '4号桩',
        isOffline: false,
        todayUsage: 15,
        waterLevel: 44,
        filterLife: 18,
        fecesBox: 42,
      },
      {
        id: '5',
        name: '5号桩',
        isOffline: false,
        todayUsage: 7,
        waterLevel: 86,
        filterLife: 61,
        fecesBox: 51,
      },
      {
        id: '6',
        name: '6号桩',
        isOffline: false,
        todayUsage: 11,
        waterLevel: 53,
        filterLife: 76,
        fecesBox: 28,
      },
    ],
  },
  taskReminder: {
    items: [
      {
        id: '1',
        status: 'pending',
        deviceNo: 1,
        event: '粪便盒待清理',
        datetime: '06/24 08:12',
      },
      {
        id: '2',
        status: 'notice',
        deviceNo: 3,
        event: '滤芯即将到期需更换',
        datetime: '06/24 09:45',
      },
      {
        id: '3',
        status: 'done',
        deviceNo: 2,
        event: '已接入运行',
        datetime: '06/24 10:20',
      },
      {
        id: '4',
        status: 'pending',
        deviceNo: 5,
        event: '水箱液位异常',
        datetime: '06/24 11:06',
      },
      {
        id: '5',
        status: 'notice',
        deviceNo: 4,
        event: '粪便盒待清理',
        datetime: '06/24 13:18',
      },
      {
        id: '6',
        status: 'done',
        deviceNo: 6,
        event: '已接入运行',
        datetime: '06/24 14:02',
      },
      {
        id: '7',
        status: 'pending',
        deviceNo: 3,
        event: '滤芯即将到期需更换',
        datetime: '06/24 15:30',
      },
    ],
  },
  usageStatus: {
    times: hours,
    yAxisLabels: [0, 5, 10, 15, 20],
    series: [
      {
        key: 'yesterday',
        name: '昨日',
        color: '#F5AAFF',
        areaColor: 'rgba(245, 170, 255, 0.22)',
        data: [3, 2, 1, 0, 1, 4, 8, 12, 15, 18, 16, 14, 13, 11, 9, 10, 12, 14, 16, 13, 10, 7, 5, 4],
      },
      {
        key: 'today',
        name: '今日',
        color: '#00F0FF',
        areaColor: 'rgba(0, 240, 255, 0.22)',
        data: [2, 1, 0, 2, 5, 9, 13, 17, 19, 20, 18, 15, 14, 12, 11, 13, 15, 17, 16, 12, 8, 6, 4, 3],
      },
    ],
  },
}

const huarunMocks: CommunityMockBundle = {
  headerInfo: {
    weatherCity: '深圳',
    weather: {
      temperature: 27,
      description: '多云',
    },
    managerName: '华润管理员',
  },
  mapDevices: {
    markers: [
      { id: '1', label: '1号设备', left: 50, top: 48, offsetX: -80, offsetY: 40 },
      { id: '2', label: '2号设备', left: 50, top: 48, offsetX: 120, offsetY: 90 },
      { id: '3', label: '3号设备', left: 50, top: 48, offsetX: 40, offsetY: -30 },
    ],
  },
  monthlyReport: {
    meta: {
      year: 2026,
      month: 5,
      city: '深圳',
      communityName: '华润小区',
    },
    items: [
      {
        key: 'urine',
        title: '上月累计处理尿液',
        current: 96.2,
        target: 200,
        targetStep: 50,
        unit: 'L',
        decimals: 1,
        color: '#DBFCFF',
      },
      {
        key: 'checkin',
        title: '上月累计打卡次数',
        current: 52,
        target: 50,
        targetStep: 50,
        unit: '次',
        decimals: 0,
        color: '#F9B38D',
      },
      {
        key: 'water-saving',
        title: '上月节水累计估算',
        current: 41.8,
        target: 50,
        targetStep: 50,
        unit: 'L',
        decimals: 1,
        color: '#93C5FD',
      },
      {
        key: 'bag-refill',
        title: '上月拾便袋补给',
        current: 21,
        target: 20,
        targetStep: 50,
        unit: '次',
        decimals: 0,
        color: '#FFB4AB',
      },
    ],
    footerLines: [
      '每一次文明遛宠都会让小区环境更干净一点、',
      '草坪更健康一些。',
      '让我们一起把宠物友好社区，变成日常生活的一部分。',
    ],
    actionLabel: '查看报告',
  },
  coreData: {
    columns: [
      {
        key: 'checkin',
        title: '今日打卡次数',
        value: '64',
        unit: '次',
        comparePercent: 9.2,
        trend: 'up',
      },
      {
        key: 'urine',
        title: '今日处理尿液',
        value: '21.4',
        unit: 'L',
        comparePercent: 4.6,
        trend: 'down',
      },
      {
        key: 'water-saving',
        title: '今日节水估算',
        value: '33.7',
        unit: 'L',
        comparePercent: 6.8,
        trend: 'up',
      },
    ],
  },
  bottomStats: [
    {
      key: 'usage-count',
      label: '累计使用次数',
      value: '972',
      unit: '次',
    },
    {
      key: 'processed-urine',
      label: '累计处理尿液',
      value: '268.3',
      unit: 'L',
    },
    {
      key: 'water-saving',
      label: '累计节水估算',
      value: '654.1',
      unit: 'L',
    },
    {
      key: 'pending-events',
      label: '待处理事件',
      value: '2',
      unit: '项',
      valueColor: '#FFB4AB',
    },
  ],
  equipmentStatus: {
    runningLabel: '运行设备',
    runningCount: 3,
    legend: [
      {
        key: 'online',
        label: '在线',
        color: '#4FF0DD',
        gradientFrom: '#9DE0F5',
        gradientTo: '#4FF0DD',
        count: 3,
      },
      {
        key: 'offline',
        label: '离线',
        color: '#ECB12F',
        gradientFrom: '#FEEB9F',
        gradientTo: '#ECB12F',
        count: 1,
      },
      {
        key: 'fault',
        label: '故障',
        color: '#FF998D',
        gradientFrom: '#FCA097',
        gradientTo: '#E5614A',
        count: 0,
      },
    ],
  },
  operationStatus: {
    updateTime: '2026.06.24',
    abnormalThreshold: 80,
    warningColor: operationWarningColor,
    metricColors: operationMetricColors,
    columns: ['设备名称', '状态', '今日使用', '土壤湿度情况', '滤芯寿命', '粪便盒状态'],
    devices: [
      {
        id: '1',
        name: '1号桩',
        isOffline: false,
        todayUsage: 10,
        waterLevel: 61,
        filterLife: 68,
        fecesBox: 42,
      },
      {
        id: '2',
        name: '2号桩',
        isOffline: false,
        todayUsage: 8,
        waterLevel: 54,
        filterLife: 45,
        fecesBox: 67,
      },
      {
        id: '3',
        name: '3号桩',
        isOffline: true,
        todayUsage: 0,
        waterLevel: 39,
        filterLife: 82,
        fecesBox: 18,
      },
      {
        id: '4',
        name: '4号桩',
        isOffline: false,
        todayUsage: 14,
        waterLevel: 73,
        filterLife: 22,
        fecesBox: 55,
      },
    ],
  },
  taskReminder: {
    items: [
      {
        id: '1',
        status: 'pending',
        deviceNo: 2,
        event: '粪便盒待清理',
        datetime: '06/24 07:48',
      },
      {
        id: '2',
        status: 'notice',
        deviceNo: 4,
        event: '滤芯即将到期需更换',
        datetime: '06/24 09:15',
      },
      {
        id: '3',
        status: 'done',
        deviceNo: 1,
        event: '已接入运行',
        datetime: '06/24 10:05',
      },
      {
        id: '4',
        status: 'pending',
        deviceNo: 3,
        event: '设备离线待检查',
        datetime: '06/24 11:32',
      },
      {
        id: '5',
        status: 'notice',
        deviceNo: 1,
        event: '水箱液位偏低',
        datetime: '06/24 14:20',
      },
    ],
  },
  usageStatus: {
    times: hours,
    yAxisLabels: [0, 5, 10, 15, 20],
    series: [
      {
        key: 'yesterday',
        name: '昨日',
        color: '#F5AAFF',
        areaColor: 'rgba(245, 170, 255, 0.22)',
        data: [2, 1, 0, 1, 2, 5, 7, 10, 13, 15, 14, 12, 11, 9, 8, 9, 11, 12, 14, 11, 8, 6, 4, 3],
      },
      {
        key: 'today',
        name: '今日',
        color: '#00F0FF',
        areaColor: 'rgba(0, 240, 255, 0.22)',
        data: [1, 0, 1, 2, 4, 7, 11, 14, 16, 17, 15, 13, 12, 10, 9, 11, 13, 14, 13, 10, 7, 5, 3, 2],
      },
    ],
  },
}

export const communityMocks: Record<CommunityId, CommunityMockBundle> = {
  lanwan: lanwanMocks,
  huarun: huarunMocks,
}
