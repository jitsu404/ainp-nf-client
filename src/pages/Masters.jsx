import { useState } from 'react'
import { FileSpreadsheet, Lock, LockOpen, Pencil, Plus, Power, Search, Star } from 'lucide-react'
import { parametersApi, mastersApi } from '../api'
import { useAuth } from '../auth'
import { ExcelImportModal } from '../components/ExcelImport'
import { AsyncFormModal, ErrorNote } from '../components/forms'
import { Badge, Card, Page, Select, Table, Tabs } from '../components/ui'
import { PARAMETER_CATEGORIES, PARAMETER_DATA_TYPES, TABLE_PAGE_SIZE } from '../config/constants'
import { formatDate, useDebounced } from '../hooks'
import { toast } from '../lib/toast'
import {
  useCreateFinancialYear, useCreateMaster, useCreateParameter, useFinancialYears, useImportMasters,
  useImportParameters, useMasterOptions, useMasterTypes, useMasters, useParameters, useUpdateFinancialYear,
  useUpdateMaster, useUpdateParameter,
} from '../queries/masters'

// Reference data used across the system: lookup lists (seasons, units, crops, budget heads …),
// financial years and the parameter library. Shown only to users with `masters.edit` (PCU and
// Super Admin); everyone else just sees the values in dropdowns.

const importSummary = (r) => `${r.created} new, ${r.updated} updated`

export default function Masters() {
  const types = useMasterTypes()
  const [tab, setTab] = useState('season')
  const list = types.data ?? []

  return (
    <Page title="Masters">
      <ErrorNote error={types.error} />
      <Tabs value={tab} onChange={setTab}
        tabs={[...list.map((t) => [t.id, t.label]), ['fy', 'Financial years'], ['parameters', 'Parameter library']]} />
      {tab === 'fy' ? <FinancialYears />
        : tab === 'parameters' ? <Parameters />
          : list.find((t) => t.id === tab) && <MasterList key={tab} type={list.find((t) => t.id === tab)} />}
    </Page>
  )
}

function MasterList({ type }) {
  const { can } = useAuth()
  const edit = can('masters.edit')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('true')
  const [modal, setModal] = useState(null) // 'add' | 'import' | item being edited
  const q = useDebounced(search)
  const items = useMasters(type.id, { search: q || undefined, isActive: status || undefined })
  const create = useCreateMaster(type.id)
  const update = useUpdateMaster(type.id)
  const importer = useImportMasters(type.id)
  const rows = items.data ?? []

  const fields = (isEdit) => [
    { name: 'code', label: 'Code', hint: 'Letters, digits, _ or -. Stored in capitals.', required: !isEdit },
    { name: 'name', label: 'Name' },
    ...(type.groups ? [{ name: 'group', label: type.groupLabel ?? 'Group', type: 'select', options: type.groups, required: false, clearable: true }] : []),
    { name: 'sortOrder', label: 'Sort order', type: 'number', required: false, hint: 'Lower numbers are listed first.' },
    { name: 'description', label: 'Description', type: 'textarea', required: false, clearable: true },
  ]

  const toggle = async (item) => {
    try {
      await update.mutateAsync({ id: item.id, isActive: !item.isActive })
      toast.success(`${item.name} ${item.isActive ? 'deactivated' : 'reactivated'}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Card pad={false} title={type.label}
      actions={edit && <>
        <button className="btn ghost sm" onClick={() => setModal('import')}><FileSpreadsheet size={14} /> Excel import</button>
        <button className="btn sm" onClick={() => setModal('add')}><Plus size={14} /> Add</button>
      </>}>
      <div className="toolbar">
        <label className="search"><Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name…" />
        </label>
        <Select value={status} onChange={setStatus} options={[['true', 'Active'], ['false', 'Inactive']]} all="All" />
        <span className="grow" />
        <span className="muted small">{type.description}</span>
      </div>
      <Table rows={rows} pageSize={TABLE_PAGE_SIZE} empty={items.isPending ? 'Loading…' : 'No items.'}
        columns={[
          { label: 'Code', render: (m) => <span className="mono">{m.code}</span> },
          { label: 'Name', render: (m) => <b style={{ fontWeight: 550 }}>{m.name}</b> },
          ...(type.groups ? [{ label: type.groupLabel ?? 'Group', render: (m) => m.group || '—' }] : []),
          { label: 'Description', render: (m) => <span className="muted small">{m.description || '—'}</span> },
          { label: 'Status', render: (m) => <Badge>{m.isActive ? 'Active' : 'Inactive'}</Badge> },
          ...(edit ? [{
            label: ' ',
            render: (m) => (
              <span className="row nowrap" style={{ gap: 4 }}>
                <button className="icon-btn" title="Edit" aria-label={`Edit ${m.name}`} onClick={() => setModal(m)}><Pencil size={15} /></button>
                <button className="icon-btn" title={m.isActive ? 'Deactivate' : 'Reactivate'} aria-label={m.isActive ? `Deactivate ${m.name}` : `Reactivate ${m.name}`}
                  onClick={() => toggle(m)}><Power size={15} /></button>
              </span>
            ),
          }] : []),
        ]} />

      {modal === 'add' && (
        <AsyncFormModal title={`Add to ${type.label.toLowerCase()}`} fields={fields(false)} onSubmit={create.mutateAsync}
          onDone={(m) => toast.success(`${m.name} added`)} onClose={() => setModal(null)} />
      )}
      {modal && typeof modal === 'object' && (
        <AsyncFormModal title={`Edit ${modal.name}`} fields={fields(true).filter((f) => f.name !== 'code')}
          initial={{ name: modal.name, group: modal.group ?? '', sortOrder: modal.sortOrder ?? '', description: modal.description ?? '' }}
          onSubmit={(body) => update.mutateAsync({ id: modal.id, ...body })}
          onDone={() => toast.success('Saved')} onClose={() => setModal(null)} />
      )}
      {modal === 'import' && (
        <ExcelImportModal title={`Import ${type.label.toLowerCase()}`} subtitle="Existing codes are updated; new codes are added."
          onTemplate={() => mastersApi.template(type.id)} mutation={importer} describe={importSummary} onClose={() => setModal(null)} />
      )}
    </Card>
  )
}

function FinancialYears() {
  const { can } = useAuth()
  const edit = can('masters.edit')
  const years = useFinancialYears()
  const create = useCreateFinancialYear()
  const update = useUpdateFinancialYear()
  const [adding, setAdding] = useState(false)

  const change = async (fy, body, message) => {
    try {
      await update.mutateAsync({ id: fy.id, ...body })
      toast.success(message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Card pad={false} title="Financial years"
      actions={edit && <button className="btn sm" onClick={() => setAdding(true)}><Plus size={14} /> Add year</button>}>
      <div className="toolbar"><span className="muted small">
        A closed year is locked: no observation data or other entries can be added or changed in it. The current year is the default everywhere.
      </span></div>
      <Table rows={years.data ?? []} pageSize={TABLE_PAGE_SIZE} empty={years.isPending ? 'Loading…' : 'No financial years.'}
        columns={[
          { label: 'Year', render: (y) => <b style={{ fontWeight: 550 }}>{y.code}</b> },
          { label: 'Period', render: (y) => `${formatDate(y.startDate)} – ${formatDate(y.endDate)}` },
          { label: 'Data entry', render: (y) => <Badge tone={y.isOpen ? 'green' : 'grey'}>{y.isOpen ? 'Open' : 'Closed'}</Badge> },
          { label: 'Current', render: (y) => (y.isCurrent ? <Badge tone="blue">Current year</Badge> : '—') },
          ...(edit ? [{
            label: ' ',
            render: (y) => (
              <span className="row nowrap" style={{ gap: 6 }}>
                {!y.isCurrent && <button className="btn ghost sm" onClick={() => change(y, { isCurrent: true }, `${y.code} is now the current year`)}><Star size={13} /> Make current</button>}
                <button className="btn ghost sm" onClick={() => change(y, { isOpen: !y.isOpen }, `${y.code} ${y.isOpen ? 'closed' : 'reopened'}`)}>
                  {y.isOpen ? <><Lock size={13} /> Close</> : <><LockOpen size={13} /> Reopen</>}
                </button>
              </span>
            ),
          }] : []),
        ]} />
      {adding && (
        <AsyncFormModal title="Add financial year" submitLabel="Add year"
          fields={[{ name: 'code', label: 'Year', hint: 'Like 2026-27. Runs 1 April – 31 March.' }]}
          onSubmit={create.mutateAsync} onDone={(y) => toast.success(`${y.code} added`)} onClose={() => setAdding(false)} />
      )}
    </Card>
  )
}

const splitChoices = (v) => String(v).split('|').map((s) => s.trim()).filter(Boolean)

function Parameters() {
  const { can } = useAuth()
  const edit = can('masters.edit')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modal, setModal] = useState(null)
  const q = useDebounced(search)
  const params = useParameters({ search: q || undefined, category: category || undefined })
  const units = useMasterOptions('unit')
  const create = useCreateParameter()
  const update = useUpdateParameter()
  const importer = useImportParameters()

  const fields = (isEdit) => [
    { name: 'code', label: 'Code', hint: 'Letters, digits or _. Stored in capitals.', required: !isEdit },
    { name: 'name', label: 'Name' },
    { name: 'category', label: 'Category', type: 'select', options: PARAMETER_CATEGORIES },
    { name: 'unitCode', label: 'Unit', type: 'select', options: units.options, required: false, clearable: true },
    { name: 'dataType', label: 'Data type', type: 'select', options: PARAMETER_DATA_TYPES, required: false },
    { name: 'decimals', label: 'Decimals', type: 'number', required: false },
    { name: 'min', label: 'Minimum', type: 'number', required: false, clearable: true },
    { name: 'max', label: 'Maximum', type: 'number', required: false, clearable: true },
    { name: 'choices', label: 'Choices', required: false, full: true, parse: splitChoices, hint: 'For data type "choice": values separated by |, e.g. Low | Medium | High' },
    { name: 'method', label: 'Method', type: 'textarea', required: false, clearable: true },
  ]

  const toggle = async (p) => {
    try {
      await update.mutateAsync({ id: p.id, isActive: !p.isActive })
      toast.success(`${p.name} ${p.isActive ? 'deactivated' : 'reactivated'}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Card pad={false} title="Parameter library"
      actions={edit && <>
        <button className="btn ghost sm" onClick={() => setModal('import')}><FileSpreadsheet size={14} /> Excel import</button>
        <button className="btn sm" onClick={() => setModal('add')}><Plus size={14} /> Add parameter</button>
      </>}>
      <div className="toolbar">
        <label className="search"><Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name…" />
        </label>
        <Select value={category} onChange={setCategory} options={PARAMETER_CATEGORIES} all="All categories" />
        <span className="grow" />
        <span className="muted small">{params.data ? `${params.data.length} parameters` : ''}</span>
      </div>
      <ErrorNote error={params.error} />
      <Table rows={params.data ?? []} pageSize={15} empty={params.isPending ? 'Loading…' : 'No parameters.'}
        columns={[
          { label: 'Code', render: (p) => <span className="mono">{p.code}</span> },
          { label: 'Name', render: (p) => <b style={{ fontWeight: 550 }}>{p.name}</b> },
          { label: 'Category', key: 'category' },
          { label: 'Unit', render: (p) => (p.unitCode ? units.nameOf(p.unitCode) : '—') },
          { label: 'Type', render: (p) => (p.dataType === 'choice' ? `choice (${p.choices.join(', ')})` : p.dataType) },
          { label: 'Range', render: (p) => (p.min !== null || p.max !== null ? `${p.min ?? '…'} – ${p.max ?? '…'}` : '—') },
          { label: 'Status', render: (p) => <Badge>{p.isActive ? 'Active' : 'Inactive'}</Badge> },
          ...(edit ? [{
            label: ' ',
            render: (p) => (
              <span className="row nowrap" style={{ gap: 4 }}>
                <button className="icon-btn" title="Edit" aria-label={`Edit ${p.name}`} onClick={() => setModal(p)}><Pencil size={15} /></button>
                <button className="icon-btn" title={p.isActive ? 'Deactivate' : 'Reactivate'} aria-label={p.isActive ? `Deactivate ${p.name}` : `Reactivate ${p.name}`}
                  onClick={() => toggle(p)}><Power size={15} /></button>
              </span>
            ),
          }] : []),
        ]} />

      {modal === 'add' && (
        <AsyncFormModal title="Add parameter" fields={fields(false)} initial={{ dataType: 'number' }}
          onSubmit={create.mutateAsync} onDone={(p) => toast.success(`${p.name} added`)} onClose={() => setModal(null)} />
      )}
      {modal && typeof modal === 'object' && (
        <AsyncFormModal title={`Edit ${modal.name}`} fields={fields(true).filter((f) => f.name !== 'code')}
          initial={{
            name: modal.name, category: modal.category, unitCode: modal.unitCode ?? '', dataType: modal.dataType,
            decimals: modal.decimals ?? '', min: modal.min ?? '', max: modal.max ?? '',
            choices: (modal.choices ?? []).join(' | '), method: modal.method ?? '',
          }}
          onSubmit={(body) => update.mutateAsync({ id: modal.id, ...body })}
          onDone={() => toast.success('Saved')} onClose={() => setModal(null)} />
      )}
      {modal === 'import' && (
        <ExcelImportModal title="Import parameters" subtitle="Existing codes are updated; new codes are added. Units must exist in the Units list."
          onTemplate={() => parametersApi.template()} mutation={importer} describe={importSummary} onClose={() => setModal(null)} />
      )}
    </Card>
  )
}
