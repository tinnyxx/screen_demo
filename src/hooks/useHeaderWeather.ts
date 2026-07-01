import { useEffect, useState } from 'react'
import { headerInfoMock } from '@/mock/headerInfo'
import {
  fetchWeather,
  getFallbackWeather,
  type WeatherInfo,
} from '@/services/weatherApi'

const WEATHER_REFRESH_MS = 5 * 60 * 1000

export function useHeaderWeather() {
  const [weather, setWeather] = useState<WeatherInfo>(() => getFallbackWeather())

  useEffect(() => {
    let cancelled = false

    const loadWeather = async () => {
      try {
        const data = await fetchWeather(headerInfoMock.weatherCity)
        if (!cancelled) {
          setWeather(data)
        }
      } catch (error) {
        console.error('获取天气失败', error)
        if (!cancelled) {
          setWeather(getFallbackWeather())
        }
      }
    }

    void loadWeather()
    const timer = window.setInterval(loadWeather, WEATHER_REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return weather
}
