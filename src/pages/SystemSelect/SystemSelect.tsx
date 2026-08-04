import { ParticleBackground } from '@/components/effects/ParticleBackground/ParticleBackground'
import { useAppModeStore } from '@/stores/appModeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'
import styles from './SystemSelect.module.scss'

export function SystemSelectPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const clearCommunity = useCommunityStore((state) => state.clearCommunity)
  const setMode = useAppModeStore((state) => state.setMode)
  const resetMode = useAppModeStore((state) => state.resetMode)

  const handleLogout = () => {
    clearCommunity()
    resetMode()
    logout()
  }

  return (
    <div className={styles.page}>
      <ParticleBackground />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>选择系统</h1>
          <p className={styles.subtitle}>
            {user?.nickname ?? '管理员'}，请选择要进入的系统
          </p>
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          退出登录
        </button>
      </header>

      <div className={styles.grid}>
        <button
          type="button"
          className={styles.card}
          onClick={() => setMode('monitor')}
        >
          <span className={styles.cardBadge}>监测</span>
          <span className={styles.cardTitle}>瓴界·数据监测平台</span>
          <span className={styles.cardDesc}>
            进入小区数据大屏，查看设备与运营数据
          </span>
        </button>

        <button
          type="button"
          className={styles.card}
          onClick={() => setMode('redeem')}
        >
          <span className={styles.cardBadge}>核销</span>
          <span className={styles.cardTitle}>兑换码核销系统</span>
          <span className={styles.cardDesc}>
            查询并核销礼品兑换码，记录核销小区
          </span>
        </button>
      </div>
    </div>
  )
}
