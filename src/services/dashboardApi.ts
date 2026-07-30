import axios from 'axios'

const CHECKIN_STATS_URL = '/api/dashboard/checkin-stats'

export interface HourlyCount {
  hour: number
  count: number
}

export interface DashboardCheckinStats {
  communityId: string | null
  today: string
  yesterday: string
  todayHourly: HourlyCount[]
  yesterdayHourly: HourlyCount[]
  todayTotal: number
  yesterdayTotal: number
  comparePercent: number
  trend: 'up' | 'down'
  lastMonth: string
  lastMonthTotal: number
  /** 当前小区全部成功打卡次数（底部「累计使用次数」） */
  totalCheckins: number
  /** 尿液按打卡次数 × 0.08L 推算 */
  todayUrineLiters: number
  yesterdayUrineLiters: number
  lastMonthUrineLiters: number
  urineComparePercent: number
  urineTrend: 'up' | 'down'
  /** 节水按 waterout 累计值的区间差值 */
  todayWaterSavingLiters: number
  yesterdayWaterSavingLiters: number
  lastMonthWaterSavingLiters: number
  waterSavingComparePercent: number
  waterSavingTrend: 'up' | 'down'
  deviceCount?: number | null
}

export async function fetchDashboardCheckinStats(
  communityId: string,
): Promise<DashboardCheckinStats> {
  const { data } = await axios.get<DashboardCheckinStats>(CHECKIN_STATS_URL, {
    params: { communityId },
    timeout: 15000,
  })
  return data
}
