import { useState, type FormEvent } from 'react'
import {
  lookupRedeemCode,
  verifyRedeemCode,
  type RedeemCodeInfo,
} from '@/services/redeemApi'
import { useAuthStore } from '@/stores/authStore'
import styles from './RedeemVerify.module.scss'

const STATUS_LABEL: Record<string, string> = {
  available: '未发放',
  assigned: '待核销',
  used: '已核销',
  void: '已作废',
}

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

export function RedeemVerifyPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [code, setCode] = useState('')
  const [info, setInfo] = useState<RedeemCodeInfo | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [verifying, setVerifying] = useState(false)

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

    setError('')
    setSuccess('')
    setVerifying(true)

    try {
      const result = await verifyRedeemCode(code)
      setInfo(result)
      setSuccess(result.message || '核销成功')
    } catch (err) {
      setError(err instanceof Error ? err.message : '核销失败')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>礼品兑换码核销</h1>
            <p className={styles.subtitle}>
              {user?.nickname || user?.username || '核销员'} · 仅核销入口
            </p>
          </div>
          <button className={styles.logout} type="button" onClick={logout}>
            退出登录
          </button>
        </div>

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
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>使用范围</span>
                <span className={styles.metaValue}>{info.validRange || '-'}</span>
              </div>
              {info.status === 'used' || info.usedAt ? (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>核销时间</span>
                  <span className={styles.metaValue}>{formatDateTime(info.usedAt)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
