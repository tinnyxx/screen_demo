import headTabImg from '@/assets/head-tab.png'
import { HeaderRightBar } from './HeaderRightBar'
import styles from './Header.module.scss'

export function Header() {
  return (
    <header
      className={styles.header}
      style={{ backgroundImage: `url(${headTabImg})` }}
    >
      <div className={styles.titleBlock}>
        <h1 className={styles.titleMain}>瓴界·数据监测平台</h1>
        <p className={styles.titleSub}>FURRYZONE DATA MONITORING PLATFORM</p>
      </div>

      <HeaderRightBar />
    </header>
  )
}
