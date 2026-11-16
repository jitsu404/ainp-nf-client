import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Search } from 'lucide-react'
import { useAuth } from '../auth'
import { ErrorNote, SaveModal } from '../components/forms'
import { Badge, Card, Page, Select, Table } from '../components/ui'
import { EXPERIMENT_DESIGNS, EXPERIMENT_STATUSES, ROUTES, TABLE_PAGE_SIZE, UNREPLICATED_DESIGNS } from '../config/constants'
import { useDebounced } from '../hooks'
import { toast } from '../lib/toast'
import { useFinancialYears, useMasterOptions } from '../queries/masters'
import { useCreateExperiment, useExperiments } from '../queries/research'

// Experiments are the PCU's protocols. The PCU (research.config) creates them and assigns centres;
// a Centre PI sees only the experiments assigned to their centre (the API scopes the list).

export default function Experiments() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [programme, setProgramme] = useState('')
  const [adding, setAdding] = useState(false)
  const q = useDebounced(search)
  const programmes = useMasterOptions('programme')
  const experiments = useExperiments({ search: q || undefined, status: status || undefined, programmeCode: programme || undefined })
  const rows = experiments.data ?? []
  const config = can('research.config')

  return (
    <Page title={config ? 'Experiments' : 'Experiments at my centre'}
      actions={config && <button className="btn" onClick={() => setAdding(true)}><Plus size={15} /> New experiment</button>}>
      <div className="stack">
        <ErrorNote error={experiments.error} />
        <Card pad={false}>
          <div className="toolbar">
            <label className="search"><Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or title…" />
            </label>
            <Select value={programme} onChange={setProgramme} options={programmes.options} all="All programmes" />
            <Select value={status} onChange={setStatus} options={EXPERIMENT_STATUSES} all="All statuses" />
            <span className="grow" />
            <span className="muted small row" style={{ gap: 6 }}>
              {experiments.isFetching && <Loader2 size={13} className="spin" />}
              {experiments.isPending ? 'Loading…' : `${rows.length} experiment${rows.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <Table rows={rows} pageSize={TABLE_PAGE_SIZE} onRow={(e) => navigate(ROUTES.experiment(e.id))}
            empty={experiments.isPending ? 'Loading…' : config ? 'No experiments yet. Create one to get started.' : 'No experiments are assigned to your centre yet.'}
            columns={[
              { label: 'Code', render: (e) => <span className="mono">{e.code}</span> },
              { label: 'Title', render: (e) => <b style={{ fontWeight: 550 }}>{e.title}</b> },
              { label: 'Programme', render: (e) => programmes.nameOf(e.programmeCode) },
              { label: 'Design', render: (e) => `${e.design}${e.replications ? ` · ${e.replications} reps` : ''}` },
              { label: 'Treatments', num: true, render: (e) => e.treatments.length },
              { label: 'Parameters', num: true, render: (e) => e.parameters.length },
              ...(config ? [{ label: 'Centres', num: true, render: (e) => e.centreIds.length }] : []),
              { label: 'Since', key: 'startYear' },
              { label: 'Status', render: (e) => <Badge>{e.status}</Badge> },
            ]} />
        </Card>
      </div>
      {adding && <ExperimentDetailsModal onClose={() => setAdding(false)} onCreated={(e) => navigate(ROUTES.experiment(e.id))} />}
    </Page>
  )
}

/**
 * Create an experiment, or edit its main details (`experiment` given, with `save(body)`).
 * Treatments, parameters and centres have their own editors on the detail page.
 */
export function ExperimentDetailsModal({ experiment, save, onClose, onCreated }) {
  const create = useCreateExperiment()
  const programmes = useMasterOptions('programme')
  const seasons = useMasterOptions('season')
  const years = useFinancialYears()
  const current = years.data?.find((y) => y.isCurrent)?.code ?? ''
  const [v, setV] = useState(() => ({
    code: experiment?.code ?? '',
    title: experiment?.title ?? '',
    programmeCode: experiment?.programmeCode ?? '',
    design: experiment?.design ?? 'RCBD',
    replications: experiment?.replications ?? 3,
    startYear: experiment?.startYear ?? '',
    seasons: experiment?.seasons ?? [],
    objectives: (experiment?.objectives ?? []).join('\n'),
    status: experiment?.status ?? 'Draft',
  }))
  const set = (k, value) => setV((s) => ({ ...s, [k]: value }))
  const replicated = !UNREPLICATED_DESIGNS.includes(v.design)
  const startYear = v.startYear || current
  const locked = experiment?.dataLocked

  const body = () => {
    const b = {
      title: v.title.trim(),
      programmeCode: v.programmeCode,
      startYear,
      seasons: v.seasons,
      objectives: v.objectives.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    // Once data exists the design and replications are frozen; don't send them unchanged.
    if (!locked) {
      b.design = v.design
      b.replications = replicated ? Number(v.replications) : null
    }
    if (experiment) b.status = v.status
    else b.code = v.code.trim()
    return b
  }

  const onSave = async () => {
    if (experiment) {
      await save(body())
      toast.success('Experiment saved')
    } else {
      const created = await create.mutateAsync(body())
      toast.success(`${created.code} created`)
      onCreated?.(created)
    }
  }

  const ready = v.title.trim().length >= 5 && v.programmeCode && startYear && (experiment || v.code.trim()) && (!replicated || Number(v.replications) >= 2)

  return (
    <SaveModal title={experiment ? `Edit ${experiment.code}` : 'New experiment'}
      subtitle={experiment ? undefined : 'Treatments, parameters and centres are added on the next screen.'}
      onSave={onSave} onClose={onClose} canSave={Boolean(ready)} submitLabel={experiment ? 'Save' : 'Create experiment'}>
      {locked && <div className="note warn">Centres have recorded data, so the design and replications can no longer change.</div>}
      <div className="form">
        {!experiment && (
          <div className="field"><label htmlFor="x-code">Code</label>
            <input id="x-code" value={v.code} onChange={(e) => set('code', e.target.value)} placeholder="e.g. NF-LTE" />
            <span className="muted small">Letters, digits, _ or -. Stored in capitals.</span>
          </div>
        )}
        <div className="field"><label htmlFor="x-prog">Programme</label>
          <select id="x-prog" value={v.programmeCode} onChange={(e) => set('programmeCode', e.target.value)}>
            <option value="">Select…</option>
            {programmes.options.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
        <div className="field full"><label htmlFor="x-title">Title</label>
          <input id="x-title" value={v.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="field"><label htmlFor="x-design">Design</label>
          <select id="x-design" value={v.design} disabled={locked} onChange={(e) => set('design', e.target.value)}>
            {EXPERIMENT_DESIGNS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="x-reps">Replications</label>
          <input id="x-reps" type="number" min={2} max={20} value={replicated ? v.replications ?? '' : ''} disabled={!replicated || locked}
            onChange={(e) => set('replications', e.target.value)} placeholder={replicated ? '' : 'Not replicated'} />
        </div>
        <div className="field"><label htmlFor="x-year">Start year</label>
          <select id="x-year" value={startYear} onChange={(e) => set('startYear', e.target.value)}>
            <option value="">Select…</option>
            {(years.data ?? []).map((y) => <option key={y.code}>{y.code}</option>)}
          </select>
        </div>
        {experiment && (
          <div className="field"><label htmlFor="x-status">Status</label>
            <select id="x-status" value={v.status} onChange={(e) => set('status', e.target.value)}>
              {EXPERIMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <span className="muted small">Centres can record data only while the experiment is Active.</span>
          </div>
        )}
        <div className="field full"><label>Seasons</label>
          <div className="check-list" style={{ maxHeight: 'none' }}>
            {seasons.options.map(([code, name]) => (
              <label key={code}>
                <input type="checkbox" checked={v.seasons.includes(code)}
                  onChange={(e) => set('seasons', e.target.checked ? [...v.seasons, code] : v.seasons.filter((s) => s !== code))} />
                {name}
              </label>
            ))}
          </div>
        </div>
        <div className="field full"><label htmlFor="x-obj">Objectives <span className="muted">(optional, one per line)</span></label>
          <textarea id="x-obj" rows={3} value={v.objectives} onChange={(e) => set('objectives', e.target.value)} />
        </div>
      </div>
    </SaveModal>
  )
}
