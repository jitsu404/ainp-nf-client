import { Link, useNavigate } from 'react-router-dom'
import { Building2, CalendarClock, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '../auth'
import { ErrorNote } from '../components/forms'
import { Badge, Card, Page, Stat, Table } from '../components/ui'
import { ROUTES, TABLE_PAGE_SIZE } from '../config/constants'
import { formatDate, formatDateTime } from '../hooks'
import { useCentre, useCentres } from '../queries/centres'
import { useUsers } from '../queries/users'

/**
 * The dashboard depends on what the signed-in user can do, never on their role name:
 * - can manage centres (Super Admin, PCU) → programme-wide centre coverage
 * - centre-scoped user (Centre PI) → their own centre
 * - anyone else → a plain welcome until their modules exist
 */
export default function Home() {
  const auth = useAuth()
  if (auth.can('centres.manage')) return <CoverageDashboard />
  if (auth.role.scope === 'centre') return <CentreDashboard />
  return <Page title={`Welcome, ${auth.user.name}`}><p className="muted">Your modules will appear here as they are enabled.</p></Page>
}

/** Super Admin / PCU: which centres are active and which still need a Centre PI. */
function CoverageDashboard() {
  const auth = useAuth()
  const navigate = useNavigate()
  const managesPcu = auth.assignable.some((r) => r.id === 'pc')

  // All centres (active and inactive) in one request; the counts are derived from it.
  const centres = useCentres()
  const pcu = useUsers({ roleId: 'pc', isActive: true, limit: 1 }, { enabled: managesPcu })

  const rows = centres.data?.data ?? []
  const active = rows.filter((c) => c.isActive)
  const withoutPi = active.filter((c) => !c.currentPi)
  const loading = centres.isPending

  return (
    <Page title={`Welcome, ${auth.user.name}`}>
      <div className="stack">
        <ErrorNote error={centres.error} />
        <div className="grid g4">
          <Stat icon={Building2} label="Active centres" value={loading ? '…' : active.length} hint={`${rows.length - active.length} inactive`} />
          <Stat icon={UserCheck} label="Centres with a PI" value={loading ? '…' : active.length - withoutPi.length} />
          <Stat icon={UserX} label="Centres without a PI" value={loading ? '…' : withoutPi.length} hint={withoutPi.length ? 'Assign one from the centre page' : 'All centres covered'} />
          {managesPcu && <Stat icon={ShieldCheck} label="Active PCU accounts" value={pcu.isPending ? '…' : pcu.data?.meta?.total ?? 0} />}
        </div>

        <Card title="Centres without a Centre PI" pad={false}
          actions={<Link className="btn ghost sm" to={ROUTES.centres}>All centres</Link>}>
          <Table
            rows={withoutPi}
            pageSize={TABLE_PAGE_SIZE}
            onRow={(c) => navigate(ROUTES.centre(c.id))}
            empty={loading ? 'Loading…' : 'Every active centre has a Centre PI.'}
            columns={[
              { label: 'Code', key: 'code' },
              { label: 'Centre', render: (c) => <b style={{ fontWeight: 550 }}>{c.name}</b> },
              { label: 'Host institution', render: (c) => c.hostShort || c.host },
              { label: 'State', key: 'state' },
              { label: 'Centre PI', render: () => <Badge tone="amber">Not assigned</Badge> },
            ]}
          />
        </Card>
      </div>
    </Page>
  )
}

/** Centre PI: their own centre and their role. The API only ever returns their centre. */
function CentreDashboard() {
  const { user, role } = useAuth()
  const centre = useCentre(user.centreId)
  const c = centre.data

  return (
    <Page title={`Welcome, ${user.name}`}>
      <div className="stack">
        <ErrorNote error={centre.error} />
        {!user.centreId && <div className="note warn">Your account isn’t linked to a centre. Please contact the PCU.</div>}
        <div className="grid g2">
          <Card title="Your centre">
            {!c ? (
              <p className="muted">{centre.isPending && user.centreId ? 'Loading…' : '—'}</p>
            ) : (
              <div className="stack" style={{ gap: 12 }}>
                <div className="row" style={{ gap: 10 }}>
                  <b style={{ fontSize: 17 }}>{c.name}</b>
                  <Badge tone="blue">{c.code}</Badge>
                  <Badge>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="kv two">
                  <div><span>Host institution</span><b>{c.host}</b></div>
                  <div><span>Host type</span><b>{c.hostType || '—'}</b></div>
                  <div><span>City / State</span><b>{[c.city, c.state].filter(Boolean).join(', ')}</b></div>
                  <div><span>Agro-climatic zone</span><b>{c.zone || '—'}</b></div>
                  <div><span>Centre type</span><b>{c.type}</b></div>
                  <div><span>Pincode</span><b>{c.pincode || '—'}</b></div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Your role">
            <div className="kv" style={{ gridTemplateColumns: '1fr' }}>
              <div><span>Role</span><b>{role.label}{user.designation ? ` · ${user.designation}` : ''}</b></div>
              <div><span>PI of this centre since</span><b>{formatDate(user.createdAt)}</b></div>
              <div><span>Last sign-in</span><b>{formatDateTime(user.lastLoginAt)}</b></div>
            </div>
          </Card>
        </div>

        <Card title="Coming next">
          <div className="row" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <CalendarClock size={18} color="var(--muted)" style={{ flex: 'none', marginTop: 2 }} />
            <p className="muted">
              Research data entry, experiments, expenditure and AUC/SoE submission for your centre will appear here as each module is enabled by the PCU.
            </p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
