// App-wide constants. Values that differ per environment come from Vite env variables
// (VITE_*, set in .env.local or the hosting dashboard); the rest are fixed here.
// Programme branding (names, institute, address) lives in src/programme/config.js.

// ── API ──────────────────────────────────────────────────────────────────────
/**
 * Base URL of the REST API. Default '/api/v1' is same-origin: in development Vite proxies it to
 * the backend; in production the API must be served from the same site, because the session
 * cookie is SameSite=Strict.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

/** API error codes that mean "the session is no longer usable". */
export const SESSION_ENDED_CODES = ['AUTH_REQUIRED', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'SESSION_EXPIRED']
export const PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED'

/** The API's maximum page size; lists that load "everything" (e.g. 20-odd centres) use it. */
export const MAX_PAGE_SIZE = 100

// ── Data fetching (TanStack Query) ───────────────────────────────────────────
export const QUERY_STALE_TIME_MS = 30_000 // data counts as fresh for 30 s, then refetches in the background
export const QUERY_GC_TIME_MS = 5 * 60_000 // unused cache entries are dropped after 5 min
export const QUERY_RETRY_COUNT = 2 // network and 5xx errors only; 4xx are never retried
export const REFERENCE_STALE_TIME_MS = 5 * 60_000 // masters, years, parameters change rarely

// ── UI ───────────────────────────────────────────────────────────────────────
export const TOAST_DURATION_MS = 3500
export const ERROR_TOAST_DURATION_MS = 6000
export const SEARCH_DEBOUNCE_MS = 300
export const TABLE_PAGE_SIZE = 12

// ── Domain values ────────────────────────────────────────────────────────────
export const HOST_TYPES = ['SAU', 'ICAR', 'CAU', 'Deemed University', 'Other']
export const DEFAULT_PI_DESIGNATION = 'Agronomist'
/** Must match TITLES in icar-nf-backend/src/modules/users/users.names.ts. */
export const TITLES = ['Dr', 'Prof', 'Mr', 'Mrs', 'Ms']
/** Default organization for PCU and Super Admin accounts. */
export const PCU_ORGANIZATION = 'ICAR-Indian Institute of Farming Systems Research, Modipuram'

/** Must match passwordSchema in icar-nf-backend/src/modules/users/users.dto.ts. */
export const PASSWORD_RULE = {
  text: 'At least 10 characters, with a letter and a digit.',
  test: (p) => p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p),
}

// Research. Each must match the backend model of the same name.
export const EXPERIMENT_DESIGNS = ['RCBD', 'Factorial RBD', 'Split plot', 'Non-replicated', 'Survey']
/** Designs without replications (data is one value per treatment). */
export const UNREPLICATED_DESIGNS = ['Non-replicated', 'Survey']
export const EXPERIMENT_STATUSES = ['Draft', 'Active', 'Closed']
export const TRIAL_STATUSES = ['Setup', 'Running', 'Completed']
export const SHEET_STATUSES = ['Draft', 'Submitted', 'Returned', 'Approved']
export const PARAMETER_LEVELS = [['plot', 'Per plot (treatment × replication)'], ['treatment', 'Once per treatment']]
export const PARAMETER_CATEGORIES = [
  'Growth', 'Yield', 'Quality', 'Soil chemical', 'Soil physical', 'Soil biological', 'Plant nutrient',
  'Pest & disease', 'Weed', 'Water', 'Economics', 'Input use', 'Weather', 'Other',
]
export const PARAMETER_DATA_TYPES = ['number', 'text', 'date', 'choice']
/** Largest Excel file the API accepts (src/middlewares/upload.ts). */
export const MAX_UPLOAD_MB = 5

// ── Routes ───────────────────────────────────────────────────────────────────
export const ROUTES = {
  home: '/',
  centres: '/centres',
  centre: (id) => `/centres/${id}`,
  accounts: '/accounts',
  masters: '/masters',
  experiments: '/experiments',
  experiment: (id) => `/experiments/${id}`,
  trial: (id) => `/trials/${id}`,
  sheets: '/sheets',
  sheet: (id) => `/sheets/${id}`,
  myAccount: '/account',
}
