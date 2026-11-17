import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Building2, ClipboardList, Database, FlaskConical, History, LayoutDashboard, LogOut, Menu, ShieldCheck, UserCog } from 'lucide-react'
import { useAuth } from '../auth'
import { ROUTES } from '../config/constants'
import { programme } from '../programme/config'
import { PageErrorBoundary } from './ErrorBoundaries'

/**
 * Navigation. Items appear based on the capabilities and manageable roles in the session from the
 * API; App.jsx only creates routes for the items shown. The prototype's other modules (finance,
 * AUC/SoE …) come back here one by one as each is connected to the backend.
 */
const researchUser = (auth) =>
  ['research.config', 'research.enter', 'research.review', 'research.approve'].some((c) => auth.can(c))

export const navItems = (auth) => [
  { to: ROUTES.home, label: 'Dashboard', icon: LayoutDashboard, show: true },
  { to: ROUTES.experiments, label: 'Experiments', icon: FlaskConical, show: researchUser(auth) },
  { to: ROUTES.sheets, label: 'Observation sheets', icon: ClipboardList, show: researchUser(auth) },
  { to: ROUTES.centres, label: 'Centres & PIs', icon: Building2, show: auth.can('centres.manage') },
  {
    to: ROUTES.accounts,
    label: 'PCU accounts',
    icon: ShieldCheck,
    show: auth.assignable.some((r) => r.id === 'pc'),
  },
  { to: ROUTES.masters, label: 'Masters', icon: Database, show: auth.can('masters.edit') },
  { to: ROUTES.audit, label: 'Audit trail', icon: History, show: auth.can('audit.view') },
  { to: ROUTES.myAccount, label: 'My account', icon: UserCog, show: true },
].filter((item) => item.show)

export default function Layout() {
  const auth = useAuth()
  const { user, role, logout } = auth
  const [open, setOpen] = useState(false)
  const initials = user.name.replace(/^(Dr|Mr|Mrs|Ms)\.?\s*/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logos/icar.png" alt="ICAR logo" />
          <div><b>{programme.short}</b><span>{programme.system}<br />ICAR-IIFSR, Modipuram</span></div>
        </div>
        <nav className="nav" onClick={() => setOpen(false)}>
          <div>
            <h5>{role.label}</h5>
            {navItems(auth).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === ROUTES.home}><Icon size={17} />{label}</NavLink>
            ))}
          </div>
        </nav>
        <div className="side-foot">
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <img src="/logos/iifsr.png" alt="ICAR-IIFSR logo" height="34" />
            <span>{programme.institute}</span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={20} /></button>
          <span className="title grow">{programme.name}</span>
          <div className="user">
            <span className="avatar">{initials}</span>
            <div><b>{user.name}</b><span>{role.label}</span></div>
            <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </header>
        <main className="content">
          {/* A failing page shows a fallback here; the sidebar and topbar keep working. */}
          <PageErrorBoundary><Outlet /></PageErrorBoundary>
        </main>
      </div>
    </div>
  )
}
