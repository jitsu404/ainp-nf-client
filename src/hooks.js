import { useEffect, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from './config/constants'

// Server data is loaded with TanStack Query hooks in src/queries/. These are small UI helpers.

/** Returns `value` once it has stopped changing for `ms` (for search boxes). */
export function useDebounced(value, ms = SEARCH_DEBOUNCE_MS) {
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
