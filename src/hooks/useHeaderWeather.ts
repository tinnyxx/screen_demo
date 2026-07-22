import { useEffect, useState } from 'react'
import { useCommunityMocks } from '@/hooks/useActiveCommunity'
import {
  fetchWeather,
  getFallbackWeather,
  type WeatherInfo,
} from '@/services/weatherApi'

const WEATHER_REFRESH_MS = 5 * 60 * 1000

export function useHeaderWeather() {
  const mocks = useCommunityMocks()
  const weatherCity = mocks?.headerInfo.weatherCity
  const [weather, setWeather] = useState<WeatherInfo>(() => getFallbackWeather())

  useEffect(() => {
    if (!weatherCity) return

    let cancelled = false

    const loadWeather = async () => {
      try {
        const data = await fetchWeather(weatherCity)
        if (!cancelled) {
          setWeather(data)
        }
      } catch (error) {
        console.error('获取天气失败', error)
        if (!cancelled) {
          setWeather(getFallbackWeather(mocks?.headerInfo))
        }
      }
    }

    void loadWeather()
    const timer = window.setInterval(loadWeather, WEATHER_REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [weatherCity, mocks?.headerInfo])

  return weather
}
