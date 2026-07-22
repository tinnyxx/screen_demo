import { useEffect } from 'react'
import {
  CHECKOUT_USERNAME,
  getBoundCommunityId,
  isSuperAdmin,
} from '@/config/communities'
import Dashboard from '@/pages/Dashboard'
import { CommunitySelectPage } from '@/pages/CommunitySelect/CommunitySelect'
import { LoginPage } from '@/pages/Login/Login'
import { RedeemVerifyPage } from '@/pages/RedeemVerify/RedeemVerify'
import { useResolvedCommunityId } from '@/hooks/useActiveCommunity'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'

function App() {
  const user = useAuthStore((state) => state.user)
  const communityId = useResolvedCommunityId()
  const setCommunityId = useCommunityStore((state) => state.setCommunityId)
  const clearCommunity = useCommunityStore((state) => state.clearCommunity)

  useEffect(() => {
    if (!user) {
      clearCommunity()
      return
    }

    const boundCommunityId = getBoundCommunityId(user.username)
    if (boundCommunityId) {
      setCommunityId(boundCommunityId)
      return
    }

    if (!isSuperAdmin(user.username)) {
      clearCommunity()
    }
  }, [user, setCommunityId, clearCommunity])

  if (!user) {
    return <LoginPage />
  }

  if (user.username === CHECKOUT_USERNAME) {
    return <RedeemVerifyPage />
  }

  if (isSuperAdmin(user.username) && !communityId) {
    return <CommunitySelectPage />
  }

  if (!communityId) {
    return <LoginPage />
  }

  return <Dashboard />
}

export default App
