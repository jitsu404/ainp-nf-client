import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { useStore } from '../store'
import { ROLE_LIST, ROLES } from '../roles'

export default function Login() {
  const { programme, setSession, db } = useStore()
  const [roleId, setRoleId] = useState('pc')
  const [centreId, setCentreId] = useState(db.centres[0].id)
  const role = ROLES[roleId]

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
        <div className="address">
          <div><b>{programme.institute}</b>{programme.instituteHi}<br />{programme.place}</div>
          <div>{programme.unit}</div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">{programme.short}</span>
          <h2>Sign in</h2>
          <div className="field"><label>Role</label></div>
          <div className="role-grid">
            {ROLE_LIST.map((r) => (
              <button key={r.id} className={`role-card ${roleId === r.id ? 'on' : ''}`} onClick={() => setRoleId(r.id)}>
                <em>{r.level === programme.unit ? 'Coordinating Unit' : r.level}</em><b>{r.label}</b>
              </button>
            ))}
          </div>
          {role.scope === 'centre' && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Centre</label>
              <select value={centreId} onChange={(e) => setCentreId(e.target.value)}>
                {db.centres.map((c) => <option key={c.id} value={c.id}>{c.name} – {c.host}</option>)}
              </select>
            </div>
          )}
          <button className="btn" onClick={() => setSession({ roleId, centreId })}><LogIn size={16} /> Sign in</button>
        </div>
      </section>
    </div>
  )
}
