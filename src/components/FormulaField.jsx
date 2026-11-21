import { useRef } from "react";

// The formula of a calculated parameter. Formulas refer to other parameters by their generated
// code (PRM_001 …), which nobody remembers, so the field offers a picker that inserts a code at the
// cursor, and below it shows the formula with the parameters' names.

const IDENT = /(\d+(?:\.\d+)?)|([A-Za-z][A-Za-z0-9_]*)/g;

/** "PRM_012 / PRM_013" → "Net returns / Cost of cultivation" (unknown codes stay as written). */
export const formulaWithNames = (formula, nameOf) =>
  String(formula ?? "").replace(IDENT, (match, num, id) => {
    if (num !== undefined || id === undefined) return match;
    if (id.toUpperCase() === "IFEMPTY") return "IFEMPTY";
    return nameOf(id.toUpperCase()) ?? match;
  });

/**
 * @param parameters  the library: [{ code, name, dataType, formula }] (number ones can be used)
 * @param exceptCode  the parameter being edited (a formula can't use itself)
 */
export function FormulaField({ id, value, onChange, parameters, exceptCode }) {
  const box = useRef(null);
  const usable = parameters
    .filter((p) => p.dataType === "number" && p.code !== exceptCode)
    .sort((a, b) => a.name.localeCompare(b.name));
  const names = new Map(parameters.map((p) => [p.code, p.name]));

  const insert = (text) => {
    const el = box.current;
    const current = value ?? "";
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    // Keep a space between the inserted text and what's around it (not inside brackets).
    const left = before && !/[\s(]$/.test(before) ? " " : "";
    const right = after && !/^[\s),]/.test(after) ? " " : "";
    const next = `${before}${left}${text}${right}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = before.length + left.length + text.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const readable = value ? formulaWithNames(value, (c) => names.get(c)) : "";

  return (
    <div className="stack" style={{ gap: 6 }}>
      <textarea
        id={id}
        ref={box}
        rows={2}
        className="mono"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. PRM_012 / PRM_013"
      />
      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
        <select
          aria-label="Insert a parameter"
          value=""
          onChange={(e) => e.target.value && insert(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        >
          <option value="">Insert a parameter…</option>
          {usable.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name} ({p.code}){p.formula ? " · calculated" : ""}
            </option>
          ))}
        </select>
        {["+", "-", "*", "/", "(", ")"].map((op) => (
          <button
            key={op}
            type="button"
            className="btn ghost sm mono"
            onClick={() => insert(op)}
            aria-label={`Insert ${op}`}
          >
            {op}
          </button>
        ))}
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => insert("IFEMPTY(")}
          title="IFEMPTY(value, fallback): use the fallback when the value is missing"
        >
          IFEMPTY
        </button>
      </div>
      {readable && readable !== value && (
        <span className="small" style={{ lineHeight: 1.4 }}>
          <span className="muted">Reads as: </span>
          {readable}
        </span>
      )}
    </div>
  );
}
