import {
  getBoundCommunityId,
  getCommunityConfig,
  isSuperAdmin,
  type CommunityConfig,
  type CommunityId,
} from '@/config/communities'
import { communityMocks, type CommunityMockBundle } from '@/mock/communityMocks'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'

export function useResolvedCommunityId(): CommunityId | null {
  const user = useAuthStore((state) => state.user)
  const storedCommunityId = useCommunityStore((state) => state.communityId)

  if (!user) return null

  const boundCommunityId = getBoundCommunityId(user.username)
  if (boundCommunityId) return boundCommunityId

  if (isSuperAdmin(user.username)) return storedCommunityId

  return null
}

export function useActiveCommunityId(): CommunityId | null {
  return useResolvedCommunityId()
}

export function useActiveCommunity(): CommunityConfig | null {
  const communityId = useResolvedCommunityId()
  if (!communityId) return null
  return getCommunityConfig(communityId)
}

export function useCommunityMocks(): CommunityMockBundle | null {
  const communityId = useResolvedCommunityId()
  if (!communityId) return null
  return communityMocks[communityId]
}
