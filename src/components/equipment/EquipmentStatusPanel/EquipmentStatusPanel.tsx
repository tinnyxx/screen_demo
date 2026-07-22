import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import { EquipmentStatusChart } from './EquipmentStatusChart'
import styles from './EquipmentStatusPanel.module.scss'

export function EquipmentStatusPanel() {
  const mocks = useCommunityMocks()
  if (!mocks) return null

  const { runningLabel, runningCount, legend } = mocks.equipmentStatus

  return (
    <div className={styles.panel}>
      <div className={styles.chartArea}>
        <div className={styles.ringCard}>
          <EquipmentStatusChart legend={legend} />
          <div className={styles.centerCard}>
            <span className={styles.centerLabel}>{runningLabel}</span>
            <span className={styles.centerValue}>{runningCount}</span>
          </div>
        </div>
      </div>

      <ul className={styles.legend} aria-label="设备状态图例">
        {legend.map((item) => (
          <li key={item.key} className={styles.legendItem}>
            <span className={styles.legendMark} style={{ color: item.color }}>
              |
            </span>
            <span className={styles.legendLabel}>{item.label}</span>
            <span className={styles.legendCount}>{item.count}台</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
