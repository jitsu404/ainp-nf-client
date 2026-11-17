import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Loader2, Save, Send, Undo2 } from 'lucide-react'
import { sheetsApi } from '../api'
import { useAuth } from '../auth'
import { AuditTable } from '../components/AuditTrail'
import { ExcelImportModal } from '../components/ExcelImport'
import { ErrorNote, SaveModal } from '../components/forms'
import { Badge, Card, Page, Tabs } from '../components/ui'
import { ROUTES } from '../config/constants'
import { formatDateTime } from '../hooks'
import { toast } from '../lib/toast'
import { useFinancialYears, useMasterOptions, useUnitLabel } from '../queries/masters'
import { useImportSheet, useSaveSheetValues, useSheet, useSheetAnalysis, useSheetTransition, useTrial } from '../queries/research'

// An observation sheet: one trial × year × season. Values are entered in a grid (or through the
// Excel template), saved in batches, then submitted to the PCU for approval.
//
// Plot-level parameters get one value per treatment × replication; treatment-level parameters
// (and every parameter in unreplicated designs) one value per treatment.

const EDITABLE = ['Draft', 'Returned']
const cellKey = (treatmentCode, replication, parameterId) => `${treatmentCode}|${replication ?? ''}|${parameterId}`

/** Turns what was typed into the value the API expects (null clears the cell). */
const toApiValue = (param, raw) => {
  const text = String(raw ?? '').trim()
  if (text === '') return null
  if (param.dataType === 'number') {
    const n = Number(text)
    return Number.isFinite(n) ? n : text // the API reports non-numbers per cell
  }
  return text
}

export default function SheetDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const [tab, setTab] = useState('data')
  const [modal, setModal] = useState(null) // 'import' | 'submit' | 'return' | 'approve'
  const sheet = useSheet(id)
  const s = sheet.data
  const trial = useTrial(s?.trialId)
  const years = useFinancialYears()
  const seasons = useMasterOptions('season')
  const crops = useMasterOptions('crop')
  const importer = useImportSheet(id)

  // Unsaved edits: cell key → text as typed. Invalid cells: key → the API's message.
  const [edits, setEdits] = useState(() => new Map())
  const [invalid, setInvalid] = useState(() => new Map())
  const saveValues = useSaveSheetValues(id)
  const dirty = edits.size > 0

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const stored = useMemo(
    () => new Map((s?.values ?? []).map((v) => [cellKey(v.treatmentCode, v.replication, v.parameterId), v.value])),
    [s?.values],
  )

  if (sheet.error) {
    return (
      <Page title="Observation sheet">
        <div className="stack"><ErrorNote error={sheet.error} /><Link to={ROUTES.sheets} className="btn ghost">Back to sheets</Link></div>
      </Page>
    )
  }
  if (!s) return <Page title="Observation sheet"><p className="muted">Loading…</p></Page>

  const e = s.experiment
  const yearOpen = years.data?.find((y) => y.code === s.fyCode)?.isOpen !== false
  const editable = EDITABLE.includes(s.status) && can('research.enter') && yearOpen
  const replicated = Boolean(e.replications)
  const plotParams = e.parameters.filter((p) => p.level === 'plot' && replicated)
  const treatmentParams = e.parameters.filter((p) => !(p.level === 'plot' && replicated))
  const centre = trial.data?.centreId
  const system = trial.data?.croppingSystems.find((c) => c.code === s.croppingSystemCode)

  const valueOf = (key) => (edits.has(key) ? edits.get(key) : stored.get(key) ?? '')
  const change = (key, raw) => {
    setEdits((m) => {
      const next = new Map(m)
      // Typing the stored value back counts as no change.
      if (String(stored.get(key) ?? '') === String(raw)) next.delete(key)
      else next.set(key, raw)
      return next
    })
    setInvalid((m) => { if (!m.has(key)) return m; const next = new Map(m); next.delete(key); return next })
  }

  const save = async () => {
    const params = new Map(e.parameters.map((p) => [p.parameterId, p]))
    const keys = [...edits.keys()]
    const cells = keys.map((key) => {
      const [treatmentCode, rep, parameterId] = key.split('|')
      return { treatmentCode, replication: rep ? Number(rep) : null, parameterId, value: toApiValue(params.get(parameterId), edits.get(key)) }
    })
    try {
      await saveValues.mutateAsync(cells)
      setEdits(new Map())
      setInvalid(new Map())
      toast.success(`${cells.length} value${cells.length === 1 ? '' : 's'} saved`)
    } catch (err) {
      if (err.code === 'INVALID_VALUES') {
        setInvalid(new Map((err.details?.cells ?? []).map((c) => [keys[c.index], c.message])))
        toast.error(`${err.details?.cells?.length ?? 0} value(s) are not valid. Nothing was saved; fix the cells marked in red.`)
      } else {
        toast.error(err.message)
      }
    }
  }

  const expected = e.parameters.reduce((n, p) => {
    const reps = p.level === 'plot' && replicated ? e.replications : 1
    return n + e.treatments.length * reps
  }, 0)

  const workflow = <>
    {editable && can('research.submit') && (
      <button className="btn" disabled={dirty} title={dirty ? 'Save your changes first' : undefined} onClick={() => setModal('submit')}><Send size={15} /> Submit</button>
    )}
    {s.status === 'Submitted' && (can('research.review') || can('research.approve')) && (
      <button className="btn danger" onClick={() => setModal('return')}><Undo2 size={15} /> Return</button>
    )}
    {s.status === 'Submitted' && can('research.approve') && (
      <button className="btn" onClick={() => setModal('approve')}><CheckCircle2 size={15} /> Approve</button>
    )}
  </>

  return (
    <Page
      title={<span className="row" style={{ gap: 10 }}>{e.code} · {s.fyCode} · {seasons.nameOf(s.seasonCode)} <Badge>{s.status}</Badge></span>}
      actions={<>
        <Link to={ROUTES.trial(s.trialId)} className="btn ghost"><ArrowLeft size={15} /> Trial</Link>
        {workflow}
      </>}>
      <div className="stack">
        <Card>
          <div className="kv">
            <div><span>Experiment</span><b>{e.title}</b></div>
            <div><span>Centre</span><b>{centre ? `${centre.name} (${centre.code})` : '…'}</b></div>
            <div><span>Design</span><b>{e.design}{replicated ? ` · ${e.replications} replications` : ''}</b></div>
            <div><span>Cropping system</span><b>{system ? `${system.code} · ${system.name}` : s.croppingSystemCode ?? '—'}</b></div>
            <div><span>Crop</span><b>{s.cropCode ? crops.nameOf(s.cropCode) : '—'}</b></div>
            <div><span>Values recorded</span><b>{s.values.length} of {expected}</b></div>
          </div>
          {s.status === 'Returned' && s.history.at(-1)?.remark && (
            <div className="note warn" style={{ marginTop: 12 }}>Returned by {s.history.at(-1).byName}: {s.history.at(-1).remark}</div>
          )}
          {s.status === 'Approved' && <div className="note good" style={{ marginTop: 12 }}>Approved and locked.</div>}
          {s.status === 'Submitted' && <div className="note" style={{ marginTop: 12 }}>Submitted to the PCU. It can be changed again only if it is returned.</div>}
          {!yearOpen && <div className="note" style={{ marginTop: 12 }}>{s.fyCode} is closed, so this sheet can't be changed.</div>}
        </Card>

        <Tabs value={tab} onChange={setTab} tabs={[['data', 'Data'], ['analysis', 'Analysis'], ['history', 'History', s.history.length], ...(can('audit.view') ? [['activity', 'Changes']] : [])]} />

        {tab === 'data' && (
          <>
            <Card pad={false}>
              <div className="toolbar">
                {editable && (
                  <button className="btn" onClick={save} disabled={!dirty || saveValues.isPending}>
                    {saveValues.isPending ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save{dirty ? ` (${edits.size})` : ''}
                  </button>
                )}
                {editable && dirty && <button className="btn ghost" onClick={() => { setEdits(new Map()); setInvalid(new Map()) }}>Discard changes</button>}
                <span className="grow" />
                <button className="btn ghost sm" onClick={() => sheetsApi.template(id).catch((err) => toast.error(err.message))}><Download size={14} /> Excel</button>
                {editable && <button className="btn ghost sm" disabled={dirty} title={dirty ? 'Save or discard your changes first' : undefined} onClick={() => setModal('import')}><FileSpreadsheet size={14} /> Import Excel</button>}
              </div>
              {invalid.size > 0 && <div className="note bad" style={{ margin: '0 16px 12px' }}>{invalid.size} value(s) are not valid; hover over a red cell to see why.</div>}
              {!e.parameters.length && <div className="empty">The experiment has no parameters yet.</div>}
            </Card>
            {plotParams.length > 0 && (
              <Grid title="Plot data (treatment × replication)" params={plotParams} treatments={e.treatments}
                reps={Array.from({ length: e.replications }, (_, i) => i + 1)} editable={editable} valueOf={valueOf} change={change} edits={edits} invalid={invalid} />
            )}
            {treatmentParams.length > 0 && (
              <Grid title={replicated ? 'Treatment data (once per treatment)' : 'Data'} params={treatmentParams} treatments={e.treatments}
                reps={[null]} editable={editable} valueOf={valueOf} change={change} edits={edits} invalid={invalid} />
            )}
          </>
        )}

        {tab === 'analysis' && <AnalysisTab id={id} dirty={dirty} />}

        {tab === 'activity' && (
          <Card pad={false} title="Every change to this sheet">
            <AuditTable filters={{ entityId: id }} compact />
          </Card>
        )}

        {tab === 'history' && (
          <Card pad={false}>
            <div className="list">
              {[...s.history].reverse().map((h, i) => (
                <div key={i} className="item">
                  <Badge>{h.status}</Badge>
                  <div className="grow"><b>{h.byName ?? 'System'}</b>{h.remark && <span>{h.remark}</span>}</div>
                  <span className="muted small nowrap">{formatDateTime(h.at)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {modal === 'import' && (
        <ExcelImportModal title="Import sheet values" subtitle="The file replaces the sheet's values: empty cells clear values."
          onTemplate={() => sheetsApi.template(id)} mutation={importer}
          describe={(r) => `${r.filled} values${r.cleared ? `, ${r.cleared} cleared` : ''}`} onClose={() => setModal(null)} />
      )}
      {['submit', 'return', 'approve'].includes(modal) && <WorkflowModal id={id} action={modal} onClose={() => setModal(null)} />}
    </Page>
  )
}

function Grid({ title, params, treatments, reps, editable, valueOf, change, edits, invalid }) {
  const unit = useUnitLabel()
  const replicated = reps[0] !== null
  const input = (p, key) => {
    const cls = `${edits.has(key) ? 'dirty' : ''} ${invalid.has(key) ? 'invalid' : ''}`
    const common = { className: cls, value: valueOf(key), title: invalid.get(key), 'aria-label': `${p.name} ${key.split('|').slice(0, 2).filter(Boolean).join(' R')}`, onChange: (ev) => change(key, ev.target.value) }
    if (p.dataType === 'choice') return <select {...common}><option value="" />{p.choices.map((c) => <option key={c}>{c}</option>)}</select>
    if (p.dataType === 'date') return <input type="date" {...common} />
    if (p.dataType === 'number') return <input inputMode="decimal" {...common} style={{ textAlign: 'right' }} />
    return <input {...common} />
  }
  const show = (v) => (v === '' || v === null || v === undefined ? <span className="muted">—</span> : String(v))
  return (
    <Card title={title} pad={false}>
      <div className="table-wrap" style={{ maxHeight: '65vh', overflow: 'auto' }}>
        <table className={`entry ${editable ? '' : 'ro'}`}>
          <thead>
            <tr>
              <th className="sticky-col">Treatment</th>
              {replicated && <th>Rep</th>}
              {params.map((p) => (
                <th key={p.parameterId} className={p.required ? 'req' : ''} title={[p.section, p.min !== null || p.max !== null ? `Range ${p.min ?? '…'} – ${p.max ?? '…'}` : null].filter(Boolean).join(' · ')}>
                  {p.name}{p.unitCode && <small>{unit(p.unitCode)}</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {treatments.flatMap((t) => reps.map((r) => (
              <tr key={`${t.code}-${r}`}>
                <td className="rowhead sticky-col" title={t.name}>{r === null || r === 1 ? t.code : ''}</td>
                {replicated && <td className="muted">R{r}</td>}
                {params.map((p) => {
                  const key = cellKey(t.code, r, p.parameterId)
                  return <td key={p.parameterId} style={{ minWidth: 100 }}>{editable ? input(p, key) : show(valueOf(key))}</td>
                })}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const WORKFLOW_TEXT = {
  submit: { title: 'Submit sheet', label: 'Submit', intro: 'The sheet goes to the PCU for review and can no longer be changed unless it is returned.', remark: 'Remark (optional)' },
  return: { title: 'Return sheet', label: 'Return to centre', intro: 'The centre can correct the data and submit it again.', remark: 'What needs correcting', required: true },
  approve: { title: 'Approve sheet', label: 'Approve', intro: 'Approved sheets are locked and included in the results summary.', remark: 'Remark (optional)' },
}

function WorkflowModal({ id, action, onClose }) {
  const transition = useSheetTransition(id)
  const [remark, setRemark] = useState('')
  const [missing, setMissing] = useState(null)
  const text = WORKFLOW_TEXT[action]
  const onSave = async () => {
    try {
      await transition.mutateAsync({ action, remark: remark.trim() || undefined })
      toast.success({ submit: 'Sheet submitted', return: 'Sheet returned to the centre', approve: 'Sheet approved' }[action])
    } catch (err) {
      setMissing(err.code === 'INCOMPLETE_SHEET' ? err.details?.missing ?? [] : null)
      throw err
    }
  }
  return (
    <SaveModal title={text.title} wide={false} submitLabel={text.label} onSave={onSave} onClose={onClose}
      canSave={!text.required || remark.trim().length >= 3}>
      <p style={{ margin: 0 }}>{text.intro}</p>
      {missing?.length > 0 && (
        <div style={{ maxHeight: 180, overflow: 'auto' }} className="small">
          <b>Missing required values:</b>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{missing.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
      <div className="field">
        <label htmlFor="wf-remark">{text.remark}</label>
        <textarea id="wf-remark" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} />
      </div>
    </SaveModal>
  )
}

const fmt = (x, d = 2) => (x === null || x === undefined ? '—' : Number(x).toLocaleString('en-IN', { maximumFractionDigits: d }))

function AnalysisTab({ id, dirty }) {
  const analysis = useSheetAnalysis(id)
  const unit = useUnitLabel()
  const a = analysis.data
  if (analysis.error) return <ErrorNote error={analysis.error} />
  if (!a) return <p className="muted">Loading…</p>
  const nameOf = (code) => a.treatments.find((t) => t.code === code)?.name ?? code
  return (
    <div className="stack">
      {dirty && <div className="note warn">You have unsaved changes; the analysis uses saved values only.</div>}
      {!a.parameters.length && <div className="empty card">No numeric parameters to analyse.</div>}
      {a.parameters.map((p) => (
        <Card key={p.parameterId} title={`${p.name}${p.unitCode ? ` (${unit(p.unitCode)})` : ''}`}
          actions={p.anova ? <Badge tone={p.anova.significant ? 'green' : 'grey'}>{p.anova.significant ? 'Significant at 5 %' : 'Not significant'}</Badge> : null}>
          <div className="grid g2" style={{ alignItems: 'start' }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Treatment</th><th className="num">n</th><th className="num">Mean</th></tr></thead>
                <tbody>
                  {p.means.map((m) => <tr key={m.treatmentCode}><td title={nameOf(m.treatmentCode)}><b>{m.treatmentCode}</b> <span className="muted small">{nameOf(m.treatmentCode)}</span></td><td className="num">{m.n}</td><td className="num">{fmt(m.mean)}</td></tr>)}
                </tbody>
                <tfoot><tr><td><b>Grand mean</b></td><td /><td className="num"><b>{fmt(p.grandMean)}</b></td></tr></tfoot>
              </table>
            </div>
            {p.anova ? (
              <div className="stack" style={{ gap: 10 }}>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Source</th><th className="num">df</th><th className="num">SS</th><th className="num">MS</th><th className="num">F</th><th className="num">p</th></tr></thead>
                    <tbody>
                      {p.anova.table.map((r) => (
                        <tr key={r.source}><td>{r.source}</td><td className="num">{r.df}</td><td className="num">{fmt(r.ss, 3)}</td><td className="num">{fmt(r.ms, 3)}</td><td className="num">{fmt(r.f, 3)}</td><td className="num">{r.p === null ? '—' : r.p < 0.001 ? '<0.001' : fmt(r.p, 3)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="kv">
                  <div><span>CV (%)</span><b>{fmt(p.anova.cv)}</b></div>
                  <div><span>SEm ±</span><b>{fmt(p.anova.sem, 3)}</b></div>
                  <div><span>SEd ±</span><b>{fmt(p.anova.sed, 3)}</b></div>
                  <div><span>CD (5 %)</span><b>{p.anova.cd5 === null ? 'NS' : fmt(p.anova.cd5, 3)}</b></div>
                </div>
              </div>
            ) : (
              <div className="note">{p.reason ?? 'No analysis of variance for this parameter.'}</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
