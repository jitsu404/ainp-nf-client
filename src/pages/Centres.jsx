import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { centresApi } from '../api'
import { useAuth } from '../auth'
import { AsyncFormModal, ErrorNote } from '../components/forms'
import { Badge, Card, Page, Select, Table } from '../components/ui'
import { useDebounced, useLoad } from '../hooks'
import { programme } from '../programme/config'

export const HOST_TYPES = ['SAU', 'ICAR', 'CAU', 'Deemed University', 'Other']

/** Fields shared by "Add centre" and "Edit centre". */
export const centreFields = (isEdit) => [
  { name: 'code', label: 'Centre code', hint: '2–10 letters, unique. Stored in capitals.', required: !isEdit },
  { name: 'name', label: 'Centre (location) name' },
  { name: 'host', label: 'Host institution', full: true },
  { name: 'hostShort', label: 'Host short name', required: false },
  { name: 'hostType', label: 'Host type', type: 'select', options: HOST_TYPES, required: false },
  { name: 'city', label: 'City', required: false },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode', required: false },
  { name: 'zone', label: 'Agro-climatic zone', required: false },
  { name: 'type', label: 'Centre type', type: 'select', options: programme.centreTypes },
]

export default function Centres() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('true')
  const [adding, setAdding] = useState(false)
  const q = useDebounced(search)

  const centres = useLoad(() => centresApi.list({ limit: 100, sort: 'name', search: q, isActive: status }), [q, status])
  const rows = centres.data ?? []

  return (
    <Page title="Centres & Centre PIs"
      actions={can('centres.manage') && <button className="btn" onClick={() => setAdding(true)}><Plus size={15} /> Add centre</button>}>
      <div className="stack">
        <ErrorNote error={centres.error} />
        <Card pad={false}>
          <div className="toolbar">
            <label className="search"><Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, code, host, city or state…" />
            </label>
            <Select value={status} onChange={setStatus} options={[['true', 'Active centres'], ['false', 'Inactive centres']]} all="All centres" />
            <span className="grow" />
            <span className="muted small">{centres.loading ? 'Loading…' : `${rows.length} centre${rows.length === 1 ? '' : 's'}`}</span>
          </div>
          <Table
            rows={rows}
            pageSize={12}
            onRow={(c) => navigate(`/centres/${c.id}`)}
            empty={centres.loading ? 'Loading…' : 'No centres match.'}
            columns={[
              { label: 'Code', key: 'code' },
              { label: 'Centre', render: (c) => <b style={{ fontWeight: 550 }}>{c.name}</b> },
              { label: 'Host', render: (c) => <span title={c.host}>{c.hostShort || c.host}</span> },
              { label: 'State', key: 'state' },
              { label: 'Zone', render: (c) => c.zone || '—' },
              { label: 'Centre PI', render: (c) => (c.currentPi ? c.currentPi.name : <Badge tone="amber">Not assigned</Badge>) },
              { label: 'Status', render: (c) => <Badge>{c.isActive ? 'Active' : 'Inactive'}</Badge> },
            ]}
          />
        </Card>
      </div>

      {adding && (
        <AsyncFormModal
          title="Add centre"
          fields={centreFields(false)}
          initial={{ type: programme.centreTypes[0] }}
          submitLabel="Add centre"
          onSubmit={async (body) => (await centresApi.create(body)).data}
          onDone={(centre) => navigate(`/centres/${centre.id}`)}
          onClose={() => setAdding(false)}
        />
      )}
    </Page>
  )
}
