import { useMemo } from 'react'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import { useDashboardCheckinStats } from '@/hooks/useDashboardCheckinStats'
import type { UsageStatusData } from '@/mock/usageStatus'
import { UsageStatusChart } from './UsageStatusChart'
import styles from './UsageStatusPanel.module.scss'

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => {
  return `${String(hour).padStart(2, '0')}:00`
})

function toSeriesData(
  hourly: { hour: number; count: number }[] | undefined,
): number[] {
  const byHour = new Map((hourly ?? []).map((item) => [item.hour, item.count]))
  return Array.from({ length: 24 }, (_, hour) => byHour.get(hour) ?? 0)
}

export function UsageStatusPanel() {
  const mocks = useCommunityMocks()
  const stats = useDashboardCheckinStats()

  const data = useMemo<UsageStatusData | null>(() => {
    if (!mocks) return null

    if (!stats) return mocks.usageStatus

    const yesterdayData = toSeriesData(stats.yesterdayHourly)
    const todayData = toSeriesData(stats.todayHourly)
    const peak = Math.max(1, ...yesterdayData, ...todayData)
    const step = Math.max(1, Math.ceil(peak / 4))
    const yMax = step * 4

    return {
      times: HOUR_LABELS,
      yAxisLabels: [0, step, step * 2, step * 3, yMax],
      series: [
        {
          key: 'yesterday',
          name: '昨日',
          color: '#F5AAFF',
          areaColor: 'rgba(245, 170, 255, 0.22)',
          data: yesterdayData,
        },
        {
          key: 'today',
          name: '今日',
          color: '#00F0FF',
          areaColor: 'rgba(0, 240, 255, 0.22)',
          data: todayData,
        },
      ],
    }
  }, [mocks, stats])

  if (!data) return null

  return (
    <div className={styles.panel}>
      <UsageStatusChart data={data} />
    </div>
  )
}
