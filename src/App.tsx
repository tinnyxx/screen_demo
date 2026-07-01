import Dashboard from '@/pages/Dashboard'
import { LoginPage } from '@/pages/Login/Login'
import { useAuthStore } from '@/stores/authStore'

function App() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <LoginPage />
  }

  return <Dashboard />
}

export default App
