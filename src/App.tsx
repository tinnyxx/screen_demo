import Dashboard from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login/Login'
import { RedeemVerifyPage } from '@/pages/RedeemVerify/RedeemVerify'
import { useAuthStore } from '@/stores/authStore'

const CHECKOUT_USERNAME = 'checkout01'

function App() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <LoginPage />
  }

  if (user.username === CHECKOUT_USERNAME) {
    return <RedeemVerifyPage />
  }

  return <Dashboard />
}

export default App
