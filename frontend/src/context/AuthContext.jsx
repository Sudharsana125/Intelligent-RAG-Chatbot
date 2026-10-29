import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
      return saved ? JSON.parse(saved) : null
    } catch (_) {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  // Verify session validity with backend on mount
  useEffect(() => {
    const verifySession = async () => {
      if (user && user.token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${user.token}` }
          })
          const data = await res.json()
          if (data.ok && data.user) {
            setUser(prev => ({ ...prev, ...data.user }))
          } else {
            // Invalid or expired token
            logout()
          }
        } catch (_) {
          // If offline or network glitch, keep cached user
        }
      }
      setIsLoading(false)
    }

    verifySession()
  }, [])

  const login = async (email, password, rememberMe = true) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password.trim() })
    })
    const data = await res.json()
    if (!data.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.')
    }

    const authUser = {
      ...data.user,
      token: data.token
    }

    setUser(authUser)
    try {
      if (rememberMe) {
        localStorage.setItem('auth_user', JSON.stringify(authUser))
        sessionStorage.removeItem('auth_user')
      } else {
        sessionStorage.setItem('auth_user', JSON.stringify(authUser))
        localStorage.removeItem('auth_user')
      }
    } catch (_) {}

    return authUser
  }

  const register = async (name, email, password, role = 'Customer') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role
      })
    })
    const data = await res.json()
    if (!data.ok) {
      throw new Error(data.error || 'Registration failed.')
    }

    const authUser = {
      ...data.user,
      token: data.token
    }

    setUser(authUser)
    try {
      localStorage.setItem('auth_user', JSON.stringify(authUser))
    } catch (_) {}

    return authUser
  }

  const resetPassword = async (email, newPassword) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        new_password: newPassword.trim()
      })
    })
    const data = await res.json()
    if (!data.ok) {
      throw new Error(data.error || 'Password reset failed.')
    }
    return data.message
  }

  const updateProfile = async (name, avatar) => {
    if (!user?.token) return
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ name, avatar })
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Failed to update profile.')

    const updated = { ...user, ...data.user }
    setUser(updated)
    try {
      if (localStorage.getItem('auth_user')) {
        localStorage.setItem('auth_user', JSON.stringify(updated))
      } else {
        sessionStorage.setItem('auth_user', JSON.stringify(updated))
      }
    } catch (_) {}

    return data.message
  }

  const changePassword = async (oldPassword, newPassword) => {
    if (!user?.token) return
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Failed to change password.')
    return data.message
  }

  const logout = useCallback(() => {
    const token = user?.token
    setUser(null)
    try {
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_user')
    } catch (_) {}

    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
    }
  }, [user?.token])

  // Universal authenticated API client wrapper
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = user?.token
    const headers = {
      ...(options.headers || {})
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      logout()
      throw new Error('Your session has expired. Please sign in again.')
    }
    return res
  }, [user?.token, logout])

  return (
    <AuthContext.Provider value={{
      user,
      token: user?.token || null,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      resetPassword,
      updateProfile,
      changePassword,
      logout,
      apiFetch
    }}>
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
