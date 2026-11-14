import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi, setSessionErrorHandler } from './api'
import { PASSWORD_CHANGE_REQUIRED } from './config/constants'

// The signed-in session comes from the API (/auth/me): user, role, capabilities and the roles this
// user may manage. Nothing about permissions is hardcoded in the client.
//
// Cached query data belongs to one person: it is cleared whenever someone signs in or out, or the
// session ends, so the next person on a shared office PC never sees the previous user's data.

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  // status: 'loading' | 'anonymous' | 'authenticated'
  const [status, setStatus] = useState('loading')
  const [session, setSession] = useState(null)
  const [notice, setNotice] = useState('')

  const signedIn = useCallback((data) => { setSession(data); setStatus('authenticated') }, [])
  const signedOut = useCallback((message = '') => {
    queryClient.clear()
    setSession(null)
    setStatus('anonymous')
    setNotice(message)
  }, [queryClient])

  const refresh = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      signedIn(data)
    } catch {
      signedOut()
    }
  }, [signedIn, signedOut])

  useEffect(() => {
    refresh()
    // Any API call can report that the session ended or a password change is now required.
    setSessionErrorHandler((error) => {
      if (error.code === PASSWORD_CHANGE_REQUIRED) refresh()
      else signedOut(error.code === 'SESSION_EXPIRED' ? error.message : 'Your session has ended. Please sign in again.')
    })
  }, [refresh, signedOut])

  const value = useMemo(() => ({
    status,
    session,
    notice,
    user: session?.user,
    role: session?.role,
    can: (capability) => !!session?.capabilities.includes(capability),
    /** Roles this user may create and manage, e.g. [{ id: 'pi', label: 'Centre PI' }]. */
    assignable: session?.assignableRoles ?? [],
    login: async (email, password) => {
      const { data } = await authApi.login(email, password)
      queryClient.clear()
      setNotice('')
      signedIn(data)
    },
    logout: async () => {
      await authApi.logout().catch(() => {})
      signedOut()
    },
    changePassword: async (currentPassword, newPassword) => {
      const { data } = await authApi.changePassword(currentPassword, newPassword)
      signedIn(data)
    },
  }), [status, session, notice, queryClient, signedIn, signedOut])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
