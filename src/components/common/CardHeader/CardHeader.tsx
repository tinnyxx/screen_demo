import styles from './CardHeader.module.scss'

interface CardHeaderProps {
  icon: string
  titleZh: string
  titleEn: string
}

export function CardHeader({ icon, titleZh, titleEn }: CardHeaderProps) {
  return (
    <header className={styles.header}>
      <img className={styles.icon} src={icon} alt="" aria-hidden="true" />
      <h2 className={styles.title}>
        <span className={styles.titleZh}>{titleZh}</span>
        <span className={styles.separator}> / </span>
        <span className={styles.titleEn}>{titleEn}</span>
      </h2>
    </header>
  )
}
