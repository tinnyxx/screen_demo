import { useEffect, useRef } from 'react'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import {
  getMetricColor,
  resolveDeviceStatus,
  deviceStatusMeta,
  type DeviceOperationRow,
  type MetricKey,
  type OperationStatusData,
} from '@/mock/equipmentOperation'
import { MetricProgress } from './MetricProgress'
import styles from './OperationStatusPanel.module.scss'

const metricKeys: MetricKey[] = ['waterLevel', 'filterLife', 'fecesBox']
const SCROLL_SPEED = 0.5

function DeviceRow({
  device,
  metricColors,
  warningColor,
  abnormalThreshold,
}: {
  device: DeviceOperationRow
  metricColors: OperationStatusData['metricColors']
  warningColor: string
  abnormalThreshold: number
}) {
  const status = resolveDeviceStatus(device, abnormalThreshold)

  return (
    <tr>
      <td>{device.name}</td>
      <td>
        <span
          className={styles.statusBadge}
          style={{
            backgroundColor: deviceStatusMeta[status].background,
            color: deviceStatusMeta[status].color,
          }}
        >
          {deviceStatusMeta[status].label}
        </span>
      </td>
      <td>{device.todayUsage}次</td>
      {metricKeys.map((key) => {
        const value = device[key]
        const color = getMetricColor(
          key,
          value,
          metricColors[key],
          warningColor,
          abnormalThreshold,
        )

        return (
          <td key={key}>
            <MetricProgress value={value} color={color} />
          </td>
        )
      })}
    </tr>
  )
}

export function OperationStatusPanel() {
  const mocks = useCommunityMocks()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const scrollRemainderRef = useRef(0)

  const operationStatus = mocks?.operationStatus
  const columns = operationStatus?.columns ?? []
  const devices = operationStatus?.devices ?? []
  const metricColors = operationStatus?.metricColors
  const warningColor = operationStatus?.warningColor ?? ''
  const abnormalThreshold = operationStatus?.abnormalThreshold ?? 80
  const loopDevices = [...devices, ...devices]

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationId = 0

    const step = () => {
      const loopHeight = container.scrollHeight / 2

      if (!pausedRef.current && loopHeight > container.clientHeight) {
        scrollRemainderRef.current += SCROLL_SPEED
        const delta = Math.floor(scrollRemainderRef.current)

        if (delta > 0) {
          scrollRemainderRef.current -= delta
          let nextScrollTop = container.scrollTop + delta

          if (nextScrollTop >= loopHeight) {
            nextScrollTop -= loopHeight
          }

          container.scrollTop = nextScrollTop
        }
      }

      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [devices.length])

  if (!operationStatus || !metricColors) return null

  return (
    <div className={styles.panel}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        <div
          ref={scrollRef}
          className={styles.scrollBody}
          onMouseEnter={() => {
            pausedRef.current = true
          }}
          onMouseLeave={() => {
            pausedRef.current = false
          }}
        >
          <table className={styles.table}>
            <tbody>
              {loopDevices.map((device, index) => (
                <DeviceRow
                  key={`${device.id}-${index}`}
                  device={device}
                  metricColors={metricColors}
                  warningColor={warningColor}
                  abnormalThreshold={abnormalThreshold}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
