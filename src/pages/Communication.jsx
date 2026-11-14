import { useState } from 'react'
import { Send, MailCheck } from 'lucide-react'
import { useStore, today } from '../store'
import { Badge, Card, FileLink, FormModal, KV, Modal, Page, Progress, Select, Table, Tabs, useSearch, fmtDate } from '../components/ui'
import { isOverdue } from '../data/calc'

const TYPES = ['Circular', 'Letter', 'Guideline', 'Reminder', 'Meeting Notice']

export default function Communication() {
  const { db, centre, can, add, update, centreName, programme, user } = useStore()
  const [tab, setTab] = useState('all')
  const [type, setType] = useState('')
  const [openId, setOpenId] = useState(null)
  const [form, setForm] = useState(false)
  const [reply, setReply] = useState('')

  const recipients = (m) => (m.to === 'all' ? db.centres : db.centres.filter((c) => m.to.includes(c.id)))
  const stateOf = (m, cid) => { const a = m.acks[cid]; return a?.reply ? 'Replied' : a?.ackOn ? 'Acknowledged' : a?.readOn ? 'Read' : 'Not opened' }
  const mine = db.comms.filter((m) => !centre || m.to === 'all' || m.to.includes(centre.id))
  const pendingRows = mine.filter((m) => (centre ? !m.acks[centre.id]?.ackOn : recipients(m).some((c) => !m.acks[c.id]?.ackOn)))
  const list = (tab === 'pending' ? pendingRows : mine).filter((m) => !type || m.type === type)
  const [rows, search] = useSearch(list, 'Search the communication archive…')
  const open = db.comms.find((m) => m.id === openId)
  const ackRate = (m) => (recipients(m).filter((c) => m.acks[c.id]?.ackOn).length / recipients(m).length) * 100

  const acknowledge = (m, withReply) => {
    update('comms', m.id, (r) => ({ acks: { ...r.acks, [centre.id]: { readOn: today(), ackOn: today(), reply: withReply ? reply : r.acks[centre.id]?.reply, attachment: withReply ? `Reply_${centre.code}.pdf` : null } } }), withReply ? 'Reply submitted' : 'Acknowledged')
    setReply('')
  }

  return (
    <Page title="Communication & Correspondence"
      actions={can('comm.issue') && <button className="btn" onClick={() => setForm(true)}><Send size={15} /> Issue communication</button>}>
      <Tabs value={tab} onChange={setTab} tabs={[['all', centre ? 'Received' : 'Issued', mine.length], ['pending', centre ? 'To acknowledge' : 'Awaiting acknowledgement', pendingRows.length]]} />
      <Card pad={false}>
        <div className="toolbar">{search}<Select value={type} onChange={setType} options={TYPES} all="All types" /></div>
        <Table onRow={(r) => setOpenId(r.id)} columns={[
          { label: 'Reference', key: 'refNo' },
          { label: 'Type', render: (r) => <Badge tone={r.type === 'Reminder' ? 'amber' : 'blue'}>{r.type}</Badge> },
          { label: 'Subject', render: (r) => <b style={{ fontWeight: 550 }}>{r.subject}</b> },
          { label: 'Issued', render: (r) => fmtDate(r.date) },
          { label: 'Reply due', render: (r) => (r.due ? <span style={{ color: isOverdue(r.due) ? 'var(--red)' : undefined }}>{fmtDate(r.due)}</span> : '—') },
          centre
            ? { label: 'My status', render: (r) => <Badge>{stateOf(r, centre.id)}</Badge> }
            : { label: 'Acknowledged', render: (r) => <Progress value={ackRate(r)} /> },
        ]} rows={rows} />
      </Card>

      {open && (
        <Modal wide title={open.subject} subtitle={`${open.type} · ${open.refNo}`} onClose={() => setOpenId(null)}>
          <KV items={[['Issued by', open.issuedBy], ['Date', fmtDate(open.date)], ['Reply due', fmtDate(open.due)], ['Sent to', open.to === 'all' ? 'All centres' : `${open.to.length} centres`], ['Attachment', <FileLink name={open.attachment} />], ['E-mail alert', open.emailAlert ? 'Sent' : 'Not configured']]} />
          <div className="note">{open.body}</div>
          {centre ? (
            <>
              <div className="row"><span className="muted">My status:</span><Badge>{stateOf(open, centre.id)}</Badge>
                {open.acks[centre.id]?.reply && <span className="muted">Reply: “{open.acks[centre.id].reply}”</span>}</div>
              {can('comm.ack') && !open.acks[centre.id]?.reply && (
                <>
                  <div className="field"><label>Reply (optional)</label><textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply and attach supporting documents" /></div>
                  <div className="field"><label>Attachment</label><input type="file" /></div>
                  <div className="row">
                    {!open.acks[centre.id]?.ackOn && <button className="btn ghost" onClick={() => acknowledge(open, false)}><MailCheck size={15} /> Acknowledge receipt</button>}
                    <button className="btn" disabled={!reply.trim()} onClick={() => acknowledge(open, true)}><Send size={15} /> Submit reply</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Card pad={false} title="Centre-wise acknowledgement and reply status" actions={can('comm.issue') && <button className="btn ghost sm" onClick={() => add('comms', { ...open, id: undefined, type: 'Reminder', subject: `Reminder: ${open.subject}`, date: today(), refNo: `${open.refNo}/R`, acks: {}, to: recipients(open).filter((c) => !open.acks[c.id]?.ackOn).map((c) => c.id), issuedBy: user.name }, 'Reminder issued to centres that have not acknowledged')}>Send reminder to pending centres</button>}>
              <Table pageSize={6} columns={[
                { label: 'Centre', key: 'name' },
                { label: 'Status', render: (c) => <Badge>{stateOf(open, c.id)}</Badge> },
                { label: 'Read on', render: (c) => fmtDate(open.acks[c.id]?.readOn) },
                { label: 'Acknowledged on', render: (c) => fmtDate(open.acks[c.id]?.ackOn) },
                { label: 'Reply', render: (c) => open.acks[c.id]?.reply || '—' },
                { label: 'Attachment', render: (c) => <FileLink name={open.acks[c.id]?.attachment} /> },
              ]} rows={recipients(open)} />
            </Card>
          )}
        </Modal>
      )}

      {form && <FormModal title="Issue communication" onClose={() => setForm(false)} submitLabel="Issue to centres" initial={{ type: 'Circular', to: 'all', date: today(), emailAlert: 'Yes' }}
        fields={[
          { name: 'type', label: 'Type', type: 'select', options: TYPES },
          { name: 'to', label: 'Send to', type: 'select', options: [['all', 'All centres'], ...db.centres.map((c) => [c.id, `${c.name} only`])] },
          { name: 'subject', label: 'Subject', full: true },
          { name: 'body', label: 'Message', type: 'textarea' },
          { name: 'date', label: 'Date of issue', type: 'date' },
          { name: 'due', label: 'Reply due by', type: 'date', required: false },
          { name: 'attachment', label: 'Attachment', type: 'file' },
          { name: 'emailAlert', label: 'E-mail alert', type: 'select', options: ['Yes', 'No'] },
        ]}
        onSubmit={(v) => add('comms', { ...v, to: v.to === 'all' ? 'all' : [v.to], due: v.due || null, attachment: v.attachment || null, emailAlert: v.emailAlert === 'Yes', acks: {}, issuedBy: user.name, refNo: `${programme.fileNo}/Comm/${programme.currentFy}/${String(db.comms.length + 1).padStart(3, '0')}` }, 'Communication issued and centres notified')} />}
    </Page>
  )
}
