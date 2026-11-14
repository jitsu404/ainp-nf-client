// Thin client for the icar-nf-backend REST API.
// In development Vite proxies /api to the backend (vite.config.js), so the browser sees one origin
// and the httpOnly session cookie (SameSite=Strict) is sent automatically.

const BASE = '/api/v1'

/** An error response from the API: { code, message, details, requestId, status }. */
export class ApiError extends Error {
  constructor(status, { code = 'UNKNOWN', message = 'Something went wrong', details, requestId } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }

  /** Field-level messages from a 400 VALIDATION_ERROR, e.g. { email: ['Invalid email'] }. */
  get fieldErrors() {
    return this.details?.body?.fieldErrors ?? this.details?.query?.fieldErrors ?? {}
  }
}

// Lets the auth layer react when the session ends or a password change becomes required.
let onAuthError = () => {}
export const setAuthErrorHandler = (fn) => { onAuthError = fn }

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'same-origin',
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
    const authCodes = ['AUTH_REQUIRED', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'SESSION_EXPIRED', 'PASSWORD_CHANGE_REQUIRED']
    if (authCodes.includes(error.code) && !path.startsWith('/auth/')) onAuthError(error)
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

// ── Endpoints used by the app ──────────────────────────────────────────────
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
