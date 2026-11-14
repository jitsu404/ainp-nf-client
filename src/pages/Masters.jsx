import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Card, FormModal, Page, Table, Tabs, useSearch } from '../components/ui'
import { ROLE_LIST } from '../roles'
import { researchMasters } from '../programme/research'

export default function Masters() {
  const { db, can, programme, notify, fy } = useStore()
  const [tab, setTab] = useState('centres')
  const [form, setForm] = useState(false)
  const [rows, search] = useSearch(db.centres, 'Search centres…')
  const edit = can('masters.edit')
  // Centres are created and edited only by the PCU and the Super Administrator.
  const editCentres = can('centres.manage')
  const extra = researchMasters(db)

  return (
    <Page title="Masters"
      actions={!edit && !editCentres && <Badge tone="grey">View only for your role</Badge>}>
      <Tabs value={tab} onChange={setTab} tabs={[['centres', 'Centres', db.centres.length], ['years', 'Financial years'], ['scheme', 'Scheme & budget heads'], ['roles', 'Roles'], ...extra.map((m) => [m.id, m.label, m.rows.length])]} />

      {tab === 'centres' && (
        <Card pad={false}>
          <div className="toolbar">{search}<span className="grow" />{editCentres && <button className="btn sm" onClick={() => setForm(true)}><Plus size={14} /> Add centre</button>}</div>
          <Table pageSize={10} columns={[
            { label: 'Code', key: 'code' }, { label: 'Centre', render: (r) => <b style={{ fontWeight: 550 }}>{r.name}</b> }, { label: 'Host institution', key: 'host' },
            { label: 'State', key: 'state' }, { label: 'Type', render: (r) => <Badge tone="blue">{r.type}</Badge> },
            { label: 'Users', render: (r) => db.users.filter((u) => u.centreId === r.id).length }, { label: 'Status', render: () => <Badge>Active</Badge> },
          ]} rows={rows} />
        </Card>
      )}
      {tab === 'years' && (
        <Card pad={false}>
          <Table columns={[
            { label: 'Financial year', key: 'fy' }, { label: 'Period', key: 'period' },
            { label: 'Data entry', render: (r) => <Badge tone={r.open ? 'green' : 'grey'}>{r.open ? 'Open' : 'Closed & locked'}</Badge> },
            { label: 'Selected', render: (r) => (r.fy === fy ? <Badge tone="blue">In view</Badge> : '—') },
          ]} rows={programme.fys.map((y, i) => ({ id: y, fy: y, period: `1 April ${y.slice(0, 4)} – 31 March 20${y.slice(5)}`, open: i > 0 }))} />
        </Card>
      )}
      {tab === 'scheme' && (
        <div className="grid g2">
          <Card title="Scheme">
            <div className="stack" style={{ gap: 8 }}>
              <div><span className="muted small">Scheme</span><div><b>{programme.name}</b></div></div>
              <div><span className="muted small">Short name</span><div>{programme.short}</div></div>
              <div><span className="muted small">Coordinating institute</span><div>{programme.institute}, {programme.place}</div></div>
              <div><span className="muted small">File number prefix</span><div>{programme.fileNo}</div></div>
            </div>
          </Card>
          <Card title="Budget heads" pad={false}>
            <Table columns={[{ label: '#', key: 'n' }, { label: 'Budget head', key: 'head' }, { label: 'Status', render: () => <Badge>Active</Badge> }]}
              rows={programme.budgetHeads.map((head, i) => ({ id: head, n: i + 1, head }))} />
          </Card>
        </div>
      )}
      {tab === 'roles' && (
        <Card pad={false}>
          <Table columns={[
            { label: 'Role', render: (r) => <b style={{ fontWeight: 550 }}>{r.label}</b> }, { label: 'Level', render: (r) => <Badge tone={r.scope === 'centre' ? 'blue' : 'green'}>{r.level}</Badge> },
            { label: 'Responsibility', key: 'about' }, { label: 'Modules', render: (r) => r.modules.length }, { label: 'Users', render: (r) => db.users.filter((u) => u.roleId === r.id).length },
          ]} rows={ROLE_LIST} />
        </Card>
      )}
      {extra.filter((m) => m.id === tab).map((m) => (
        <Card key={m.id} pad={false} title={m.label} actions={edit && <button className="btn sm" onClick={() => notify('Master values are editable by the Administrator in the full build')}><Plus size={14} /> Add</button>}>
          <Table pageSize={12} columns={m.columns} rows={m.rows} />
        </Card>
      ))}

      {form && <FormModal title="Add centre" onClose={() => setForm(false)}
        fields={[{ name: 'code', label: 'Centre code' }, { name: 'name', label: 'Centre name' }, { name: 'host', label: 'Host institution', full: true }, { name: 'state', label: 'State' }, { name: 'type', label: 'Type', type: 'select', options: programme.centreTypes }]}
        onSubmit={() => notify('Centre saved. New centres appear across modules in the full build.')} />}
    </Page>
  )
}
