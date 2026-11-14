import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, setAuthErrorHandler } from './api'

// The signed-in session comes from the API (/auth/me): user, role, capabilities and the roles this
// user may manage. Nothing about permissions is hardcoded in the client.

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  // status: 'loading' | 'anonymous' | 'authenticated'
  const [status, setStatus] = useState('loading')
  const [session, setSession] = useState(null)
  const [notice, setNotice] = useState('')

  const signedIn = (data) => { setSession(data); setStatus('authenticated') }
  const signedOut = (message = '') => { setSession(null); setStatus('anonymous'); setNotice(message) }

  const refresh = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      signedIn(data)
    } catch {
      signedOut()
    }
  }, [])

  useEffect(() => {
    refresh()
    // If any API call says the session is over, drop back to the sign-in page.
    setAuthErrorHandler((error) => {
      if (error.code === 'PASSWORD_CHANGE_REQUIRED') refresh()
      else signedOut(error.code === 'SESSION_EXPIRED' ? error.message : 'Your session has ended. Please sign in again.')
    })
  }, [refresh])

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
  }), [status, session, notice])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
