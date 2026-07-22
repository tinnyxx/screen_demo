import headTabImg from '@/assets/head-tab.png'
import locationIcon from '@/assets/location.png'
import { useActiveCommunity } from '@/hooks/useActiveCommunity'
import { HeaderRightBar } from './HeaderRightBar'
import styles from './Header.module.scss'

export function Header() {
  const community = useActiveCommunity()

  return (
    <header
      className={styles.header}
      style={{ backgroundImage: `url(${headTabImg})` }}
    >
      <div className={styles.projectInfo}>
        <img
          className={styles.projectIcon}
          src={locationIcon}
          alt=""
          aria-hidden="true"
        />
        <span className={styles.projectName}>
          项目名称: {community?.projectName ?? '—'}
        </span>
      </div>

      <div className={styles.titleBlock}>
        <h1 className={styles.titleMain}>瓴界·数据监测平台</h1>
        <p className={styles.titleSub}>FURRYZONE DATA MONITORING PLATFORM</p>
      </div>

      <HeaderRightBar />
    </header>
  )
}
