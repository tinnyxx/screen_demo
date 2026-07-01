import statusIcon from '@/assets/status-icon.png'
import taskIcon from '@/assets/task-icon.png'
import reportIcon from '@/assets/report-icon.png'
import { CardHeader } from '@/components/common/CardHeader/CardHeader'
import { CoreDataPanel } from '@/components/core/CoreDataPanel/CoreDataPanel'
import { TaskReminderPanel } from '@/components/task/TaskReminderPanel/TaskReminderPanel'
import { MonthlyReportPanel } from '@/components/report/MonthlyReportPanel/MonthlyReportPanel'
import styles from './RightColumn.module.scss'

export function RightColumn() {
  return (
    <aside className={styles.rightColumn} aria-label="右侧信息栏">
      <section className={styles.coreData}>
        <CardHeader
          icon={statusIcon}
          titleZh="核心数据展示"
          titleEn="CORE DATA PRESENTATION"
        />
        <CoreDataPanel />
      </section>

      <section className={styles.taskReminder}>
        <CardHeader icon={taskIcon} titleZh="运维任务提醒" titleEn="TASK REMINDER" />
        <TaskReminderPanel />
      </section>

      <section className={styles.monthlyReport}>
        <CardHeader
          icon={reportIcon}
          titleZh="上月数据报告"
          titleEn="LAST MONTH'S DATA REPORT"
        />
        <MonthlyReportPanel />
      </section>
    </aside>
  )
}
