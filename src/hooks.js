import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from the API. `load` returns `{ data, meta }` (an api.* call).
 * Re-runs when `deps` change; `reload()` re-runs on demand (e.g. after a save).
 */
export function useLoad(load, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, error: null, loading: true })
  const latest = useRef(0)

  const run = useCallback(async () => {
    const call = ++latest.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { data, meta } = await load()
      if (call === latest.current) setState({ data, meta, error: null, loading: false })
    } catch (error) {
      if (call === latest.current) setState((s) => ({ ...s, error, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])
  return { ...state, reload: run }
}

/** Returns `value` once it has stopped changing for `ms` (for search boxes). */
export function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'
