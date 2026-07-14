import api from '@/services/api'

export interface RedeemCodeInfo {
  code: string
  productId: string | null
  productName: string | null
  img: string | null
  cost: number | null
  validFrom: string | null
  validTo: string | null
  validRange: string | null
  status: 'available' | 'assigned' | 'used' | 'void' | string
  assignedUserId: number | null
  userNickname: string | null
  userPhone: string | null
  assignedAt: string | null
  usedAt: string | null
  redeemedAt: string | null
  canVerify: boolean
  message?: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = response?.data?.message
    if (message) return message
  }
  return fallback
}

export async function lookupRedeemCode(code: string): Promise<RedeemCodeInfo> {
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 18) {
    throw new Error('请输入18位兑换码')
  }

  try {
    const { data } = await api.get<RedeemCodeInfo>('/redeem/lookup', {
      params: { code: normalized },
    })
    return data
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, '查询失败，请稍后重试'))
  }
}

export async function verifyRedeemCode(code: string): Promise<RedeemCodeInfo> {
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 18) {
    throw new Error('请输入18位兑换码')
  }

  try {
    const { data } = await api.post<RedeemCodeInfo>('/redeem/verify', {
      code: normalized,
    })
    return data
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, '核销失败，请稍后重试'))
  }
}
