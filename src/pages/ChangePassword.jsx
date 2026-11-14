import { useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from '../auth'
import { ErrorNote } from '../components/forms'
import { Card, Page } from '../components/ui'
import { programme } from '../programme/config'

const RULE = 'At least 10 characters, with a letter and a digit.'
const meetsRule = (p) => p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p)

function PasswordForm({ onDone }) {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const mismatch = confirm && next !== confirm
  const ready = current && meetsRule(next) && next === confirm

  const submit = async (e) => {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setError(null)
    try {
      await changePassword(current, next)
      setCurrent(''); setNext(''); setConfirm('')
      onDone?.()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack" noValidate>
      <ErrorNote error={error} />
      <div className="field">
        <label htmlFor="current">Current password</label>
        <input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="next">New password</label>
        <input id="next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <span className={`small ${next && !meetsRule(next) ? 'field-error' : 'muted'}`}>{RULE}</span>
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm new password</label>
        <input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {mismatch && <span className="field-error">The passwords don’t match</span>}
      </div>
      <button className="btn" type="submit" disabled={!ready || busy}>
        {busy ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />} Change password
      </button>
    </form>
  )
}

/** Full-screen step shown after signing in with a temporary password. */
export function ForcedPasswordChange() {
  const { user, logout } = useAuth()
  return (
    <div className="login">
      <section className="login-hero">
        <div>
          <div className="logos">
            <img src="/logos/icar.png" alt="ICAR logo" />
            <img src="/logos/iifsr.png" alt="ICAR-IIFSR logo" />
          </div>
          <h1>{programme.short}<br />{programme.system}</h1>
          <p className="scheme">{programme.name}</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">Welcome, {user.name}</span>
          <h2>Choose your password</h2>
          <p className="muted" style={{ marginBottom: 14 }}>You signed in with a temporary password. Choose your own to continue.</p>
          <PasswordForm />
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={logout}>Sign out</button>
        </div>
      </section>
    </div>
  )
}

/** "My account" page, for changing the password at any time. */
export default function AccountPage({ onChanged }) {
  const { user, role } = useAuth()
  const [done, setDone] = useState(false)
  return (
    <Page title="My account">
      <div className="grid g2">
        <Card title="Profile">
          <div className="kv" style={{ gridTemplateColumns: '1fr' }}>
            <div><span>Name</span><b>{user.name}</b></div>
            <div><span>Email</span><b>{user.email}</b></div>
            <div><span>Role</span><b>{role.label}</b></div>
            {user.designation && <div><span>Designation</span><b>{user.designation}</b></div>}
          </div>
        </Card>
        <Card title="Change password">
          {done && <div className="note" style={{ marginBottom: 12 }}>Password changed. Other devices have been signed out.</div>}
          <PasswordForm onDone={() => { setDone(true); onChanged?.() }} />
        </Card>
      </div>
    </Page>
  )
}
