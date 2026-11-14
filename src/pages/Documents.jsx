import { useState } from 'react'
import { Upload, FileText, Download } from 'lucide-react'
import { useStore, today } from '../store'
import { Badge, Card, FormModal, Page, Select, Table, useSearch, fmtDate } from '../components/ui'
import { countBy } from '../data/calc'

const CATEGORIES = ['Technical Programme', 'Sanctions & Orders', 'Fund Release Letters', 'AUC / SoE', 'Reports', 'Staff Orders', 'Proceedings', 'Guidelines', 'Other']
const ACCESS = ['All centres', 'Centre + Coordinating Unit', 'Coordinating Unit only']

export default function Documents() {
  const { db, centre, centreName, can, add, programme, user, notify, role } = useStore()
  const [cat, setCat] = useState('')
  const [fy, setFy] = useState('')
  const [cid, setCid] = useState('')
  const [form, setForm] = useState(false)
  // Role-based access: centres see their own and common documents; unit-only documents stay with the Coordinating Unit.
  const visible = db.documents.filter((d) => (centre ? (!d.centreId || d.centreId === centre.id) && d.access !== 'Coordinating Unit only' : true))
  const filtered = visible.filter((d) => (!cat || d.category === cat) && (!fy || d.fy === fy) && (!cid || d.centreId === cid))
  const [rows, search] = useSearch(filtered, 'Search documents by title or file name…')
  const counts = countBy(visible, 'category')

  return (
    <Page title="Document Repository"
      actions={can('docs.upload') && <button className="btn" onClick={() => setForm(true)}><Upload size={15} /> Upload document</button>}>
      <div className="row" style={{ marginBottom: 14, gap: 6 }}>
        <button className={`btn sm ${cat ? 'ghost' : ''}`} onClick={() => setCat('')}>All {visible.length}</button>
        {CATEGORIES.filter((c) => counts[c]).map((c) => <button key={c} className={`btn sm ${cat === c ? '' : 'ghost'}`} onClick={() => setCat(c)}>{c} {counts[c]}</button>)}
      </div>
      <Card pad={false}>
        <div className="toolbar">
          {search}
          <Select value={fy} onChange={setFy} options={programme.fys} all="All years" />
          {!centre && <Select value={cid} onChange={setCid} options={db.centres.map((c) => [c.id, c.name])} all="All centres" />}
          <span className="grow" /><span className="muted small">Signed in as {role.label}: showing {rows.length} of {db.documents.length} documents</span>
        </div>
        <Table pageSize={10} columns={[
          { label: 'Document', render: (r) => <span className="row" style={{ flexWrap: 'nowrap' }}><FileText size={16} color="var(--brand)" /><span><b style={{ fontWeight: 550 }}>{r.title}</b><div className="muted small">{r.file} · {r.size}</div></span></span> },
          { label: 'Category', render: (r) => <span className="chip">{r.category}</span> },
          { label: 'Year', key: 'fy' },
          { label: 'Centre', render: (r) => (r.centreId ? centreName(r.centreId) : 'All / common') },
          { label: 'Access', render: (r) => <Badge tone={r.access === 'All centres' ? 'green' : r.access === 'Coordinating Unit only' ? 'red' : 'blue'}>{r.access}</Badge> },
          { label: 'Uploaded', render: (r) => <>{fmtDate(r.date)}<div className="muted small">{r.uploadedBy}</div></> },
          { label: '', render: (r) => <button className="icon-btn" aria-label="Download" onClick={() => notify(`${r.file}: download is available in the full build`)}><Download size={16} /></button> },
        ]} rows={rows} />
      </Card>

      {form && <FormModal title="Upload document" onClose={() => setForm(false)} submitLabel="Upload" initial={{ fy: programme.currentFy, access: centre ? ACCESS[1] : ACCESS[0] }}
        fields={[
          { name: 'title', label: 'Title', full: true }, { name: 'category', label: 'Category', type: 'select', options: CATEGORIES },
          { name: 'fy', label: 'Financial year', type: 'select', options: programme.fys },
          ...(centre ? [] : [{ name: 'centreId', label: 'Centre (blank for common)', type: 'select', options: db.centres.map((c) => [c.id, c.name]), required: false }]),
          { name: 'access', label: 'Access', type: 'select', options: centre ? ACCESS.slice(0, 2) : ACCESS },
          { name: 'file', label: 'File (PDF, image, Word, Excel)', type: 'file', full: true },
        ]}
        onSubmit={(v) => add('documents', { ...v, centreId: centre?.id || v.centreId || null, file: v.file || 'Document.pdf', size: '0.8 MB', uploadedBy: user.name, date: today() }, 'Document uploaded and tagged')} />}
    </Page>
  )
}
