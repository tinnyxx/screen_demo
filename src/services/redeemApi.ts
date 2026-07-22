import api from '@/services/api'
import type { CommunityId } from '@/config/communities'

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
  communityId: CommunityId | string | null
  assignedUserId: number | null
  userNickname: string | null
  userPhone: string | null
  assignedAt: string | null
  usedAt: string | null
  redeemedAt: string | null
  canVerify: boolean
  message?: string
}

export interface RedeemStatsProductType {
  productId: string | null
  productName: string
  count: number
}

export interface RedeemStatsRecord {
  code: string
  productId: string | null
  productName: string
  communityId: CommunityId | string
  usedAt: string | null
  userNickname: string | null
  userPhone: string | null
}

export interface RedeemStatsCommunity {
  communityId: CommunityId | string
  total: number
  productTypes: RedeemStatsProductType[]
  codes: RedeemStatsRecord[]
}

export interface RedeemStatsResult {
  total: number
  productTypeCount: number
  productTypes: RedeemStatsProductType[]
  byCommunity: RedeemStatsCommunity[]
  records: RedeemStatsRecord[]
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
  const normalized = code.trim()
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

export async function verifyRedeemCode(
  code: string,
  communityId: CommunityId,
): Promise<RedeemCodeInfo> {
  const normalized = code.trim()
  if (normalized.length !== 18) {
    throw new Error('请输入18位兑换码')
  }

  try {
    const { data } = await api.post<RedeemCodeInfo>('/redeem/verify', {
      code: normalized,
      communityId,
    })
    return data
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, '核销失败，请稍后重试'))
  }
}

export async function fetchRedeemStats(
  communityId?: CommunityId | 'all',
): Promise<RedeemStatsResult> {
  try {
    const { data } = await api.get<RedeemStatsResult>('/redeem/stats', {
      params:
        communityId && communityId !== 'all'
          ? { communityId }
          : undefined,
    })
    return data
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, '统计查询失败，请稍后重试'))
  }
}
