import api from '@/services/api'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  username: string
  nickname: string
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const username = payload.username.trim()

  if (!username || !payload.password) {
    throw new Error('用户名和密码不能为空')
  }

  try {
    const { data } = await api.post<LoginResult>('/auth/login', {
      username,
      password: payload.password,
    })

    return {
      username: data.username,
      nickname: data.nickname,
    }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response
      const message = response?.data?.message
      if (message) {
        throw new Error(message)
      }
    }

    throw new Error('登录失败，请稍后重试')
  }
}
