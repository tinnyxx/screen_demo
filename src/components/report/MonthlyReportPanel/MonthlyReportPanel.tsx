import baogaoNiaoyeIcon from '@/assets/baogao_niaoye.png'
import baogaoDakaIcon from '@/assets/baogao_daka.png'
import baogaoJieshuiIcon from '@/assets/baogao_jieshui.png'
import baogaoAnniuIcon from '@/assets/baogao_anniu.png'
import {
  formatReportValue,
  getMonthlyReportCardItems,
  getReportDynamicTarget,
  getReportProgress,
  monthlyReportMock,
  type MonthlyReportItem,
} from '@/mock/monthlyReport'
import { generateAndDownloadReportImage } from '@/utils/generateReportImage'
import styles from './MonthlyReportPanel.module.scss'

const itemIcons: Record<MonthlyReportItem['key'], string> = {
  urine: baogaoNiaoyeIcon,
  checkin: baogaoDakaIcon,
  'water-saving': baogaoJieshuiIcon,
}

export function MonthlyReportPanel() {
  const { actionLabel } = monthlyReportMock
  const items = getMonthlyReportCardItems(monthlyReportMock)

  const handleDownloadReport = async () => {
    try {
      await generateAndDownloadReportImage()
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
