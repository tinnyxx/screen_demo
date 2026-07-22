import bUseIcon from '@/assets/b-use-icon.png'
import bPeeIcon from '@/assets/b-pee-icon.png'
import bDealIcon from '@/assets/b-deal-icon.png'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import styles from './BottomStats.module.scss'

const iconMap = {
  'usage-count': bUseIcon,
  'processed-urine': bPeeIcon,
  'water-saving': bPeeIcon,
  'pending-events': bDealIcon,
} as const

export function BottomStats() {
  const mocks = useCommunityMocks()
  if (!mocks) return null

  return (
    <section className={styles.bottomStats} aria-label="底部数据统计浮层">
      {mocks.bottomStats.map((item) => (
        <article key={item.key} className={styles.statCard} aria-label={item.label}>
          <header className={styles.statHeader}>
            <span className={styles.statTitle}>{item.label}</span>
            <img className={styles.statIcon} src={iconMap[item.key]} alt="" aria-hidden="true" />
          </header>

          <p className={styles.statBody}>
            <span
              className={styles.statValue}
              style={item.valueColor ? { color: item.valueColor } : undefined}
            >
              {item.value}
            </span>
            <span className={styles.statUnit}>{item.unit}</span>
          </p>
        </article>
      ))}
    </section>
  )
}
