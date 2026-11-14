import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { ERROR_TOAST_DURATION_MS, TOAST_DURATION_MS } from '../config/constants'

// A tiny toast store that works outside React too, so the global error handler
// (lib/errors.js, lib/queryClient.js) can show messages without hooks.

let toasts = []
let nextId = 1
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

const dismiss = (id) => {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

const push = (tone, text, detail) => {
  // Don't stack identical messages (e.g. the same failure from several queries at once).
  if (toasts.some((t) => t.text === text && t.tone === tone)) return
  const id = nextId++
  toasts = [...toasts, { id, tone, text, detail }]
  emit()
  setTimeout(() => dismiss(id), tone === 'error' ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS)
}

export const toast = {
  success: (text) => push('success', text),
  info: (text) => push('info', text),
  /** `detail` is shown smaller, e.g. the request id to quote when reporting a problem. */
  error: (text, detail) => push('error', text, detail),
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <div className="grow">
            {t.text}
            {t.detail && <div className="toast-detail">{t.detail}</div>}
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
