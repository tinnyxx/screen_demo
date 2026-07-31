import { useLiveCommunityMocks } from '@/hooks/useLiveCommunityMocks'
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
const OPERATION_DEVICE_NAMES = ['01号桩', '02号桩'] as const

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
  const mocks = useLiveCommunityMocks()

  const operationStatus = mocks?.operationStatus
  const columns = operationStatus?.columns ?? []
  const devices = operationStatus?.devices ?? []
  const metricColors = operationStatus?.metricColors
  const warningColor = operationStatus?.warningColor ?? ''
  const abnormalThreshold = operationStatus?.abnormalThreshold ?? 80

  const displayDevices = devices.slice(0, OPERATION_DEVICE_NAMES.length).map((device, index) => ({
    ...device,
    name: OPERATION_DEVICE_NAMES[index],
  }))

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
          <tbody>
            {displayDevices.map((device) => (
              <DeviceRow
                key={device.id}
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
  )
}
