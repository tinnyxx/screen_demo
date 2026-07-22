import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import locationIcon from '@/assets/location_icon.png'
import styles from './MapDeviceMarkers.module.scss'

export function MapDeviceMarkers() {
  const mocks = useCommunityMocks()
  if (!mocks) return null

  return (
    <div className={styles.centerArea} aria-label="中心区域设备分布">
      {mocks.mapDevices.markers.map((marker, index) => (
        <div
          key={marker.id}
          className={styles.marker}
          style={{
            left: `${marker.left}%`,
            top: `${marker.top}%`,
            transform: `translate(calc(-50% + ${marker.offsetX}px), calc(-100% + ${marker.offsetY}px))`,
            ['--pulse-delay' as string]: `${index * 0.5}s`,
          }}
        >
          <span className={styles.label}>{marker.label}</span>
          <div className={styles.iconWrap}>
            <span className={styles.glow} aria-hidden="true" />
            <img className={styles.icon} src={locationIcon} alt="" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  )
}
