import {
  communities,
  type CommunityId,
} from '@/config/communities'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'
import styles from './CommunitySelect.module.scss'

export function CommunitySelectPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const setCommunityId = useCommunityStore((state) => state.setCommunityId)

  const handleSelect = (communityId: CommunityId) => {
    setCommunityId(communityId)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>选择小区</h1>
          <p className={styles.subtitle}>
            {user?.nickname ?? '超级管理员'}，请选择要进入的数据监测大屏
          </p>
        </div>
        <button type="button" className={styles.logout} onClick={logout}>
          退出登录
        </button>
      </header>

      <div className={styles.grid}>
        {communities.map((community) => (
          <button
            key={community.id}
            type="button"
            className={styles.card}
            onClick={() => handleSelect(community.id)}
          >
            <div className={styles.imageWrap}>
              <img
                className={styles.image}
                src={community.background}
                alt={community.name}
              />
            </div>
            <span className={styles.cardName}>{community.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
