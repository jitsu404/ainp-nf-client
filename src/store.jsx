import { createContext, useContext, useState } from 'react'
import { ROLES } from './roles'
import { buildSeed } from './data/seed'
import { programme } from './programme/config'

// In-memory demo store. In the full build these calls become requests to the Express / MongoDB API.
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

let uid = 5000
const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
export const today = () => new Date().toISOString().slice(0, 10)

const loadSession = () => {
  try { return JSON.parse(sessionStorage.getItem(`${programme.id}-session`)) } catch { return null }
}

export function StoreProvider({ children }) {
  const [session, setSessionState] = useState(loadSession)
  const [db, setDb] = useState(buildSeed)
  const [fy, setFy] = useState(programme.currentFy)
  const [toasts, setToasts] = useState([])

  const role = session ? ROLES[session.roleId] : null
  const centre = role?.scope === 'centre' ? db.centres.find((c) => c.id === session.centreId) : null
  const account = role && db.users.find((u) => u.roleId === role.id && (!centre || u.centreId === centre.id))
  const user = role && {
    name: account?.name || role.user.name || role.label,
    designation: role.user.designation,
  }

  const setSession = (s) => {
    if (s) sessionStorage.setItem(`${programme.id}-session`, JSON.stringify(s))
    else sessionStorage.removeItem(`${programme.id}-session`)
    setSessionState(s)
  }

  const notify = (text) => {
    const id = ++uid
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  const auditRow = (action, module) => ({
    id: `audit-${++uid}`, at: nowStamp(), user: user?.name, role: role?.label, action, module,
    centreId: centre?.id || null, ip: '10.24.6.' + (20 + (uid % 60)),
  })

  const add = (col, item, label) => {
    const rec = { ...item, id: `${col}-${++uid}` }
    setDb((d) => ({ ...d, [col]: [rec, ...d[col]], audit: [auditRow(label || `Created record`, col), ...d.audit] }))
    notify(label || 'Saved')
    return rec
  }

  const update = (col, id, patch, label) => {
    setDb((d) => ({
      ...d,
      [col]: d[col].map((r) => (r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)),
      audit: label ? [auditRow(label, col), ...d.audit] : d.audit,
    }))
    if (label) notify(label)
  }

  // Submission → scrutiny → return → re-submission → approval / lock
  const transition = (col, rec, status, remark) => {
    const step = { status, at: nowStamp(), by: user.name, role: role.label, remark }
    update(col, rec.id, (r) => ({ status, history: [...(r.history || []), step] }), `${status}: ${rec.ref || rec.title || rec.id}`)
  }

  const can = (cap) => !!role?.can.includes(cap)
  const scope = (rows) => (centre ? rows.filter((r) => !r.centreId || r.centreId === centre.id) : rows)
  const centres = centre ? [centre] : db.centres
  const centreName = (id) => db.centres.find((c) => c.id === id)?.name || programme.unit

  const workflowActions = (rec, prefix) => {
    const s = rec.status
    const out = []
    if (can(`${prefix}.submit`)) {
      if (s === 'Draft') out.push({ label: 'Submit to Coordinating Unit', to: 'Submitted' })
      if (s === 'Returned') out.push({ label: 'Re-submit after correction', to: 'Resubmitted' })
    }
    if (can(`${prefix}.review`) && ['Submitted', 'Resubmitted'].includes(s)) {
      out.push({ label: 'Forward for approval', to: 'Scrutinised' })
      out.push({ label: 'Return with observations', to: 'Returned', remark: true, tone: 'danger' })
    }
    if (can(`${prefix}.approve`) && ['Submitted', 'Resubmitted', 'Scrutinised'].includes(s)) {
      out.push({ label: 'Approve & lock', to: 'Approved' })
      out.push({ label: 'Return for correction', to: 'Returned', remark: true, tone: 'danger' })
    }
    return out
  }

  const value = {
    programme, session, setSession, role, centre, user, db, fy, setFy, toasts,
    notify, add, update, transition, can, scope, centres, centreName, workflowActions,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
