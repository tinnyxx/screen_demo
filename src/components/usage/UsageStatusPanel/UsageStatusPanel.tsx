import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import { UsageStatusChart } from './UsageStatusChart'
import styles from './UsageStatusPanel.module.scss'

export function UsageStatusPanel() {
  const mocks = useCommunityMocks()
  if (!mocks) return null

  return (
    <div className={styles.panel}>
      <UsageStatusChart data={mocks.usageStatus} />
    </div>
  )
}
