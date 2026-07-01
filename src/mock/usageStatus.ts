export interface UsageSeriesConfig {
  key: 'yesterday' | 'today'
  name: string
  color: string
  areaColor: string
  data: number[]
}

export interface UsageStatusData {
  /** 24 小时时间点，格式 HH:mm */
  times: string[]
  yAxisLabels: number[]
  series: UsageSeriesConfig[]
}

const hours = Array.from({ length: 24 }, (_, index) => {
  return `${String(index).padStart(2, '0')}:00`
})

export const usageStatusMock: UsageStatusData = {
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
}
