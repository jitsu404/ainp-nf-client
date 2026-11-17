// Small helpers for presenting results: number formatting and comparison with a reference
// treatment, shared by the per-sheet analysis and the cross-centre summary.

/** Number in Indian grouping with up to `d` decimals; "—" when missing. */
export const fmt = (x, d = 2) =>
  x === null || x === undefined
    ? "—"
    : Number(x).toLocaleString("en-IN", { maximumFractionDigits: d });

/** % difference of `value` from `reference` (null when either is missing or reference is 0). */
export const pctVs = (value, reference) =>
  value === null || value === undefined || !reference
    ? null
    : ((value - reference) / Math.abs(reference)) * 100;

/** "+12.3 %" / "−4.0 %" / "—". */
export const fmtPct = (pct) =>
  pct === null || pct === undefined
    ? "—"
    : `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${Math.abs(pct).toFixed(1)} %`;
