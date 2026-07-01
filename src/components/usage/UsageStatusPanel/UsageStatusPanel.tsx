import { usageStatusMock } from '@/mock/usageStatus'
import { UsageStatusChart } from './UsageStatusChart'
import styles from './UsageStatusPanel.module.scss'

export function UsageStatusPanel() {
  return (
    <div className={styles.panel}>
      <UsageStatusChart data={usageStatusMock} />
    </div>
  )
}
