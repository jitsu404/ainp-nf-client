import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout, { navItems } from './components/Layout'
import { useStore } from './store'
import Accounts from './pages/Accounts'
import AccountPage, { ForcedPasswordChange } from './pages/ChangePassword'
import CentreDetail from './pages/CentreDetail'
import Centres from './pages/Centres'
import Home from './pages/Home'
import Login from './pages/Login'

// Live app for this phase: Super Admin and PCU sign in with real accounts and manage centres and
// Centre PIs through the API. The prototype's other screens (src/pages/Research…, Finance…) stay
// in the codebase and are brought back as each module gets its backend.

export default function App() {
  const auth = useAuth()
  const { toasts } = useStore()

  let content
  if (auth.status === 'loading') content = <div className="splash">Loading…</div>
  else if (auth.status === 'anonymous') content = <Login />
  else if (auth.session.mustChangePassword) content = <ForcedPasswordChange />
  else {
    const allowed = new Set(navItems(auth).map((item) => item.to))
    content = (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {allowed.has('/centres') && <Route path="/centres" element={<Centres />} />}
          {allowed.has('/centres') && <Route path="/centres/:id" element={<CentreDetail />} />}
          {allowed.has('/accounts') && <Route path="/accounts" element={<Accounts />} />}
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    )
  }

  return (
    <>
      <div className="tricolour" />
      {content}
      <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}</div>
    </>
  )
}
