import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout, { navItems } from './components/Layout'
import { ROUTES } from './config/constants'
import { Toaster } from './lib/toast'
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

  let content
  if (auth.status === 'loading') content = <div className="splash">Loading…</div>
  else if (auth.status === 'anonymous') content = <Login />
  else if (auth.session.mustChangePassword) content = <ForcedPasswordChange />
  else {
    const allowed = new Set(navItems(auth).map((item) => item.to))
    content = (
      <Routes>
        <Route element={<Layout />}>
          <Route path={ROUTES.home} element={<Home />} />
          {allowed.has(ROUTES.centres) && <Route path={ROUTES.centres} element={<Centres />} />}
          {allowed.has(ROUTES.centres) && <Route path={ROUTES.centre(':id')} element={<CentreDetail />} />}
          {allowed.has(ROUTES.accounts) && <Route path={ROUTES.accounts} element={<Accounts />} />}
          <Route path={ROUTES.myAccount} element={<AccountPage />} />
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Route>
      </Routes>
    )
  }

  return (
    <>
      <div className="tricolour" />
      {content}
      <Toaster />
    </>
  )
}
