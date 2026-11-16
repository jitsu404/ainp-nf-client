import { useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { MAX_UPLOAD_MB } from '../config/constants'
import { toast } from '../lib/toast'
import { ErrorNote } from './forms'
import { Modal } from './ui'

/**
 * Excel import in three steps, the same for every module:
 *   1. download the template (pre-filled with the current data, so it doubles as an export);
 *   2. upload the filled file: the API checks every row and saves nothing (dry run);
 *   3. if there are no errors, confirm: the API saves all rows in one go.
 *
 * onTemplate() → Promise (downloads the file)
 * mutation: a TanStack mutation taking ({ file, dryRun }) and returning the import result
 * describe(result) → text for a clean preview, e.g. "3 new, 12 updated"
 */
export function ExcelImportModal({ title, subtitle, onTemplate, mutation, describe, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (dryRun) => {
    setBusy(true)
    setError(null)
    try {
      const result = await mutation.mutateAsync({ file, dryRun })
      if (dryRun || result.dryRun) setPreview(result)
      else {
        toast.success(`Imported: ${describe(result)}`)
        onClose()
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const choose = (f) => {
    setPreview(null)
    setError(null)
    if (f && f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setFile(null)
      setError(new Error(`The file is larger than ${MAX_UPLOAD_MB} MB.`))
      return
    }
    setFile(f ?? null)
  }

  const template = async () => {
    setBusy(true)
    try { await onTemplate() } catch (err) { setError(err) } finally { setBusy(false) }
  }

  const clean = preview && !preview.errors.length

  return (
    <Modal title={title} subtitle={subtitle} wide onClose={busy ? () => {} : onClose} footer={<>
      <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
      {clean ? (
        <button className="btn" onClick={() => run(false)} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />} Confirm import
        </button>
      ) : (
        <button className="btn" onClick={() => run(true)} disabled={!file || busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Upload size={15} />} Check file
        </button>
      )}
    </>}>
      <div className="stack">
        <ol className="muted small" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Download the template. It contains the current data, so you can edit it or add rows.</li>
          <li>Choose the filled file (.xlsx, up to {MAX_UPLOAD_MB} MB) and check it. Nothing is saved yet.</li>
          <li>If every row is correct, confirm to save all of it at once.</li>
        </ol>
        <div className="row">
          <button type="button" className="btn ghost" onClick={template} disabled={busy}><Download size={15} /> Download template</button>
          <label className="btn ghost" style={{ cursor: 'pointer' }}>
            <FileSpreadsheet size={15} /> {file ? file.name : 'Choose file…'}
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden
              onChange={(e) => { choose(e.target.files?.[0]); e.target.value = '' }} />
          </label>
        </div>
        <ErrorNote error={error} />
        {clean && <div className="note good">File checked: {describe(preview)}. Confirm to save.</div>}
        {preview?.errors.length > 0 && (
          <>
            <div className="note bad">
              {preview.errors.length} problem{preview.errors.length === 1 ? '' : 's'} found. Nothing was saved. Fix the file and check it again.
            </div>
            <div className="table-wrap" style={{ maxHeight: 280, overflow: 'auto' }}>
              <table>
                <thead><tr><th className="num">Row</th><th>Column</th><th>Problem</th></tr></thead>
                <tbody>
                  {preview.errors.slice(0, 200).map((e, i) => (
                    <tr key={i}><td className="num">{e.row}</td><td>{e.field ?? '—'}</td><td>{e.message}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
