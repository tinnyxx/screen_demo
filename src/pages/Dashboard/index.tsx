import { MapBackground } from '@/components/layout/MapBackground/MapBackground'
import { Header } from '@/components/layout/Header/Header'
import { LeftColumn } from '@/components/layout/LeftColumn/LeftColumn'
import { RightColumn } from '@/components/layout/RightColumn/RightColumn'
import { BottomStats } from '@/components/layout/BottomStats/BottomStats'
import { MapDeviceMarkers } from '@/components/map/MapDeviceMarkers/MapDeviceMarkers'
import styles from './Dashboard.module.scss'

export function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <MapBackground />

      <div className={styles.overlay}>
        <Header />
        <LeftColumn />
        <MapDeviceMarkers />
        <RightColumn />
        <BottomStats />
      </div>
    </div>
  )
}

export default Dashboard
