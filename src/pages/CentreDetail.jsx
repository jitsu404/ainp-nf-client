import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Pencil, Power, UserPlus, UserRoundCog } from 'lucide-react'
import { useAuth } from '../auth'
import { AsyncFormModal, CredentialsModal, ErrorNote } from '../components/forms'
import { Badge, Card, Page, Table } from '../components/ui'
import { DEFAULT_PI_DESIGNATION, PASSWORD_RULE, ROUTES } from '../config/constants'
import { formatDate, formatDateTime } from '../hooks'
import { toast } from '../lib/toast'
import { useAssignCentrePi, useCentre, useCentrePis, useUpdateCentre } from '../queries/centres'
import { useDeactivateUser, useResetPassword, useUpdateUser } from '../queries/users'
import { centreFields } from './Centres'

const personFields = [
  { name: 'name', label: 'Full name', hint: 'e.g. Dr. A. K. Sharma' },
  { name: 'designation', label: 'Designation', required: false, hint: 'e.g. Chief Agronomist' },
  { name: 'email', label: 'Email (used to sign in)', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', required: false },
]

const tempPasswordField = {
  name: 'temporaryPassword',
  label: 'Temporary password',
  generate: true,
  full: true,
  hint: `${PASSWORD_RULE.text} They must change it at first sign-in.`,
}

const initials = (name) => name.replace(/^Dr\.?\s*/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function CentreDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const [modal, setModal] = useState(null) // which dialog is open
  const [credentials, setCredentials] = useState(null)

  const centre = useCentre(id)
  const pis = useCentrePis(id)
  const updateCentre = useUpdateCentre(id)
  const assignPi = useAssignCentrePi(id)
  const updateUser = useUpdateUser()
  const resetPassword = useResetPassword()
  const deactivateUser = useDeactivateUser()

  const c = centre.data
  const current = (pis.data ?? []).find((p) => p.isActive)
  const past = (pis.data ?? []).filter((p) => !p.isActive)
  const manage = can('centres.manage')
  const close = () => setModal(null)

  // 4xx errors (e.g. 404 for an unknown or out-of-scope centre) come back here; 5xx and network
  // failures go to the page's error boundary instead (lib/queryClient.js).
  if (centre.error) {
    return (
      <Page title="Centre">
        <div className="stack"><ErrorNote error={centre.error} /><Link to={ROUTES.centres} className="btn ghost">Back to centres</Link></div>
      </Page>
    )
  }
  if (!c) return <Page title="Centre"><p className="muted">Loading…</p></Page>

  return (
    <Page
      title={<span className="row" style={{ gap: 10 }}>{c.name} <Badge tone="blue">{c.code}</Badge><Badge>{c.isActive ? 'Active' : 'Inactive'}</Badge></span>}
      actions={<>
        <Link to={ROUTES.centres} className="btn ghost"><ArrowLeft size={15} /> Centres</Link>
        {manage && <button className="btn ghost" onClick={() => setModal('edit')}><Pencil size={15} /> Edit centre</button>}
        {manage && (
          <button className={`btn ${c.isActive ? 'danger' : 'ghost'}`} onClick={() => setModal('toggleCentre')}>
            <Power size={15} /> {c.isActive ? 'Deactivate centre' : 'Reactivate centre'}
          </button>
        )}
      </>}
    >
      <div className="stack">
        <div className="grid g2">
          <Card title="Centre information">
            <div className="kv two">
              <div><span>Host institution</span><b>{c.host}</b></div>
              <div><span>Host short name</span><b>{c.hostShort || '—'}</b></div>
              <div><span>Host type</span><b>{c.hostType || '—'}</b></div>
              <div><span>City</span><b>{c.city || '—'}</b></div>
              <div><span>State</span><b>{c.state}</b></div>
              <div><span>Pincode</span><b>{c.pincode || '—'}</b></div>
              <div><span>Agro-climatic zone</span><b>{c.zone || '—'}</b></div>
              <div><span>Centre type</span><b>{c.type}</b></div>
              <div><span>Added</span><b>{formatDate(c.createdAt)}</b></div>
            </div>
          </Card>

          <Card title="Centre PI"
            actions={manage && c.isActive && (
              <button className="btn sm" onClick={() => setModal('assign')}>
                <UserPlus size={14} /> {current ? 'Replace PI' : 'Assign PI'}
              </button>
            )}>
            <ErrorNote error={pis.error} />
            {current ? (
              <div className="stack" style={{ gap: 12 }}>
                <div className="pi-card">
                  <span className="avatar">{initials(current.name)}</span>
                  <div>
                    <b style={{ fontSize: 15 }}>{current.name}</b>
                    <div className="muted">{current.designation || 'Centre PI'}</div>
                    <div className="small" style={{ marginTop: 6 }}>{current.email}{current.phone && ` · ${current.phone}`}</div>
                    <div className="small muted">PI since {formatDate(current.createdAt)} · last sign-in {formatDateTime(current.lastLoginAt)}</div>
                    {current.mustChangePassword && <div style={{ marginTop: 6 }}><Badge tone="amber">Hasn’t signed in and set a password yet</Badge></div>}
                  </div>
                </div>
                {manage && (
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn ghost sm" onClick={() => setModal('editPi')}><UserRoundCog size={14} /> Edit details</button>
                    <button className="btn ghost sm" onClick={() => setModal('resetPi')}><KeyRound size={14} /> Reset password</button>
                    <button className="btn danger sm" onClick={() => setModal('removePi')}><Power size={14} /> Remove as PI</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty" style={{ padding: 18 }}>
                {pis.isPending ? 'Loading…' : c.isActive ? 'No Centre PI assigned. Assign the agronomist who will lead this centre.' : 'This centre is inactive.'}
              </div>
            )}
          </Card>
        </div>

        <Card title="Previous Centre PIs" pad={false}>
          <Table
            rows={past}
            empty="No previous PIs."
            columns={[
              { label: 'Name', render: (p) => <b style={{ fontWeight: 550 }}>{p.name}</b> },
              { label: 'Designation', render: (p) => p.designation || '—' },
              { label: 'Email', key: 'email' },
              { label: 'From', render: (p) => <span className="nowrap">{formatDate(p.createdAt)}</span> },
              { label: 'To', render: (p) => <span className="nowrap">{formatDate(p.deactivatedAt)}</span> },
              { label: 'Reason', render: (p) => p.deactivationReason || '—' },
            ]}
          />
        </Card>
      </div>

      {modal === 'edit' && (
        <AsyncFormModal
          title={`Edit ${c.name}`}
          fields={centreFields(true)}
          initial={{ code: c.code, name: c.name, host: c.host, hostShort: c.hostShort, hostType: c.hostType, city: c.city, state: c.state, pincode: c.pincode, zone: c.zone, type: c.type }}
          onSubmit={updateCentre.mutateAsync}
          onDone={() => toast.success('Centre updated')}
          onClose={close}
        />
      )}

      {modal === 'toggleCentre' && (
        <AsyncFormModal
          title={c.isActive ? `Deactivate ${c.name}?` : `Reactivate ${c.name}?`}
          intro={c.isActive && <div className="note warn">The centre is hidden from active lists. Its records and its PI’s account are kept; the PI can still sign in.</div>}
          fields={[]}
          submitLabel={c.isActive ? 'Deactivate centre' : 'Reactivate centre'}
          onSubmit={() => updateCentre.mutateAsync({ isActive: !c.isActive })}
          onDone={() => toast.success(c.isActive ? 'Centre deactivated' : 'Centre reactivated')}
          onClose={close}
        />
      )}

      {modal === 'assign' && (
        <AsyncFormModal
          title={current ? `Replace the Centre PI of ${c.name}` : `Assign a Centre PI to ${c.name}`}
          intro={current && (
            <div className="note warn">
              <b>{current.name}</b> will be removed as Centre PI and can no longer sign in. Their past work stays with the centre.
            </div>
          )}
          fields={[...personFields, tempPasswordField, ...(current ? [{ name: 'reason', label: 'Reason for replacing the current PI', type: 'textarea', hint: 'e.g. Transferred, retired, new PI nominated by the university' }] : [])]}
          initial={{ designation: DEFAULT_PI_DESIGNATION }}
          submitLabel={current ? 'Replace PI' : 'Assign PI'}
          onSubmit={assignPi.mutateAsync}
          onDone={(pi, body) => setCredentials({ name: pi.name, email: pi.email, password: body.temporaryPassword, title: 'Centre PI assigned' })}
          onClose={close}
        />
      )}

      {modal === 'editPi' && current && (
        <AsyncFormModal
          title={`Edit ${current.name}`}
          fields={personFields}
          initial={{ name: current.name, designation: current.designation, email: current.email, phone: current.phone }}
          onSubmit={(body) => updateUser.mutateAsync({ id: current.id, ...body })}
          onDone={() => toast.success('PI details updated')}
          onClose={close}
        />
      )}

      {modal === 'resetPi' && current && (
        <AsyncFormModal
          title={`Reset password for ${current.name}`}
          intro={<p className="muted">They’ll be signed out everywhere and must choose a new password at their next sign-in.</p>}
          fields={[tempPasswordField]}
          submitLabel="Reset password"
          onSubmit={(body) => resetPassword.mutateAsync({ id: current.id, ...body })}
          onDone={(_r, body) => setCredentials({ name: current.name, email: current.email, password: body.temporaryPassword, title: 'Password reset' })}
          onClose={close}
        />
      )}

      {modal === 'removePi' && current && (
        <AsyncFormModal
          title={`Remove ${current.name} as Centre PI?`}
          intro={<div className="note warn">Their account is deactivated and they can no longer sign in. The centre will have no PI until you assign one.</div>}
          fields={[{ name: 'reason', label: 'Reason', type: 'textarea' }]}
          submitLabel="Remove PI"
          onSubmit={(body) => deactivateUser.mutateAsync({ id: current.id, reason: body.reason })}
          onDone={() => toast.success('Centre PI removed')}
          onClose={close}
        />
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </Page>
  )
}
