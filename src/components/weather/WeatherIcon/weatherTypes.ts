export type WeatherIconType =
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'light-rain'
  | 'moderate-rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'light-snow'
  | 'moderate-snow'
  | 'heavy-snow'
  | 'sleet'
  | 'fog'
  | 'haze'
  | 'sand'

const weatherMatchers: { type: WeatherIconType; keywords: string[] }[] = [
  { type: 'thunderstorm', keywords: ['雷阵雨', '雷暴', '强雷阵雨'] },
  { type: 'sleet', keywords: ['雨夹雪', '雨雪', '阵雨夹雪'] },
  { type: 'heavy-snow', keywords: ['大雪', '暴雪', '大到暴雪'] },
  { type: 'moderate-snow', keywords: ['中雪', '中到大雪'] },
  { type: 'light-snow', keywords: ['小雪', '阵雪', '小到中雪'] },
  { type: 'heavy-rain', keywords: ['大雨', '暴雨', '大暴雨', '特大暴雨', '极端降雨'] },
  { type: 'moderate-rain', keywords: ['中雨', '中到大雨', '大到暴雨'] },
  { type: 'light-rain', keywords: ['小雨', '阵雨', '毛毛雨', '细雨', '小到中雨'] },
  { type: 'sand', keywords: ['沙尘', '扬沙', '浮尘', '沙尘暴', '强沙尘暴'] },
  { type: 'haze', keywords: ['霾', '中度霾', '重度霾', '严重霾'] },
  { type: 'fog', keywords: ['雾', '浓雾', '薄雾', '大雾', '强浓雾', '特强浓雾'] },
  { type: 'overcast', keywords: ['阴', '阴天'] },
  { type: 'cloudy', keywords: ['多云', '少云', '晴间多云', '大部多云'] },
  { type: 'sunny', keywords: ['晴', '晴天'] },
]

export function resolveWeatherIconType(weather: string): WeatherIconType {
  const text = weather.trim()

  for (const matcher of weatherMatchers) {
    if (matcher.keywords.some((keyword) => text.includes(keyword))) {
      return matcher.type
    }
  }

  return 'sunny'
}

export const defaultWeatherIconType: WeatherIconType = 'sunny'
