export const useAuth = () => {
  const user = useState<any>('auth_user', () => null)
  const loading = useState<boolean>('auth_loading', () => false)

  const fetchUser = async () => {
    loading.value = true
    try {
      const data = await $fetch('/api/auth/me')
      user.value = data
      return data
    } catch (err) {
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = (res as any).user
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.data?.message || err.message || 'Login failed'
      }
    } finally {
      loading.value = false
    }
  }

  const register = async (name: string, email: string, password: string) => {
    loading.value = true
    try {
      const res = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      })
      user.value = (res as any).user
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.data?.message || err.message || 'Pendaftaran gagal'
      }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // ignore
    }
    user.value = null
    navigateTo('/login')
  }

  return {
    user,
    loading,
    fetchUser,
    login,
    register,
    logout
  }
}
