import styles from './MetricProgress.module.scss'

interface MetricProgressProps {
  value: number
  color: string
}

export function MetricProgress({ value, color }: MetricProgressProps) {
  return (
    <div className={styles.metric}>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className={styles.percent} style={{ color }}>
        {value}%
      </span>
    </div>
  )
}
