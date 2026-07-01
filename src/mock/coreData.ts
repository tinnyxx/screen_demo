export type CompareTrend = 'up' | 'down'

export interface CoreDataColumn {
  key: 'checkin' | 'urine' | 'water-saving'
  title: string
  value: string
  unit: string
  comparePercent: number
  trend: CompareTrend
}

export interface CoreDataPanelData {
  columns: CoreDataColumn[]
}

export const coreDataMock: CoreDataPanelData = {
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
}

export const compareTrendMeta: Record<
  CompareTrend,
  { symbol: string; color: string }
> = {
  down: { symbol: '↓', color: '#4ADE80' },
  up: { symbol: '↑', color: '#D88634' },
}
