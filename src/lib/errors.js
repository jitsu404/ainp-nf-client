import { ApiError } from '../api'
import { toast } from './toast'

// The client's global error handler. Every error that nothing else handled ends up here:
// failed queries and mutations (via lib/queryClient.js), uncaught exceptions and unhandled
// promise rejections (via installGlobalErrorHandlers), and render errors (via ErrorBoundary).

/** A message a person can act on, for any kind of error. */
export function describeError(error) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return error.message
    if (error.status >= 500) return 'The server ran into a problem. Please try again in a moment.'
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

/** Reports an error: shows a toast and, in development, logs it with its details. */
export function reportError(error, context = '') {
  if (import.meta.env.DEV) {
    console.error(`[error]${context ? ` ${context}:` : ''}`, error) // eslint-disable-line no-console
  }
  const reference = error instanceof ApiError && error.requestId ? `Reference: ${error.requestId}` : undefined
  toast.error(describeError(error), reference)
  // Production error monitoring (e.g. sending to a logging endpoint) plugs in here.
}

let installed = false
/** Catches what escapes everything else: thrown errors in event handlers and rejected promises. */
export function installGlobalErrorHandlers() {
  if (installed) return
  installed = true
  window.addEventListener('unhandledrejection', (event) => {
    // Session-ending API errors are handled by the auth layer; don't toast them twice.
    if (event.reason instanceof ApiError && event.reason.handled) return
    reportError(event.reason, 'unhandled promise rejection')
  })
  window.addEventListener('error', (event) => {
    // Ignore failed <img>/<script> loads (they have no error object).
    if (!event.error) return
    const { error } = event
    // React (in development) also reports errors that an error boundary caught. The boundary marks
    // them in the same task, so check after it has run and skip those: its fallback already shows.
    setTimeout(() => {
      if (!isBoundaryHandled(error)) reportError(error, 'uncaught error')
    }, 0)
  })
}

const BOUNDARY_HANDLED = Symbol('handledByErrorBoundary')

/** Called by error boundaries for every error they catch (see components/ErrorBoundaries.jsx). */
export function markBoundaryHandled(error) {
  if (error && typeof error === 'object') error[BOUNDARY_HANDLED] = true
}

const isBoundaryHandled = (error) => Boolean(error && typeof error === 'object' && error[BOUNDARY_HANDLED])
