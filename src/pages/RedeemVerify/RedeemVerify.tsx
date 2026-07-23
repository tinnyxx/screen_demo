import { useEffect, useState, type FormEvent } from 'react'
import { ParticleBackground } from '@/components/effects/ParticleBackground/ParticleBackground'
import {
  CHECKOUT_USERNAME,
  communities,
  getBoundCommunityId,
  getCommunityConfig,
  isSuperAdmin,
  type CommunityId,
} from '@/config/communities'
import {
  fetchRedeemStats,
  lookupRedeemCode,
  verifyRedeemCode,
  type RedeemCodeInfo,
  type RedeemStatsResult,
} from '@/services/redeemApi'
import { useAppModeStore } from '@/stores/appModeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'
import styles from './RedeemVerify.module.scss'

const STATUS_LABEL: Record<string, string> = {
  available: '未发放',
  assigned: '待核销',
  used: '已核销',
  void: '已作废',
}

type PageTab = 'verify' | 'stats'

function formatDate(value: string | null) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function statusClassName(status: string) {
  if (status === 'assigned') return styles.badgeAssigned
  if (status === 'used') return styles.badgeUsed
  if (status === 'void') return styles.badgeVoid
  return styles.badgeAvailable
}

function communityLabel(communityId: string | null | undefined) {
  if (!communityId) return '-'
  if (communityId === 'lanwan' || communityId === 'huarun') {
    return getCommunityConfig(communityId).name
  }
  return communityId
}

export function RedeemVerifyPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const clearCommunity = useCommunityStore((state) => state.clearCommunity)
  const setMode = useAppModeStore((state) => state.setMode)
  const resetMode = useAppModeStore((state) => state.resetMode)

  const boundCommunityId = user ? getBoundCommunityId(user.username) : null
  const isRoot = Boolean(user && isSuperAdmin(user.username))
  const isCheckoutOnly = user?.username === CHECKOUT_USERNAME
  const showBackToHub = !isCheckoutOnly

  const [tab, setTab] = useState<PageTab>('verify')
  const [code, setCode] = useState('')
  const [verifyCommunityId, setVerifyCommunityId] = useState<CommunityId | ''>(
    boundCommunityId ?? '',
  )
  const [info, setInfo] = useState<RedeemCodeInfo | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [statsFilter, setStatsFilter] = useState<CommunityId | 'all'>('all')
  const [stats, setStats] = useState<RedeemStatsResult | null>(null)
  const [statsError, setStatsError] = useState('')
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (boundCommunityId) {
      setVerifyCommunityId(boundCommunityId)
    }
  }, [boundCommunityId])

  const handleLogout = () => {
    clearCommunity()
    resetMode()
    logout()
  }

  const handleBackToHub = () => {
    setMode('hub')
  }

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setInfo(null)
    setLookingUp(true)

    try {
      const result = await lookupRedeemCode(code)
      setInfo(result)
      if (result.status === 'used') {
        setError('该兑换码已核销')
      } else if (result.status === 'void') {
        setError('该兑换码已作废')
      } else if (result.status === 'available') {
        setError('该兑换码尚未发放，无法核销')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setLookingUp(false)
    }
  }

  const handleVerify = async () => {
    if (!info?.canVerify) return

    const communityId = boundCommunityId || verifyCommunityId
    if (!communityId) {
      setError('请选择核销小区')
      return
    }

    setError('')
    setSuccess('')
    setVerifying(true)

    try {
      const result = await verifyRedeemCode(code, communityId)
      setInfo(result)
      setSuccess(
        `核销成功（${communityLabel(result.communityId ?? communityId)}）`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '核销失败')
    } finally {
      setVerifying(false)
    }
  }

  const handleLoadStats = async () => {
    setStatsError('')
    setStatsLoading(true)
    try {
      const result = await fetchRedeemStats(statsFilter)
      setStats(result)
    } catch (err) {
      setStats(null)
      setStatsError(err instanceof Error ? err.message : '统计查询失败')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== 'stats' || !isRoot) return

    let cancelled = false

    const load = async () => {
      setStatsError('')
      setStatsLoading(true)
      try {
        const result = await fetchRedeemStats(statsFilter)
        if (!cancelled) setStats(result)
      } catch (err) {
        if (!cancelled) {
          setStats(null)
          setStatsError(err instanceof Error ? err.message : '统计查询失败')
        }
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [tab, isRoot])

  const communityHint = boundCommunityId
    ? getCommunityConfig(boundCommunityId).name
    : isRoot
      ? '超级管理员'
      : '核销员'

  return (
    <div className={styles.page}>
      <ParticleBackground />
      <div className={`${styles.card} ${isRoot ? styles.cardWide : ''}`}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>礼品兑换码核销</h1>
            <p className={styles.subtitle}>
              {user?.nickname || user?.username || '核销员'} · {communityHint}
            </p>
          </div>
          <div className={styles.headerActions}>
            {showBackToHub ? (
              <button className={styles.logout} type="button" onClick={handleBackToHub}>
                返回系统选择
              </button>
            ) : null}
            <button className={styles.logout} type="button" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </div>

        {isRoot ? (
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === 'verify' ? styles.tabActive : ''}`}
              onClick={() => setTab('verify')}
            >
              核销
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === 'stats' ? styles.tabActive : ''}`}
              onClick={() => setTab('stats')}
            >
              核销查询
            </button>
          </div>
        ) : null}

        {tab === 'verify' ? (
          <>
            {isRoot || isCheckoutOnly ? (
              <label className={styles.field}>
                <span className={styles.label}>核销小区</span>
                <select
                  className={styles.select}
                  value={verifyCommunityId}
                  onChange={(event) => {
                    setVerifyCommunityId(event.target.value as CommunityId | '')
                    setError('')
                    setSuccess('')
                  }}
                  required
                >
                  <option value="">请选择小区</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <form onSubmit={handleLookup}>
              <label className={styles.field}>
                <span className={styles.label}>兑换码（18位）</span>
                <input
                  className={styles.input}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value)
                    setError('')
                    setSuccess('')
                  }}
                  maxLength={18}
                  placeholder="请输入用户礼品兑换码"
                  autoComplete="off"
                  required
                />
              </label>

              <div className={styles.actions}>
                <button className={styles.button} type="submit" disabled={lookingUp || verifying}>
                  {lookingUp ? '查询中...' : '查询兑换码'}
                </button>
                <button
                  className={`${styles.button} ${styles.secondary}`}
                  type="button"
                  onClick={handleVerify}
                  disabled={!info?.canVerify || verifying || lookingUp}
                >
                  {verifying ? '核销中...' : '确认核销'}
                </button>
              </div>
            </form>

            {error ? <p className={styles.error}>{error}</p> : null}
            {success ? <p className={styles.success}>{success}</p> : null}

            {info ? (
              <div className={styles.result}>
                <div className={styles.resultHeader}>
                  <div className={styles.productName}>{info.productName || '未知礼品'}</div>
                  <span className={`${styles.badge} ${statusClassName(info.status)}`}>
                    {STATUS_LABEL[info.status] || info.status}
                  </span>
                </div>

                {info.img ? (
                  <img className={styles.productImg} src={info.img} alt={info.productName || '礼品'} />
                ) : null}

                <div className={styles.meta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>兑换码</span>
                    <span className={styles.metaValue}>{info.code}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>用户</span>
                    <span className={styles.metaValue}>
                      {info.userNickname || '-'}
                      {info.userPhone ? `（${info.userPhone}）` : ''}
                    </span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>消耗积分</span>
                    <span className={styles.metaValue}>{info.cost ?? '-'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>有效期</span>
                    <span className={styles.metaValue}>
                      {formatDate(info.validFrom)} ~ {formatDate(info.validTo)}
                    </span>
                  </div>
                  {info.communityId ? (
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>核销小区</span>
                      <span className={styles.metaValue}>
                        {communityLabel(info.communityId)}
                      </span>
                    </div>
                  ) : null}
                  {info.status === 'used' || info.usedAt ? (
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>核销时间</span>
                      <span className={styles.metaValue}>{formatDateTime(info.usedAt)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.statsPanel}>
            <div className={styles.statsFilters}>
              <label className={styles.fieldInline}>
                <span className={styles.label}>小区筛选</span>
                <select
                  className={styles.select}
                  value={statsFilter}
                  onChange={(event) =>
                    setStatsFilter(event.target.value as CommunityId | 'all')
                  }
                >
                  <option value="all">全部小区</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={styles.button}
                type="button"
                onClick={handleLoadStats}
                disabled={statsLoading}
              >
                {statsLoading ? '查询中...' : '查询'}
              </button>
            </div>

            {statsError ? <p className={styles.error}>{statsError}</p> : null}

            {stats ? (
              <>
                <div className={styles.statsSummary}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>核销总量</span>
                    <span className={styles.statValue}>{stats.total}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>礼品种类</span>
                    <span className={styles.statValue}>{stats.productTypeCount}</span>
                  </div>
                  {stats.byCommunity.map((item) => (
                    <div key={item.communityId} className={styles.statCard}>
                      <span className={styles.statLabel}>
                        {communityLabel(item.communityId)}
                      </span>
                      <span className={styles.statValue}>{item.total}</span>
                    </div>
                  ))}
                </div>

                {stats.productTypes.length > 0 ? (
                  <div className={styles.typeList}>
                    <h3 className={styles.sectionTitle}>种类明细</h3>
                    <ul className={styles.typeItems}>
                      {stats.productTypes.map((item) => (
                        <li key={`${item.productId}-${item.productName}`}>
                          <span>{item.productName}</span>
                          <span>{item.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className={styles.tableWrap}>
                  <h3 className={styles.sectionTitle}>核销明细</h3>
                  {stats.records.length === 0 ? (
                    <p className={styles.empty}>暂无核销记录</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>小区</th>
                          <th>兑换码</th>
                          <th>礼品种类</th>
                          <th>用户</th>
                          <th>核销时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.records.map((record) => (
                          <tr key={`${record.communityId}-${record.code}`}>
                            <td>{communityLabel(record.communityId)}</td>
                            <td className={styles.codeCell}>{record.code}</td>
                            <td>{record.productName}</td>
                            <td>
                              {record.userNickname || '-'}
                              {record.userPhone ? `（${record.userPhone}）` : ''}
                            </td>
                            <td>{formatDateTime(record.usedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
