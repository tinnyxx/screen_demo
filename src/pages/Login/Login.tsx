import { useState, type FormEvent } from 'react'
import {
  getBoundCommunityId,
} from '@/config/communities'
import { login } from '@/services/authApi'
import { useAppModeStore } from '@/stores/appModeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'
import styles from './Login.module.scss'

export function LoginPage() {
  const setUser = useAuthStore((state) => state.setUser)
  const setCommunityId = useCommunityStore((state) => state.setCommunityId)
  const clearCommunity = useCommunityStore((state) => state.clearCommunity)
  const resetMode = useAppModeStore((state) => state.resetMode)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login({ username: username.trim(), password })
      const boundCommunityId = getBoundCommunityId(user.username)

      if (boundCommunityId) {
        setCommunityId(boundCommunityId)
      } else {
        clearCommunity()
      }

      resetMode()
      setUser(user)
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>瓴界·数据监测平台</h1>
        <p className={styles.subtitle}>FURRYZONE DATA MONITORING PLATFORM</p>

        <label className={styles.field}>
          <span className={styles.label}>用户名</span>
          <input
            className={styles.input}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>密码</span>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}
