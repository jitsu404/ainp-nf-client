import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Card, ExportBar, FileLink, FormModal, KV, Modal, Page, Select, Table, Tabs, Workflow, useSearch, lakh } from '../components/ui'
import { PENDING } from '../data/calc'

export default function AucSoe() {
  const { db, fy, centre, centres, centreName, can, add, scope, programme } = useStore()
  const [tab, setTab] = useState('register')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [openId, setOpenId] = useState(null)
  const [form, setForm] = useState(false)
  const all = scope(db.aucs)
  const filtered = all.filter((a) => (!status || a.status === status) && (!type || a.type === type))
  const [rows, search] = useSearch(filtered, 'Search by reference or centre…')
  const open = db.aucs.find((a) => a.id === openId)
  const queue = all.filter((a) => (can('aucsoe.approve') ? a.status === 'Scrutinised' : can('aucsoe.review') ? ['Submitted', 'Resubmitted'].includes(a.status) : ['Draft', 'Returned'].includes(a.status)))
  const releases = scope(db.releases)

  const columns = [
    { label: 'Reference', key: 'ref' },
    { label: 'Type', render: (r) => <Badge tone={r.type === 'AUC' ? 'blue' : 'grey'}>{r.type}</Badge>, text: (r) => r.type },
    { label: 'Centre', render: (r) => centreName(r.centreId), text: (r) => centreName(r.centreId) },
    { label: 'Financial year', key: 'fy' },
    { label: 'Period', key: 'period' },
    { label: 'Amount', num: true, render: (r) => lakh(r.amount), text: (r) => r.amount },
    { label: 'Document', render: (r) => <FileLink name={r.file} />, text: (r) => r.file },
    { label: 'Status', render: (r) => <Badge>{r.status}</Badge>, text: (r) => r.status },
  ]

  // Expected submissions: AUC for the previous year and SoE for the first half of the current year.
  const [, fyPrev, fyCur] = programme.fys
  const expected = [{ type: 'AUC', fy: fyPrev, label: `AUC ${fyPrev}` }, { type: 'SoE', fy: fyCur, label: `SoE ${fyCur} (Apr–Sep)` }]
  const compliance = centres.map((c) => {
    const row = { id: c.id, name: c.name }
    expected.forEach((e) => { row[e.label] = db.aucs.find((a) => a.centreId === c.id && a.type === e.type && a.fy === e.fy)?.status || 'Not submitted' })
    return row
  })
  const compCols = [{ label: 'Centre', key: 'name' }, ...expected.map((e) => ({ label: e.label, render: (r) => <Badge>{r[e.label]}</Badge>, text: (r) => r[e.label] }))]

  return (
    <Page title="AUC / SoE Management"
      actions={can('aucsoe.enter') && <button className="btn" onClick={() => setForm(true)}><Upload size={15} /> Upload AUC / SoE</button>}>
      <Tabs value={tab} onChange={setTab} tabs={[['register', 'Register', all.length], ['queue', can('aucsoe.enter') ? 'Action required' : 'Scrutiny queue', queue.length], ['compliance', 'Pending / compliance statement']]} />

      {tab !== 'compliance' && (
        <Card pad={false}>
          {tab === 'register' && (
            <div className="toolbar">
              {search}
              <Select value={type} onChange={setType} options={['AUC', 'SoE']} all="All types" />
              <Select value={status} onChange={setStatus} options={['Draft', 'Submitted', 'Returned', 'Resubmitted', 'Scrutinised', 'Approved']} all="All statuses" />
              <span className="grow" /><ExportBar name="auc-soe-register" columns={columns} rows={rows} />
            </div>
          )}
          <Table columns={columns} rows={tab === 'register' ? rows : queue} onRow={(r) => setOpenId(r.id)} empty="Nothing is waiting in this queue." />
        </Card>
      )}

      {tab === 'compliance' && (
        <Card pad={false} title="Centre-wise submission status" actions={<ExportBar name="auc-soe-compliance" columns={compCols} rows={compliance} />}>
          <Table pageSize={20} columns={compCols} rows={compliance} />
          <div className="card-body muted small">
            {compliance.filter((r) => expected.some((e) => r[e.label] !== 'Approved')).length} of {compliance.length} centres have at least one document pending ·
            {' '}{all.filter((a) => PENDING.includes(a.status)).length} under scrutiny · {all.filter((a) => a.status === 'Returned').length} returned for correction
          </div>
        </Card>
      )}

      {open && (
        <Modal wide title={open.ref} subtitle={`${open.type === 'AUC' ? 'Annual Utilization Certificate' : 'Statement of Expenditure'} · ${centreName(open.centreId)}`} onClose={() => setOpenId(null)}>
          <KV items={[
            ['Financial year', open.fy], ['Period', open.period], ['Amount', lakh(open.amount)],
            ['Linked sanction / release', releases.find((r) => r.centreId === open.centreId && r.fy === open.fy)?.orderNo],
            ['Document', <FileLink name={open.file} />], ['Current status', <Badge>{open.status}</Badge>],
          ]} />
          <Workflow col="aucs" rec={open} prefix="aucsoe" />
        </Modal>
      )}

      {form && <FormModal title="Upload AUC / SoE" onClose={() => setForm(false)} submitLabel="Save as draft" initial={{ fy, type: 'SoE' }}
        fields={[
          { name: 'type', label: 'Document type', type: 'select', options: ['AUC', 'SoE'] },
          { name: 'fy', label: 'Financial year', type: 'select', options: programme.fys },
          { name: 'period', label: 'Period', type: 'select', options: ['Annual', 'April–September', 'October–March'] },
          { name: 'amount', label: 'Amount (₹ lakh)', type: 'number' },
          { name: 'release', label: 'Linked sanction / release order', type: 'select', full: true, options: releases.filter((r) => r.centreId === centre?.id).map((r) => r.orderNo) },
          { name: 'file', label: 'Signed document (PDF / Excel)', type: 'file', full: true },
        ]}
        onSubmit={(v) => add('aucs', { ...v, file: v.file || `${v.type}_${centre.code}_${v.fy}.pdf`, centreId: centre.id, ref: `${v.type}/${centre.code}/${v.fy}/${Date.now() % 1000}`, status: 'Draft', history: [{ status: 'Draft', at: new Date().toISOString().slice(0, 16).replace('T', ' '), by: 'You', remark: 'Uploaded' }] }, 'Saved as draft. The Nodal Officer / PI can now submit it.')} />}
    </Page>
  )
}
