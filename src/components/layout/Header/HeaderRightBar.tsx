import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import notificationIcon from '@/assets/top-Notification.png'
import qrcodeImg from '@/assets/top-qrcode.jpg'
import managerAvatar from '@/assets/manager-img.png'
import { useHeaderWeather } from '@/hooks/useHeaderWeather'
import { WeatherIcon } from '@/components/weather/WeatherIcon/WeatherIcon'
import { useAuthStore } from '@/stores/authStore'
import styles from './Header.module.scss'

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours} : ${minutes} : ${seconds}`
}

function formatTemperature(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function HeaderRightBar() {
  const [now, setNow] = useState(() => new Date())
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const notificationRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const weather = useHeaderWeather()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const updatePopupPos = () => {
    const el = notificationRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPopupPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    })
  }

  const openPopup = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    updatePopupPos()
    setPopupOpen(true)
  }

  const scheduleClosePopup = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = window.setTimeout(() => {
      setPopupOpen(false)
      closeTimerRef.current = null
    }, 120)
  }

  return (
    <div className={styles.headerRight}>
      <time className={styles.dateText} dateTime={formatDate(now)}>
        {formatDate(now)}
      </time>

      <time className={styles.timeText} dateTime={now.toISOString()}>
        {formatTime(now)}
      </time>

      <div className={styles.weather}>
        <WeatherIcon type={weather.iconType} className={styles.weatherIcon} />
        <span className={styles.weatherTemp}>{formatTemperature(weather.temperature)}℃</span>
        <span className={styles.weatherDesc}>{weather.description}</span>
      </div>

      <div
        ref={notificationRef}
        className={styles.notificationWrap}
        onMouseEnter={openPopup}
        onMouseLeave={scheduleClosePopup}
      >
        <img className={styles.actionIcon} src={notificationIcon} alt="通知" />
      </div>

      {popupOpen
        ? createPortal(
            <div
              className={styles.notificationPopup}
              role="tooltip"
              style={{ top: popupPos.top, left: popupPos.left }}
              onMouseEnter={openPopup}
              onMouseLeave={scheduleClosePopup}
            >
              <img className={styles.qrcode} src={qrcodeImg} alt="二维码" />
            </div>,
            document.body,
          )
        : null}

      <div className={styles.manager}>
        <div className={styles.avatarWrap}>
          <img className={styles.avatar} src={managerAvatar} alt="" aria-hidden="true" />
        </div>
        <span className={styles.managerName}>{user?.nickname ?? '管理员'}</span>
      </div>

      <button type="button" className={styles.logout} onClick={logout}>
        退出
      </button>
    </div>
  )
}
