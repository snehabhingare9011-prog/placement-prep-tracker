import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hireverse_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('hireverse_token') || null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Show lightweight toast notifications
  const showToast = (message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() })
    setTimeout(() => {
      setToast(current => (current?.message === message ? null : current))
    }, 3200)
  }

  // Load user profile on startup if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.auth.getMe()
        if (res.success && res.user) {
          setUser(res.user)
          localStorage.setItem('hireverse_user', JSON.stringify(res.user))
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message)
        setUser(null)
        setToken(null)
        localStorage.removeItem('hireverse_token')
        localStorage.removeItem('hireverse_user')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [token])

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password })
    if (res.success && res.token) {
      localStorage.setItem('hireverse_token', res.token)
      localStorage.setItem('hireverse_user', JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      showToast(`Welcome back, ${res.user.name}!`, 'success')
      return res.user
    }
    throw new Error(res.message || 'Login failed')
  }

  const register = async (userData) => {
    const res = await api.auth.register(userData)
    if (res.success && res.token) {
      localStorage.setItem('hireverse_token', res.token)
      localStorage.setItem('hireverse_user', JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      showToast('Registration successful! Welcome to HireVerse.', 'success')
      return res.user
    }
    throw new Error(res.message || 'Registration failed')
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('hireverse_token')
      localStorage.removeItem('hireverse_user')
      setToken(null)
      setUser(null)
      showToast('Signed out successfully.', 'info')
    }
  }

  const refreshUser = async () => {
    try {
      const res = await api.users.getMe()
      if (res.success && res.user) {
        setUser(res.user)
        localStorage.setItem('hireverse_user', JSON.stringify(res.user))
      }
    } catch (e) {
      // Ignore
    }
  }

  const setTarget = async (companyId, role) => {
    try {
      const res = await api.users.setTarget(companyId, role)
      if (res.success && res.user) {
        setUser(res.user)
        localStorage.setItem('hireverse_user', JSON.stringify(res.user))
        showToast(res.message || 'Target goal updated', 'success')
        return res.user
      }
      throw new Error(res.message || 'Failed to update target')
    } catch (err) {
      showToast(err.message, 'warning')
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        setTarget,
        toast,
        showToast
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
