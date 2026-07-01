export interface HeaderWeatherInfo {
  temperature: number
  description: string
}

export interface HeaderInfoData {
  weatherCity: string
  weather: HeaderWeatherInfo
  managerName: string
}

export const headerInfoMock: HeaderInfoData = {
  weatherCity: '深圳',
  weather: {
    temperature: 28,
    description: '晴',
  },
  managerName: '物业管理员01',
}
