export interface BottomStatItem {
  key: 'usage-count' | 'processed-urine' | 'water-saving' | 'pending-events'
  label: string
  value: string
  unit: string
  valueColor?: string
}

export const bottomStatsMock: BottomStatItem[] = [
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
]
