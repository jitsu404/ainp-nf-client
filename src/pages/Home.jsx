import { Link, useNavigate } from 'react-router-dom'
import { Building2, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '../auth'
import { ErrorNote } from '../components/forms'
import { Badge, Card, Page, Stat, Table } from '../components/ui'
import { ROUTES, TABLE_PAGE_SIZE } from '../config/constants'
import { useCentres } from '../queries/centres'
import { useUsers } from '../queries/users'

export default function Home() {
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
