import { useMemo } from 'react'
import baogaoNiaoyeIcon from '@/assets/baogao_niaoye.png'
import baogaoDakaIcon from '@/assets/baogao_daka.png'
import baogaoJieshuiIcon from '@/assets/baogao_jieshui.png'
import baogaoAnniuIcon from '@/assets/baogao_anniu.png'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import { useDashboardCheckinStats } from '@/hooks/useDashboardCheckinStats'
import {
  formatReportValue,
  getMonthlyReportCardItems,
  getReportDynamicTarget,
  getReportProgress,
  type MonthlyReportData,
  type MonthlyReportItem,
} from '@/mock/monthlyReport'
import { generateAndDownloadReportImage } from '@/utils/generateReportImage'
import styles from './MonthlyReportPanel.module.scss'

const itemIcons: Record<MonthlyReportItem['key'], string> = {
  urine: baogaoNiaoyeIcon,
  checkin: baogaoDakaIcon,
  'water-saving': baogaoJieshuiIcon,
}

function parseYearMonth(monthKey: string) {
  const [yearText, monthText] = monthKey.split('-')
  return {
    year: Number(yearText) || new Date().getFullYear(),
    month: Number(monthText) || 1,
  }
}

export function MonthlyReportPanel() {
  const mocks = useCommunityMocks()
  const stats = useDashboardCheckinStats()

  const monthlyReport = useMemo<MonthlyReportData | null>(() => {
    if (!mocks) return null

    const base = mocks.monthlyReport
    if (!stats) return base

    const { year, month } = parseYearMonth(stats.lastMonth)

    return {
      ...base,
      meta: {
        ...base.meta,
        year,
        month,
      },
      items: base.items.map((item) => {
        if (item.key === 'checkin') {
          return { ...item, current: stats.lastMonthTotal }
        }
        if (item.key === 'urine') {
          return { ...item, current: stats.lastMonthUrineLiters }
        }
        if (item.key === 'water-saving') {
          return { ...item, current: stats.lastMonthWaterSavingLiters }
        }
        return item
      }),
    }
  }, [mocks, stats])

  if (!monthlyReport) return null

  const { actionLabel } = monthlyReport
  const items = getMonthlyReportCardItems(monthlyReport)

  const handleDownloadReport = async () => {
    try {
      await generateAndDownloadReportImage(monthlyReport)
    } catch (error) {
      console.error('生成报告图片失败', error)
    }
  }

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {items.map((item) => {
          const dynamicTarget = getReportDynamicTarget(
            item.current,
            item.target,
            item.targetStep,
          )
          const progress = getReportProgress(item.current, dynamicTarget)
          const currentText = formatReportValue(item.current, item.unit, item.decimals)

          return (
            <li key={item.key} className={styles.item}>
              <div className={styles.metaRow}>
                <img
                  className={styles.itemIcon}
                  src={itemIcons[item.key]}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.progressText} style={{ color: item.color }}>
                  {currentText}
                </span>
              </div>

              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${progress}%`, backgroundColor: item.color }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <button type="button" className={styles.action} onClick={handleDownloadReport}>
        <img className={styles.actionIcon} src={baogaoAnniuIcon} alt="" aria-hidden="true" />
        <span className={styles.actionLabel}>{actionLabel}</span>
      </button>
    </div>
  )
}
