// Thin client for the icar-nf-backend REST API.
// The base URL comes from config/constants.js. By default it is '/api/v1' and Vite proxies it to
// the backend (vite.config.js). A full URL (VITE_API_BASE_URL) also works, provided the backend's
// CLIENT_ORIGIN is set to this app's origin.

import { API_BASE_URL, PASSWORD_CHANGE_REQUIRED, SESSION_ENDED_CODES } from './config/constants'

/** An error response from the API: { code, message, details, requestId, status }. */
export class ApiError extends Error {
  constructor(status, { code = 'UNKNOWN', message = 'Something went wrong', details, requestId } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
    /** Set once the auth layer has dealt with it, so the global handler doesn't report it again. */
    this.handled = false
  }

  /** Field-level messages from a 400 VALIDATION_ERROR, e.g. { email: ['Invalid email'] }. */
  get fieldErrors() {
    return this.details?.body?.fieldErrors ?? this.details?.query?.fieldErrors ?? {}
  }

  /** True when the session is over or blocked; the auth layer handles these. */
  get isSessionError() {
    return SESSION_ENDED_CODES.includes(this.code) || this.code === PASSWORD_CHANGE_REQUIRED
  }
}

// Lets the auth layer react when the session ends or a password change becomes required.
let onSessionError = () => {}
export const setSessionErrorHandler = (fn) => { onSessionError = fn }

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // 'include' so the session cookie is stored and sent even when the API is on another origin
      // of the same site (e.g. VITE_API_BASE_URL=http://localhost:5000/api/v1, or api.nf.example.in).
      // The backend allows this only for CLIENT_ORIGIN (CORS with credentials), and SameSite=Strict
      // still keeps the cookie away from other sites.
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection and try again.' })
  }

  if (res.status === 204) return { data: null }
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    const error = new ApiError(res.status, json?.error ?? { message: `Request failed (${res.status})` })
    // Auth endpoints report their own errors (e.g. wrong password on the sign-in form).
    if (error.isSessionError && !path.startsWith('/auth/')) {
      error.handled = true
      onSessionError(error)
    }
    throw error
  }
  return { data: json.data, meta: json.meta }
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

export const api = {
  get: (path, params) => request('GET', `${path}${qs(params)}`),
  post: (path, body = {}) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
}

// ── Endpoints ────────────────────────────────────────────────────────────────
export const authApi = {
  me: () => api.get('/auth/me'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
}

export const centresApi = {
  list: (params) => api.get('/centres', params),
  get: (id) => api.get(`/centres/${id}`),
  create: (body) => api.post('/centres', body),
  update: (id, body) => api.patch(`/centres/${id}`, body),
  pis: (id) => api.get(`/centres/${id}/pis`),
  assignPi: (id, body) => api.post(`/centres/${id}/pi`, body),
}

export const usersApi = {
  list: (params) => api.get('/users', params),
  create: (body) => api.post('/users', body),
  update: (id, body) => api.patch(`/users/${id}`, body),
  deactivate: (id, reason) => api.post(`/users/${id}/deactivate`, { reason }),
  activate: (id) => api.post(`/users/${id}/activate`),
  resetPassword: (id, temporaryPassword) => api.post(`/users/${id}/reset-password`, { temporaryPassword }),
}
