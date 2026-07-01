import axios from 'axios'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  username: string
  nickname: string
}

export async function login(payload: LoginPayload) {
  const { data } = await axios.post<LoginResult>('/api/auth/login', payload, {
    timeout: 10000,
  })
  return data
}
