import statusIcon from '@/assets/status-icon.png'
import { CardHeader } from '@/components/common/CardHeader/CardHeader'
import { EquipmentStatusPanel } from '@/components/equipment/EquipmentStatusPanel/EquipmentStatusPanel'
import { UsageStatusPanel } from '@/components/usage/UsageStatusPanel/UsageStatusPanel'
import { OperationStatusPanel } from '@/components/operation/OperationStatusPanel/OperationStatusPanel'
import styles from './LeftColumn.module.scss'

export function LeftColumn() {
  return (
    <aside className={styles.leftColumn} aria-label="左侧信息栏">
      <section className={styles.equipmentStatus}>
        <CardHeader
          icon={statusIcon}
          titleZh="设备状态"
          titleEn="EQUIPMENT STATUS"
        />
        <EquipmentStatusPanel />
      </section>

      <section className={styles.usageStatus}>
        <CardHeader
          icon={statusIcon}
          titleZh="实时使用情况"
          titleEn="FULL-PERIOD USAGE STATUS"
        />
        <UsageStatusPanel />
      </section>

      <section className={styles.operationStatus}>
        <CardHeader
          icon={statusIcon}
          titleZh="设备运行状态"
          titleEn="EQUIPMENT OPERATION STATUS"
        />
        <OperationStatusPanel />
      </section>
    </aside>
  )
}
