import { compareTrendMeta, coreDataMock } from '@/mock/coreData'
import styles from './CoreDataPanel.module.scss'

export function CoreDataPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.columns}>
        {coreDataMock.columns.map((column, index) => {
          const trendMeta = compareTrendMeta[column.trend]

          return (
            <article
              key={column.key}
              className={styles.column}
              style={{ left: `${index * 33.333}%` }}
            >
              <header className={styles.columnHeader}>
                <span className={styles.decorMark}>|</span>
                <span className={styles.columnTitle}>{column.title}</span>
              </header>

              <p className={styles.valueRow}>
                <span className={styles.value}>{column.value}</span>
                <span className={styles.unit}>{column.unit}</span>
              </p>

              <p className={styles.compare} style={{ color: trendMeta.color }}>
                {trendMeta.symbol}
                {column.comparePercent.toFixed(1)}%
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
