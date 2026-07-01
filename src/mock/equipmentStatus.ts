export interface EquipmentStatusLegendItem {
  key: 'online' | 'offline' | 'fault'
  label: string
  /** 图例标识颜色 */
  color: string
  /** 圆环渐变起始色（逆时针） */
  gradientFrom: string
  /** 圆环渐变结束色（逆时针） */
  gradientTo: string
  count: number
}

export interface EquipmentStatusData {
  runningLabel: string
  runningCount: number
  legend: EquipmentStatusLegendItem[]
}

export const equipmentStatusMock: EquipmentStatusData = {
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
}

export const equipmentRingOuterBg = 'rgba(0, 40, 70, 0.45)'
export const equipmentRingInnerBg = 'rgba(0, 240, 255, 0.12)'
