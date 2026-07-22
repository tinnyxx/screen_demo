import { useActiveCommunity } from '@/hooks/useActiveCommunity'
import styles from './MapBackground.module.scss'

export function MapBackground() {
  const community = useActiveCommunity()
  if (!community) return null

  return (
    <main className={styles.mapBackground} aria-label="园区鸟瞰地图背景">
      <img
        className={styles.mapImage}
        src={community.background}
        alt=""
        aria-hidden="true"
        style={{ transform: `scale(${community.backgroundScale})` }}
      />
    </main>
  )
}
