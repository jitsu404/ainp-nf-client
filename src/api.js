// Thin client for the icar-nf-backend REST API.
// The base URL comes from config/constants.js. By default it is '/api/v1' and Vite proxies it to
// the backend (vite.config.js). A full URL (VITE_API_BASE_URL) also works, provided the backend's
// CLIENT_ORIGIN is set to this app's origin.

import {
  API_BASE_URL,
  PASSWORD_CHANGE_REQUIRED,
  SESSION_ENDED_CODES,
} from "./config/constants";

/** An error response from the API: { code, message, details, requestId, status }. */
export class ApiError extends Error {
  constructor(
    status,
    {
      code = "UNKNOWN",
      message = "Something went wrong",
      details,
      requestId,
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    /** Set once the auth layer has dealt with it, so the global handler doesn't report it again. */
    this.handled = false;
  }

  /** Field-level messages from a 400 VALIDATION_ERROR, e.g. { email: ['Invalid email'] }. */
  get fieldErrors() {
    return (
      this.details?.body?.fieldErrors ?? this.details?.query?.fieldErrors ?? {}
    );
  }

  /** True when the session is over or blocked; the auth layer handles these. */
  get isSessionError() {
    return (
      SESSION_ENDED_CODES.includes(this.code) ||
      this.code === PASSWORD_CHANGE_REQUIRED
    );
  }
}

// Lets the auth layer react when the session ends or a password change becomes required.
let onSessionError = () => {};
export const setSessionErrorHandler = (fn) => {
  onSessionError = fn;
};

async function send(method, path, body) {
  const isForm = body instanceof FormData;
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      // 'include' so the session cookie is stored and sent even when the API is on another origin
      // of the same site (e.g. VITE_API_BASE_URL=http://localhost:5000/api/v1, or api.nf.example.in).
      // The backend allows this only for CLIENT_ORIGIN (CORS with credentials), and SameSite=Strict
      // still keeps the cookie away from other sites.
      credentials: "include",
      // FormData sets its own multipart Content-Type (with the boundary).
      headers:
        body !== undefined && !isForm
          ? { "Content-Type": "application/json" }
          : undefined,
      body:
        body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: "Cannot reach the server. Check your connection and try again.",
    });
  }
}

async function failure(res, path) {
  const json = await res.json().catch(() => null);
  const error = new ApiError(
    res.status,
    json?.error ?? { message: `Request failed (${res.status})` },
  );
  // Auth endpoints report their own errors (e.g. wrong password on the sign-in form).
  if (error.isSessionError && !path.startsWith("/auth/")) {
    error.handled = true;
    onSessionError(error);
  }
  return error;
}

async function request(method, path, body) {
  const res = await send(method, path, body);
  if (res.status === 204) return { data: null };
  if (!res.ok) throw await failure(res, path);
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new ApiError(res.status, json?.error);
  return { data: json.data, meta: json.meta };
}

/** Downloads a file response (e.g. an Excel template) and saves it with the server's file name. */
async function download(path, fallbackName = "download.xlsx") {
  const res = await send("GET", path);
  if (!res.ok) throw await failure(res, path);
  const name =
    /filename="?([^";]+)"?/.exec(
      res.headers.get("Content-Disposition") ?? "",
    )?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Uploads one file as multipart field "file". */
const upload = (path, file) => {
  const form = new FormData();
  form.append("file", file);
  return request("POST", path, form);
};

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const api = {
  get: (path, params) => request("GET", `${path}${qs(params)}`),
  post: (path, body = {}) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
  download: (path, params, name) => download(`${path}${qs(params)}`, name),
  upload: (path, file, params) => upload(`${path}${qs(params)}`, file),
};

// ── Endpoints ────────────────────────────────────────────────────────────────
export const authApi = {
  me: () => api.get("/auth/me"),
  login: (email, password) => api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

export const centresApi = {
  list: (params) => api.get("/centres", params),
  get: (id) => api.get(`/centres/${id}`),
  create: (body) => api.post("/centres", body),
  update: (id, body) => api.patch(`/centres/${id}`, body),
  pis: (id) => api.get(`/centres/${id}/pis`),
  assignPi: (id, body) => api.post(`/centres/${id}/pi`, body),
};

export const usersApi = {
  list: (params) => api.get("/users", params),
  roles: () => api.get("/users/roles"),
  create: (body) => api.post("/users", body),
  update: (id, body) => api.patch(`/users/${id}`, body),
  deactivate: (id, reason) => api.post(`/users/${id}/deactivate`, { reason }),
  activate: (id) => api.post(`/users/${id}/activate`),
  resetPassword: (id, temporaryPassword) =>
    api.post(`/users/${id}/reset-password`, { temporaryPassword }),
};

// Lookup lists (seasons, units, crops …), financial years and the parameter library.
export const mastersApi = {
  types: () => api.get("/masters/types"),
  list: (type, params) => api.get(`/masters/${type}`, params),
  create: (type, body) => api.post(`/masters/${type}`, body),
  update: (type, id, body) => api.patch(`/masters/${type}/${id}`, body),
  template: (type) => api.download(`/masters/${type}/import-template`),
  importFile: (type, file, dryRun) =>
    api.upload(`/masters/${type}/import`, file, { dryRun }),
};

export const financialYearsApi = {
  list: () => api.get("/financial-years"),
  create: (body) => api.post("/financial-years", body),
  update: (id, body) => api.patch(`/financial-years/${id}`, body),
};

export const parametersApi = {
  list: (params) => api.get("/parameters", params),
  create: (body) => api.post("/parameters", body),
  update: (id, body) => api.patch(`/parameters/${id}`, body),
  template: () => api.download("/parameters/import-template"),
  importFile: (file, dryRun) =>
    api.upload("/parameters/import", file, { dryRun }),
};

// Research: PCU experiments → centre trials → observation sheets.
export const experimentsApi = {
  list: (params) => api.get("/experiments", params),
  get: (id) => api.get(`/experiments/${id}`),
  create: (body) => api.post("/experiments", body),
  update: (id, body) => api.patch(`/experiments/${id}`, body),
};

export const trialsApi = {
  list: (params) => api.get("/trials", params),
  get: (id) => api.get(`/trials/${id}`),
  update: (id, body) => api.patch(`/trials/${id}`, body),
};

export const sheetsApi = {
  list: (params) => api.get("/sheets", params),
  get: (id) => api.get(`/sheets/${id}`),
  create: (body) => api.post("/sheets", body),
  saveValues: (id, values) => api.put(`/sheets/${id}/values`, { values }),
  submit: (id, remark) => api.post(`/sheets/${id}/submit`, { remark }),
  returnSheet: (id, remark) => api.post(`/sheets/${id}/return`, { remark }),
  approve: (id, remark) => api.post(`/sheets/${id}/approve`, { remark }),
  template: (id) => api.download(`/sheets/${id}/template`),
  importFile: (id, file, dryRun) =>
    api.upload(`/sheets/${id}/import`, file, { dryRun }),
  analysis: (id) => api.get(`/sheets/${id}/analysis`),
  summary: (params) => api.get("/sheets/summary", params),
  reporting: (experimentId) => api.get("/sheets/reporting", { experimentId }),
};

// Audit trail (read-only). Centre users get only their own centre's activity.
export const auditApi = {
  list: (params) => api.get("/audit", params),
  exportFile: (params) => api.download("/audit/export", params),
};

// Budget Allocations: ICAR sanctions (isTotal) & head-wise allocations.
export const budgetAllocationsApi = {
  list: (params) => api.get("/budget-allocations", params),
  get: (id) => api.get(`/budget-allocations/${id}`),
  create: (body) => api.post("/budget-allocations", body),
  bulkSave: (body) => api.post("/budget-allocations/bulk", body),
  update: (id, body) => api.patch(`/budget-allocations/${id}`, body),
  remove: (id) => api.delete(`/budget-allocations/${id}`),
};
