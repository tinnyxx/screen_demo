import { useEffect, useMemo, useRef } from 'react'
import { formatDeviceNoLabel } from '@/config/deviceSlots'
import { useLiveCommunityMocks } from '@/hooks/useLiveCommunityMocks'
import { sortTaskReminderItems, taskStatusMeta } from '@/mock/taskReminder'
import styles from './TaskReminderPanel.module.scss'

const SCROLL_SPEED = 0.5

export function TaskReminderPanel() {
  const mocks = useLiveCommunityMocks()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const scrollRemainderRef = useRef(0)

  const items = mocks?.taskReminder.items ?? []
  const sortedItems = useMemo(() => sortTaskReminderItems(items), [items])
  const loopItems = useMemo(() => [...sortedItems, ...sortedItems], [sortedItems])

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
  }, [sortedItems.length])

  if (!mocks) return null

  return (
    <div className={styles.panel}>
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
        <ul className={styles.list} aria-label="运维任务列表">
          {loopItems.map((item, index) => {
            const statusMeta = taskStatusMeta[item.status]

            return (
              <li key={`${item.id}-${index}`} className={styles.listItem}>
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
                    {formatDeviceNoLabel(item.deviceNo)}·{item.event}
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
    </div>
  )
}
