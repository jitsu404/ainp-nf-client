import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FlaskConical, Briefcase, Mail, IndianRupee, FileCheck2, Users, CalendarCheck, FolderOpen, BarChart3, Database, ShieldCheck, Cloud, Menu, Bell, LogOut } from 'lucide-react'

const Icons = { LayoutDashboard, FlaskConical, Briefcase, Mail, IndianRupee, FileCheck2, Users, CalendarCheck, FolderOpen, BarChart3, Database, ShieldCheck, Cloud, Menu, Bell, LogOut }
import { useStore } from '../store'
import { MODULES, ROLE_LIST, ROLES } from '../roles'
import { usePending } from '../pages/pending'

export default function Layout() {
  const { programme, role, user, centre, session, setSession, fy, setFy, db } = useStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const pending = usePending()
  const mods = MODULES.filter((m) => role.modules.includes(m.id))
  const groups = [...new Set(mods.map((m) => m.group))]
  const initials = user.name.replace(/^Dr\.\s*/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('')

  const switchRole = (roleId) => {
    const next = ROLES[roleId]
    setSession({ roleId, centreId: next.scope === 'centre' ? session.centreId || db.centres[0].id : session.centreId })
    navigate('/')
  }

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logos/icar.png" alt="ICAR logo" />
          <div><b>{programme.short}</b><span>{programme.system}<br />ICAR-IIFSR, Modipuram</span></div>
        </div>
        <nav className="nav" onClick={() => setOpen(false)}>
          {groups.map((g) => (
            <div key={g}>
              <h5>{g}</h5>
              {mods.filter((m) => m.group === g).map((m) => {
                const Icon = Icons[m.icon]
                const count = pending.filter((p) => p.module === m.id).length
                return (
                  <NavLink key={m.id} to={m.path} end={m.path === '/'}>
                    <Icon size={17} />{m.label}{count > 0 && m.id !== 'dashboard' && <span className="count">{count}</span>}
                  </NavLink>
                )
              })}
            </div>
          ))}
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
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Icons.Menu size={20} /></button>
          <span className="title grow">{centre ? `${centre.name} centre · ${centre.host}` : programme.name}</span>
          <label className="row small muted" style={{ gap: 6 }}><span className="hide-sm">Financial year</span>
            <select value={fy} onChange={(e) => setFy(e.target.value)}>{programme.fys.map((y) => <option key={y}>{y}</option>)}</select>
          </label>
          <label className="row small muted" style={{ gap: 6 }}><span className="hide-sm">View as</span>
            <select value={role.id} onChange={(e) => switchRole(e.target.value)}>{ROLE_LIST.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
          </label>
          <button className="icon-btn" onClick={() => navigate('/')} aria-label="Pending actions">
            <Icons.Bell size={18} />{pending.length > 0 && <span className="dot">{pending.length}</span>}
          </button>
          <div className="user">
            <span className="avatar">{initials}</span>
            <div><b>{user.name}</b><span>{role.label}{centre ? ` · ${centre.name}` : ''}</span></div>
            <button className="icon-btn" onClick={() => { setSession(null); navigate('/') }} aria-label="Sign out" title="Sign out"><Icons.LogOut size={17} /></button>
          </div>
        </header>
        <div className="demo-note">First-draft prototype with sample data. Use “View as” to see each role’s screens. Figures, names and reference numbers are illustrative.</div>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
