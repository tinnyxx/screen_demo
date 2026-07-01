import backgroundImg from '@/assets/background.png'
import styles from './MapBackground.module.scss'

export function MapBackground() {
  return (
    <main className={styles.mapBackground} aria-label="园区鸟瞰地图背景">
      <img
        className={styles.mapImage}
        src={backgroundImg}
        alt=""
        aria-hidden="true"
      />
    </main>
  )
}
