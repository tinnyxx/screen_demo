export type MonthlyReportItemKey = 'urine' | 'checkin' | 'water-saving' | 'bag-refill'

export interface MonthlyReportMeta {
  year: number
  month: number
  city: string
  communityName: string
}

export interface MonthlyReportItem {
  key: MonthlyReportItemKey
  title: string
  current: number
  target: number
  targetStep: number
  unit: string
  decimals: number
  color: string
}

export interface MonthlyReportImageSection {
  itemKey: MonthlyReportItemKey
  label: string
}

export interface MonthlyReportData {
  meta: MonthlyReportMeta
  items: MonthlyReportItem[]
  footerLines: string[]
  actionLabel: string
}

export const monthlyReportImageSections: MonthlyReportImageSection[] = [
  { itemKey: 'urine', label: '宠物尿液处理' },
  { itemKey: 'checkin', label: '文明养宠使用记录' },
  { itemKey: 'water-saving', label: '预计节水量' },
  { itemKey: 'bag-refill', label: '拾便袋补给' },
]

export const monthlyReportCardItemKeys: MonthlyReportItemKey[] = [
  'urine',
  'checkin',
  'water-saving',
]

export const monthlyReportMock: MonthlyReportData = {
  meta: {
    year: 2026,
    month: 5,
    city: '深圳',
    communityName: '广兴源 · 蓝湾',
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
}

export function formatReportSubtitle(meta: MonthlyReportMeta) {
  const monthText = String(meta.month).padStart(2, '0')
  return `${meta.year}年${monthText}月 | ${meta.city} ${meta.communityName}`
}

export function getMonthlyReportItem(data: MonthlyReportData, key: MonthlyReportItemKey) {
  return data.items.find((item) => item.key === key)
}

export function getMonthlyReportCardItems(data: MonthlyReportData) {
  return monthlyReportCardItemKeys
    .map((key) => getMonthlyReportItem(data, key))
    .filter((item): item is MonthlyReportItem => item !== undefined)
}

export function formatReportNumber(value: number, decimals: number) {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
}

export function formatReportValue(value: number, unit: string, decimals: number) {
  const formatted = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
  return `${formatted}${unit}`
}

export function getReportDynamicTarget(
  current: number,
  baseTarget: number,
  targetStep: number,
) {
  let max = baseTarget

  while (current > max) {
    max += targetStep
  }

  return max
}

export function getReportProgress(current: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}
