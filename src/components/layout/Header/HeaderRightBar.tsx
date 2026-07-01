import { useEffect, useState } from 'react'
import notificationIcon from '@/assets/top-Notification.png'
import settingIcon from '@/assets/top-Setting.png'
import managerAvatar from '@/assets/manager-img.png'
import { useHeaderWeather } from '@/hooks/useHeaderWeather'
import { headerInfoMock } from '@/mock/headerInfo'
import { WeatherIcon } from '@/components/weather/WeatherIcon/WeatherIcon'
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
  const weather = useHeaderWeather()
  const { managerName } = headerInfoMock

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

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

      <img className={styles.actionIcon} src={notificationIcon} alt="通知" />
      <img className={styles.actionIcon} src={settingIcon} alt="设置" />

      <div className={styles.manager}>
        <div className={styles.avatarWrap}>
          <img className={styles.avatar} src={managerAvatar} alt="" aria-hidden="true" />
        </div>
        <span className={styles.managerName}>{managerName}</span>
      </div>

      <span className={styles.logout}>退出</span>
    </div>
  )
}
