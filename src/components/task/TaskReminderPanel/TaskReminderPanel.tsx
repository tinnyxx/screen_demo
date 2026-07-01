import { useMemo } from 'react'
import { sortTaskReminderItems, taskReminderMock, taskStatusMeta } from '@/mock/taskReminder'
import styles from './TaskReminderPanel.module.scss'

export function TaskReminderPanel() {
  const sortedItems = useMemo(
    () => sortTaskReminderItems(taskReminderMock.items),
    [],
  )

  return (
    <div className={styles.panel}>
      <ul className={styles.list} aria-label="运维任务列表">
        {sortedItems.map((item) => {
          const statusMeta = taskStatusMeta[item.status]

          return (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.row}>
                <span
                  className={styles.status}
                  style={{
                    color: statusMeta.color,
                    backgroundColor: statusMeta.background,
                  }}
                >
                  {statusMeta.label}
                </span>
                <span className={styles.eventText}>
                  {item.deviceNo}号设备·{item.event}
                </span>
                <time className={styles.time} dateTime={item.datetime}>
                  {item.datetime}
                </time>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
