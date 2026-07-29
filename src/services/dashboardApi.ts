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
