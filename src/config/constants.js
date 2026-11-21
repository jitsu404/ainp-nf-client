// App-wide constants. Values that differ per environment come from Vite env variables
// (VITE_*, set in .env.local or the hosting dashboard); the rest are fixed here.
// Programme branding (names, institute, address) lives in src/programme/config.js.

// ── API ──────────────────────────────────────────────────────────────────────
/**
 * Base URL of the REST API. Production builds always use '/api/v1' on the app's own domain:
 * vercel.json forwards it to the backend on Render, so the SameSite=Strict session cookie belongs
 * to this site. Calling the Render URL directly would be cross-site and the browser would drop the
 * cookie, so a VITE_API_BASE_URL set in the hosting dashboard is ignored on purpose.
 * In development, '/api/v1' goes through the Vite proxy (vite.config.js); VITE_API_BASE_URL can
 * point it elsewhere there.
 */
// Don't simplify to `import.meta.env.VITE_API_BASE_URL.replace(…)`: the variable is unset on Vercel
// (on purpose), so that crashes the whole app on load in production.
export const API_BASE_URL = (
  import.meta.env.PROD
    ? "/api/v1"
    : (import.meta.env.VITE_API_BASE_URL ?? "/api/v1")
).replace(/\/$/, "");

/** API error codes that mean "the session is no longer usable". */
export const SESSION_ENDED_CODES = [
  "AUTH_REQUIRED",
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
  "SESSION_EXPIRED",
];
export const PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

/** The API's maximum page size; lists that load "everything" (e.g. 20-odd centres) use it. */
export const MAX_PAGE_SIZE = 100;

// ── Data fetching (TanStack Query) ───────────────────────────────────────────
export const QUERY_STALE_TIME_MS = 30_000; // data counts as fresh for 30 s, then refetches in the background
export const QUERY_GC_TIME_MS = 5 * 60_000; // unused cache entries are dropped after 5 min
export const QUERY_RETRY_COUNT = 2; // network and 5xx errors only; 4xx are never retried
export const REFERENCE_STALE_TIME_MS = 5 * 60_000; // masters, years, parameters change rarely

// ── UI ───────────────────────────────────────────────────────────────────────
export const TOAST_DURATION_MS = 3500;
export const ERROR_TOAST_DURATION_MS = 6000;
export const SEARCH_DEBOUNCE_MS = 300;
export const TABLE_PAGE_SIZE = 12;

// ── Domain values ────────────────────────────────────────────────────────────
export const HOST_TYPES = ["SAU", "ICAR", "CAU", "Deemed University", "Other"];
export const DEFAULT_PI_DESIGNATION = "Agronomist";
/** Must match TITLES in icar-nf-backend/src/modules/users/users.names.ts. */
export const TITLES = ["Dr", "Prof", "Mr", "Mrs", "Ms"];
/** Default organization for PCU and Super Admin accounts. */
export const PCU_ORGANIZATION =
  "ICAR-Indian Institute of Farming Systems Research, Modipuram";

/** Must match passwordSchema in icar-nf-backend/src/modules/users/users.dto.ts. */
export const PASSWORD_RULE = {
  text: "At least 10 characters, with a letter and a digit.",
  test: (p) => p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p),
};

// Research. Each must match the backend model of the same name.
// Designs as named in the AINP-NF Annual Report. Must match EXPERIMENT_DESIGNS and the two lists
// below in icar-nf-backend/src/modules/experiments/experiments.model.ts.
export const EXPERIMENT_DESIGNS = [
  "RBD",
  "Split plot",
  "Split-split plot",
  "Factorial",
  "Strip plot",
  "Non-replicated",
  "Farmer participatory",
  "Survey",
];
export const DESIGN_HINTS = {
  RBD: "Randomized (complete) block design. Treatment ANOVA, CD and CV are calculated.",
  "Split plot":
    "Main plots × sub plots; each plot holds every treatment × replication. ANOVA per plot.",
  "Strip plot":
    "Horizontal × vertical strips, each holding every treatment (× replication, if replicated). ANOVA per plot when replicated.",
  "Split-split plot":
    "Main plots × sub plots × sub-sub plots with replications. Treatment ANOVA calculated.",
  "Split split plot":
    "Main plots × sub plots × sub-sub plots with replications. Treatment ANOVA calculated.",
  Factorial:
    "Factorial design evaluating multiple factors and their interactions.",
  "Non-replicated": "Large plots, one value per treatment.",
  "Farmer participatory":
    "Validation in farmers’ fields (e.g. SCSP/STC). One value per treatment.",
  Survey: "Characterization survey (e.g. geo-referenced). One value per item.",
};
/**
 * Laid out in main plots × sub plots; each plot is a complete RBD (every treatment × replication).
 * Must match DESIGNS_WITH_PLOTS and MAX_PLOT_COUNT in the backend.
 */
export const DESIGNS_WITH_PLOTS = [
  "Split plot",
  "Strip plot",
  "Split-split plot",
];
export const MAX_PLOT_COUNT = 10;
/** Designs whose treatments are combinations of factor levels. Must match the backend. */
export const DESIGNS_WITH_FACTORS = [
  "Split plot",
  "Split-split plot",
  "Factorial",
];
/**
 * The experiment's factors (as the backend's experimentFactors): split / split-split plot → main,
 * sub, sub-sub plot; factorial → factors A, B, C. Each has the treatment field holding its level
 * (`mainPlotCode` …) and its levels (M1 … / S1 … / SS1 …, with names where given). [] otherwise.
 */
export const experimentFactors = (e) => {
  if (!DESIGNS_WITH_FACTORS.includes(e?.design)) return [];
  const factorial = e.design === "Factorial";
  const levels = (prefix, count, data) =>
    Array.from({ length: count ?? 0 }, (_, i) => {
      const code = `${prefix}${i + 1}`;
      return { code, name: data?.find((d) => d.code === code)?.name || null };
    });
  return [
    {
      key: "A",
      label: factorial ? "Factor A" : "Main plot",
      field: "mainPlotCode",
      levels: levels("M", e.mainPlotCount, e.mainPlotData),
    },
    {
      key: "B",
      label: factorial ? "Factor B" : "Sub plot",
      field: "subPlotCode",
      levels: levels("S", e.subPlotCount, e.subPlotData),
    },
    {
      key: "C",
      label: factorial ? "Factor C" : "Sub-sub plot",
      field: "subSubPlotCode",
      levels: levels("SS", e.subSubPlotCount, e.subSubPlotData),
    },
  ].filter(
    (f) => f.levels.length && (f.key !== "C" || e.design !== "Split plot"),
  );
};
/** At least 2 replications. */
export const DESIGNS_NEEDING_REPLICATIONS = [
  "RBD",
  "Split plot",
  "Split-split plot",
  "Factorial",
];
/** Never replicated (data is one value per treatment). Strip plot may be either. */
export const UNREPLICATED_DESIGNS = [
  "Non-replicated",
  "Farmer participatory",
  "Survey",
];
/**
 * Sheets are recorded per year: the year the season starts in (Kharif 2026 and Rabi 2026 are
 * both 2026). The years come only from the experiment: every year from its start to its end.
 */
export const experimentYears = (e) =>
  e?.startYear
    ? Array.from(
        { length: Math.max(0, (e.endYear ?? e.startYear) - e.startYear + 1) },
        (_, i) => e.startYear + i,
      )
    : [];
/** The experiment's year to show first: this year if it runs now, else its nearest year. */
export const defaultExperimentYear = (e) => {
  const years = experimentYears(e);
  const now = new Date().getFullYear();
  if (!years.length) return "";
  return Math.min(Math.max(now, years[0]), years.at(-1));
};
/**
 * Lists whose codes the server generates (never typed, never changed). Must match CODE_SERIES in
 * icar-nf-backend/src/modules/counters/counters.service.ts.
 */
export const GENERATED_CODES = {
  crop: "CRP-001",
  unit: "UNT-001",
  parameter: "PRM_001",
};
export const EXPERIMENT_STATUSES = ["Draft", "Active", "Closed"];
export const TRIAL_STATUSES = ["Setup", "Running", "Completed"];
export const SHEET_STATUSES = ["Draft", "Submitted", "Returned", "Approved"];
export const PARAMETER_LEVELS = [
  ["plot", "Per plot (treatment × replication)"],
  ["treatment", "Once per treatment"],
];
export const PARAMETER_CATEGORIES = [
  "Growth",
  "Yield",
  "Quality",
  "Soil chemical",
  "Soil physical",
  "Soil biological",
  "Plant nutrient",
  "Pest & disease",
  "Weed",
  "Water",
  "Economics",
  "Input use",
  "Weather",
  "Other",
];
export const PARAMETER_DATA_TYPES = ["number", "text", "date", "choice"];
/** Labels for the `module` of audit-trail rows (the backend's MODULE names). */
export const AUDIT_MODULES = {
  auth: "Sign-in",
  users: "Users",
  centres: "Centres",
  masters: "Masters",
  financialYears: "Financial years",
  parameters: "Parameters",
  experiments: "Experiments",
  trials: "Trials",
  sheets: "Observation sheets",
  "budget-allocation": "Budget allocation",
};
export const AUDIT_PAGE_SIZE = 25;

/** Largest Excel file the API accepts (src/middlewares/upload.ts). */
export const MAX_UPLOAD_MB = 5;

// ── Routes ───────────────────────────────────────────────────────────────────
export const ROUTES = {
  // Public site (anyone, signed in or not).
  landing: "/",
  about: "/about",
  publications: "/publications",
  annualReports: "/annual-reports",
  login: "/login",
  // The signed-in app; `home` is its dashboard.
  home: "/dashboard",
  centres: "/centres",
  centre: (id) => `/centres/${id}`,
  accounts: "/accounts",
  experimentPis: "/experiment-pis",
  masters: "/masters",
  experiments: "/experiments",
  experiment: (id) => `/experiments/${id}`,
  trial: (id) => `/trials/${id}`,
  sheets: "/sheets",
  sheet: (id) => `/sheets/${id}`,
  budgetAllocations: "/budget-allocations",
  audit: "/audit",
  myAccount: "/account",
};
