import { useMemo } from 'react'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import { useDashboardCheckinStats } from '@/hooks/useDashboardCheckinStats'
import { compareTrendMeta, type CoreDataColumn } from '@/mock/coreData'
import styles from './CoreDataPanel.module.scss'

export function CoreDataPanel() {
  const mocks = useCommunityMocks()
  const stats = useDashboardCheckinStats()

  const columns = useMemo<CoreDataColumn[] | null>(() => {
    if (!mocks) return null

    return mocks.coreData.columns.map((column) => {
      if (!stats) return column

      if (column.key === 'checkin') {
        return {
          ...column,
          value: String(stats.todayTotal),
          comparePercent: stats.comparePercent,
          trend: stats.trend,
        }
      }

      if (column.key === 'urine') {
        return {
          ...column,
          value: stats.todayUrineLiters.toFixed(2),
          comparePercent: stats.urineComparePercent,
          trend: stats.urineTrend,
        }
      }

      if (column.key === 'water-saving') {
        return {
          ...column,
          value: stats.todayWaterSavingLiters.toFixed(2),
          comparePercent: stats.waterSavingComparePercent,
          trend: stats.waterSavingTrend,
        }
      }

      return column
    })
  }, [mocks, stats])

  if (!columns) return null

  return (
    <div className={styles.panel}>
      <div className={styles.columns}>
        {columns.map((column, index) => {
          const trendMeta = compareTrendMeta[column.trend]

          return (
            <article
              key={column.key}
              className={styles.column}
              style={{ left: `${index * 33.333}%` }}
            >
              <header className={styles.columnHeader}>
                <span className={styles.decorMark}>|</span>
                <span className={styles.columnTitle}>{column.title}</span>
              </header>

              <p className={styles.valueRow}>
                <span className={styles.value}>{column.value}</span>
                <span className={styles.unit}>{column.unit}</span>
              </p>

              <p className={styles.compare} style={{ color: trendMeta.color }}>
                {trendMeta.symbol}
                {column.comparePercent.toFixed(1)}%
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
