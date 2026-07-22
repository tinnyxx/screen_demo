import axios from 'axios'
import {
  defaultWeatherIconType,
  resolveWeatherIconType,
  type WeatherIconType,
} from '@/components/weather/WeatherIcon/weatherTypes'
import { headerInfoMock, type HeaderInfoData } from '@/mock/headerInfo'

const WEATHER_API_URL = '/api/weather'

export interface WeatherInfo {
  temperature: number
  description: string
  iconType: WeatherIconType
  city?: string
}

export interface UapisWeatherResponse {
  city?: string
  weather: string
  weather_icon: string
  temperature: number
}

export function mapWeatherResponse(data: UapisWeatherResponse): WeatherInfo {
  return {
    temperature: data.temperature,
    description: data.weather,
    iconType: resolveWeatherIconType(data.weather),
    city: data.city,
  }
}

export function getFallbackWeather(headerInfo: HeaderInfoData = headerInfoMock): WeatherInfo {
  const { temperature, description } = headerInfo.weather

  return {
    temperature,
    description,
    iconType: resolveWeatherIconType(description) || defaultWeatherIconType,
  }
}

export async function fetchWeather(city = headerInfoMock.weatherCity): Promise<WeatherInfo> {  const { data } = await axios.get<UapisWeatherResponse>(WEATHER_API_URL, {
    params: {
      city,
      lang: 'zh',
    },
    timeout: 10000,
  })

  return mapWeatherResponse(data)
}
