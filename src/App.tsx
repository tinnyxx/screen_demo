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
import { SystemSelectPage } from '@/pages/SystemSelect/SystemSelect'
import { useResolvedCommunityId } from '@/hooks/useActiveCommunity'
import { useAppModeStore } from '@/stores/appModeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'

function App() {
  const user = useAuthStore((state) => state.user)
  const communityId = useResolvedCommunityId()
  const setCommunityId = useCommunityStore((state) => state.setCommunityId)
  const clearCommunity = useCommunityStore((state) => state.clearCommunity)
  const mode = useAppModeStore((state) => state.mode)
  const setMode = useAppModeStore((state) => state.setMode)
  const resetMode = useAppModeStore((state) => state.resetMode)

  useEffect(() => {
    if (!user) {
      clearCommunity()
      resetMode()
      return
    }

    const boundCommunityId = getBoundCommunityId(user.username)
    if (boundCommunityId) {
      setCommunityId(boundCommunityId)
    } else if (!isSuperAdmin(user.username)) {
      clearCommunity()
    }

    if (user.username === CHECKOUT_USERNAME) {
      setMode('redeem')
    }
  }, [user, setCommunityId, clearCommunity, setMode, resetMode])

  if (!user) {
    return <LoginPage />
  }

  if (user.username === CHECKOUT_USERNAME || mode === 'redeem') {
    return <RedeemVerifyPage />
  }

  if (mode === 'hub') {
    return <SystemSelectPage />
  }

  // monitor mode
  if (isSuperAdmin(user.username) && !communityId) {
    return <CommunitySelectPage />
  }

  if (!communityId) {
    return <LoginPage />
  }

  return <Dashboard />
}

export default App
