import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import { auditApi } from '../api'
import { AUDIT_MODULES, AUDIT_PAGE_SIZE } from '../config/constants'
import { formatDateTime } from '../hooks'
import { toast } from '../lib/toast'
import { useAudit } from '../queries/audit'
import { ErrorNote } from './forms'
import { Badge, Modal } from './ui'

// The audit trail as a server-paged table with a detail view (old → new values). Used by the
// Audit trail page and, with a fixed filter, as an activity panel on sheet and centre pages.

const show = (v) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const roleLabel = { superadmin: 'Super Admin', pc: 'PCU', pi: 'Centre PI' }

/** "2 fields", "9 cells", or nothing, for the table's Changes column. */
const changeCount = (r) => {
  const fields = Object.keys(r.changes ?? {}).length
  const cells = r.cells?.length ?? 0
  return [fields && `${fields} field${fields === 1 ? '' : 's'}`, cells && `${cells} cell${cells === 1 ? '' : 's'}`].filter(Boolean).join(', ')
}

export function AuditTable({ filters = {}, compact = false, exportable = false }) {
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)
  const [exporting, setExporting] = useState(false)
  const params = { ...filters, page, limit: compact ? 10 : AUDIT_PAGE_SIZE }
  const audit = useAudit(params)
  const rows = audit.data?.data ?? []
  const meta = audit.data?.meta

  const exportFile = async () => {
    setExporting(true)
    try {
      await auditApi.exportFile(filters)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <ErrorNote error={audit.error} />
      {(exportable || audit.isFetching) && (
        <div className="toolbar">
          <span className="muted small row" style={{ gap: 6 }}>
            {audit.isFetching && <Loader2 size={13} className="spin" />}
            {meta ? `${meta.total} entr${meta.total === 1 ? 'y' : 'ies'}` : 'Loading…'}
          </span>
          <span className="grow" />
          {exportable && (
            <button className="btn ghost sm" onClick={exportFile} disabled={exporting || !meta?.total}>
              {exporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />} Export to Excel
            </button>
          )}
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th><th>Who</th>{!compact && <th>Role</th>}{!compact && <th>Centre</th>}
              {!compact && <th>Module</th>}<th>Action</th><th>Changes</th>{!compact && <th>IP address</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="click" onClick={() => setOpen(r)}>
                <td className="nowrap">{formatDateTime(r.createdAt)}</td>
                <td>{r.userName ?? <span className="muted">Unknown</span>}</td>
                {!compact && <td>{roleLabel[r.roleId] ?? '—'}</td>}
                {!compact && <td>{r.centreId ? r.centreId.name : '—'}</td>}
                {!compact && <td>{AUDIT_MODULES[r.module] ?? r.module}</td>}
                <td>
                  {r.action}
                  {r.source === 'excel' && <> <Badge tone="blue">Excel</Badge></>}
                  {/^Failed|refused/.test(r.action) && <> <Badge tone="red">Failed</Badge></>}
                </td>
                <td className="muted small nowrap">{changeCount(r) || '—'}</td>
                {!compact && <td className="mono small">{r.ip ?? '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <div className="empty">{audit.isPending ? 'Loading…' : 'No activity recorded.'}</div>}
      {meta && meta.pages > 1 && (
        <div className="table-foot">
          <span>{(meta.page - 1) * meta.limit + 1}–{Math.min(meta.total, meta.page * meta.limit)} of {meta.total}</span>
          <span className="row">
            <button className="icon-btn" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Newer"><ChevronLeft size={16} /></button>
            Page {meta.page} of {meta.pages}
            <button className="icon-btn" disabled={page >= meta.pages} onClick={() => setPage(page + 1)} aria-label="Older"><ChevronRight size={16} /></button>
          </span>
        </div>
      )}
      {open && <AuditDetail row={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function AuditDetail({ row, onClose }) {
  const fields = Object.entries(row.changes ?? {})
  return (
    <Modal title={row.action} subtitle={formatDateTime(row.createdAt)} wide onClose={onClose}
      footer={<button className="btn" onClick={onClose}>Close</button>}>
      <div className="stack">
        <div className="kv">
          <div><span>Who</span><b>{row.userName ?? 'Unknown'}</b></div>
          <div><span>Role</span><b>{roleLabel[row.roleId] ?? '—'}</b></div>
          <div><span>Centre</span><b>{row.centreId ? `${row.centreId.name} (${row.centreId.code})` : '—'}</b></div>
          <div><span>Module</span><b>{AUDIT_MODULES[row.module] ?? row.module}</b></div>
          <div><span>Source</span><b>{row.source === 'excel' ? 'Excel import' : row.source === 'form' ? 'Typed in' : '—'}</b></div>
          <div><span>IP address</span><b className="mono">{row.ip ?? '—'}</b></div>
        </div>
        {row.details?.email && <div className="note">Email tried: <b>{row.details.email}</b></div>}
        {fields.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
              <tbody>
                {fields.map(([field, c]) => (
                  <tr key={field}><td><b>{field}</b></td><td className="small" style={{ wordBreak: 'break-word' }}>{show(c.from)}</td><td className="small" style={{ wordBreak: 'break-word' }}>{show(c.to)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {row.cells?.length > 0 && (
          <div className="table-wrap" style={{ maxHeight: 320, overflow: 'auto' }}>
            <table>
              <thead><tr><th>Treatment</th><th>Rep</th><th>Parameter</th><th className="num">Before</th><th className="num">After</th></tr></thead>
              <tbody>
                {row.cells.map((c, i) => (
                  <tr key={i}>
                    <td><b>{c.treatmentCode}</b></td><td>{c.replication ? `R${c.replication}` : '—'}</td>
                    <td className="mono small">{c.parameterCode}</td><td className="num">{show(c.from)}</td><td className="num">{show(c.to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!fields.length && !row.cells?.length && <p className="muted small" style={{ margin: 0 }}>No field-level changes for this entry.</p>}
        <p className="muted small" style={{ margin: 0 }}>Reference: <span className="mono">{row.requestId}</span> (matches the server log)</p>
      </div>
    </Modal>
  )
}
