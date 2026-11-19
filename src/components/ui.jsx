import { useState } from "react";
import {
  X,
  Search,
  FileText,
  FileSpreadsheet,
  Printer,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Paperclip,
} from "lucide-react";
import { useStore } from "../store";
import { WORKFLOW_STAGES } from "../roles";

export const num = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: d });
export const lakh = (n) => `₹${num(n)} L`;
export const fmtDate = (d) =>
  d
    ? new Date(d.slice(0, 10)).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const TONES = {
  Draft: "grey",
  Submitted: "blue",
  Resubmitted: "blue",
  Scrutinised: "amber",
  Returned: "red",
  Approved: "green",
  Pending: "amber",
  Overdue: "red",
  Completed: "green",
  Open: "amber",
  "In Progress": "blue",
  Active: "green",
  Inactive: "grey",
  "In Position": "green",
  Relieved: "grey",
  Released: "amber",
  Received: "green",
  Acknowledged: "green",
  Read: "blue",
  "Not opened": "grey",
  Replied: "green",
  Scheduled: "blue",
  Held: "green",
  Ongoing: "blue",
  Proposed: "amber",
  "Not submitted": "red",
  Healthy: "green",
  Success: "green",
};
export const Badge = ({ children, tone }) => (
  <span className={`badge ${tone || TONES[children] || "grey"}`}>
    {children === "Approved" && <Lock size={10} />}
    {children}
  </span>
);

export const Page = ({ title, actions, children }) => (
  <>
    <div className="page-head">
      <h1>{title}</h1>
      {actions && <div className="row">{actions}</div>}
    </div>
    {children}
  </>
);

export const Card = ({
  title,
  actions,
  children,
  pad = true,
  className = "",
}) => (
  <section className={`card ${className}`}>
    {(title || actions) && (
      <div className="card-head">
        <h3>{title}</h3>
        <div className="row">{actions}</div>
      </div>
    )}
    {pad ? (
      <div className="card-body">{children}</div>
    ) : (
      <div style={{ paddingTop: title ? 10 : 0 }}>{children}</div>
    )}
  </section>
);

export const Stat = ({ icon: Icon, label, value, hint }) => (
  <div className="card stat">
    <div className="label">
      {Icon && (
        <span className="ico">
          <Icon size={15} />
        </span>
      )}
      {label}
    </div>
    <div className="value">{value}</div>
    {hint && <div className="hint">{hint}</div>}
  </div>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map(([id, label, count]) => (
      <button
        key={id}
        className={value === id ? "on" : ""}
        onClick={() => onChange(id)}
      >
        {label}
        {count != null && <span className="count">{count}</span>}
      </button>
    ))}
  </div>
);

export const Select = ({ value, onChange, options, all }) => (
  <select
    className="select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {all && <option value="">{all}</option>}
    {options.map((o) =>
      Array.isArray(o) ? (
        <option key={o[0]} value={o[0]}>
          {o[1]}
        </option>
      ) : (
        <option key={o}>{o}</option>
      ),
    )}
  </select>
);

export function useSearch(rows, placeholder = "Search…") {
  const [q, setQ] = useState("");
  const out = q
    ? rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(q.toLowerCase()),
      )
    : rows;
  const input = (
    <label className="search">
      <Search size={15} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
  return [out, input];
}

const cellValue = (c, r) =>
  c.render ? c.render(r) : c.text ? c.text(r) : r[c.key];

export function Table({
  columns,
  rows,
  onRow,
  empty = "No records to show",
  pageSize = 8,
  foot,
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = rows.slice(p * pageSize, (p + 1) * pageSize);
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={c.num ? "num" : ""}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr
                key={r.id}
                className={onRow ? "click" : ""}
                onClick={onRow ? () => onRow(r) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.label} className={c.num ? "num" : ""}>
                    {cellValue(c, r) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {foot && rows.length > 0 && (
            <tfoot>
              <tr>
                {foot.map((v, i) => (
                  <td key={i} className={columns[i]?.num ? "num" : ""}>
                    {v}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {!rows.length && <div className="empty">{empty}</div>}
      {rows.length > pageSize && (
        <div className="table-foot">
          <span>
            {p * pageSize + 1}–{Math.min(rows.length, (p + 1) * pageSize)} of{" "}
            {rows.length}
          </span>
          <span className="row">
            <button
              className="icon-btn"
              disabled={p === 0}
              onClick={() => setPage(p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            Page {p + 1} of {pages}
            <button
              className="icon-btn"
              disabled={p >= pages - 1}
              onClick={() => setPage(p + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </span>
        </div>
      )}
    </>
  );
}

// Excel is a real CSV download; PDF uses the browser print dialog; Word is produced server-side in the full build.
export function ExportBar({ name = "report", columns, rows }) {
  const { notify } = useStore();
  const csv = () => {
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const text = [
      columns.map((c) => cell(c.label)).join(","),
      ...rows.map((r) =>
        columns.map((c) => cell(c.text ? c.text(r) : r[c.key])).join(","),
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv" }));
    a.download = `${name}.csv`;
    a.click();
  };
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="btn ghost sm" onClick={csv}>
        <FileSpreadsheet size={14} /> Excel
      </button>
      <button className="btn ghost sm" onClick={() => window.print()}>
        <Printer size={14} /> PDF
      </button>
      <button
        className="btn ghost sm"
        onClick={() =>
          notify("Word export is generated on the server in the full build")
        }
      >
        <FileText size={14} /> Word
      </button>
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  style,
  bodyStyle,
}) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        style={{
          maxHeight: "90svh",
          display: "flex",
          flexDirection: "column",
          ...style,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head" style={{ flexShrink: 0 }}>
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="muted small">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div
          className="modal-body"
          style={{ flex: 1, overflowY: "auto", ...bodyStyle }}
        >
          {children}
        </div>
        {footer && (
          <div className="modal-foot" style={{ flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// fields: [{ name, label, type: text|number|date|select|textarea|file, options, full, required }]
export function FormModal({
  title,
  fields,
  initial = {},
  onSubmit,
  onClose,
  submitLabel = "Save",
}) {
  const [v, setV] = useState(initial);
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));
  const missing = fields.some(
    (f) =>
      f.required !== false &&
      f.type !== "file" &&
      (v[f.name] === undefined || v[f.name] === ""),
  );
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            disabled={missing}
            onClick={() => {
              onSubmit(v);
              onClose();
            }}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <div className="form">
        {fields.map((f) => (
          <div
            key={f.name}
            className={`field ${f.full || f.type === "textarea" ? "full" : ""}`}
          >
            <label>{f.label}</label>
            {f.type === "select" ? (
              <select
                value={v[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              >
                <option value="">Select…</option>
                {f.options.map((o) =>
                  Array.isArray(o) ? (
                    <option key={o[0]} value={o[0]}>
                      {o[1]}
                    </option>
                  ) : (
                    <option key={o}>{o}</option>
                  ),
                )}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                rows={3}
                value={v[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : f.type === "file" ? (
              <input
                type="file"
                onChange={(e) => set(f.name, e.target.files[0]?.name)}
              />
            ) : (
              <input
                type={f.type || "text"}
                step="any"
                value={v[f.name] ?? ""}
                onChange={(e) =>
                  set(
                    f.name,
                    f.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export const KV = ({ items }) => (
  <div className="kv">
    {items.filter(Boolean).map(([k, v]) => (
      <div key={k}>
        <span>{k}</span>
        <b>{v ?? "—"}</b>
      </div>
    ))}
  </div>
);

export const FileLink = ({ name }) =>
  name ? (
    <span className="row" style={{ gap: 4, color: "var(--blue)" }}>
      <Paperclip size={13} />
      {name}
    </span>
  ) : (
    <span className="muted">—</span>
  );

export function Steps({ status }) {
  const idx =
    {
      Draft: 0,
      Submitted: 1,
      Resubmitted: 1,
      Returned: 1,
      Scrutinised: 2,
      Approved: 3,
    }[status] ?? 0;
  return (
    <div className="steps">
      {WORKFLOW_STAGES.map((s, i) => {
        const bad = status === "Returned" && i === 1;
        const cls = bad
          ? "bad"
          : i < idx || status === "Approved"
            ? "done"
            : i === idx
              ? "now"
              : "";
        const label =
          i === 1
            ? status === "Returned"
              ? "Returned"
              : status === "Resubmitted"
                ? "Re-submitted"
                : "Submitted"
            : i === 2
              ? "Scrutiny"
              : i === 3
                ? "Approved & locked"
                : s;
        return (
          <span key={s} style={{ display: "contents" }}>
            {i > 0 && <span className="bar" />}
            <span className={`step ${cls}`}>
              <i>{cls === "done" ? <Check size={12} /> : i + 1}</i>
              <span className="hide-sm">{label}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Stage tracker, history and the actions the signed-in role may take on a record.
export function Workflow({ col, rec, prefix, onDone }) {
  const { workflowActions, transition } = useStore();
  const [remark, setRemark] = useState("");
  const actions = workflowActions(rec, prefix);
  const last = [...(rec.history || [])]
    .reverse()
    .find((h) => h.status === "Returned");
  return (
    <div className="stack" style={{ gap: 12 }}>
      <Steps status={rec.status} />
      {rec.status === "Returned" && last && (
        <div className="note bad">
          <b>Returned by {last.by}:</b> {last.remark}
        </div>
      )}
      {rec.status === "Approved" && (
        <div className="note">
          <Lock size={13} style={{ verticalAlign: -2 }} /> This record is
          approved and locked. Changes need the Project Coordinator to re-open
          it.
        </div>
      )}
      {!!rec.history?.length && (
        <div className="timeline">
          {rec.history.map((h, i) => (
            <div key={i}>
              <b>{h.status}</b>{" "}
              <span className="muted">
                · {h.by} · {h.at}
              </span>
              {h.remark && <div className="muted">{h.remark}</div>}
            </div>
          ))}
        </div>
      )}
      {actions.length > 0 && (
        <>
          {actions.some((a) => a.remark) && (
            <div className="field">
              <label>Observations / remarks</label>
              <textarea
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Required when returning a submission"
              />
            </div>
          )}
          <div className="row">
            {actions.map((a) => (
              <button
                key={a.label}
                className={`btn ${a.tone === "danger" ? "danger" : ""}`}
                disabled={a.remark && !remark.trim()}
                onClick={() => {
                  transition(col, rec, a.to, remark.trim() || undefined);
                  onDone?.();
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Spreadsheet-style grid used for research and financial data entry.
export function EntryGrid({
  columns,
  rows,
  editable,
  onChange,
  addLabel = "Add row",
}) {
  const set = (i, k, v) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <div className="table-wrap">
        <table className={`entry ${editable ? "" : "ro"}`}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.num ? "num" : ""}>
                  {c.label}
                </th>
              ))}
              {editable && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} className={c.num ? "num" : ""}>
                    {!editable || c.readOnly ? (
                      c.num ? (
                        num(r[c.key])
                      ) : (
                        r[c.key] || "—"
                      )
                    ) : c.options ? (
                      <select
                        value={r[c.key] ?? ""}
                        onChange={(e) => set(i, c.key, e.target.value)}
                      >
                        <option value="">—</option>
                        {c.options.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.num ? "number" : "text"}
                        step="any"
                        className={c.num ? "num" : ""}
                        value={r[c.key] ?? ""}
                        onChange={(e) =>
                          set(
                            i,
                            c.key,
                            c.num ? Number(e.target.value) : e.target.value,
                          )
                        }
                      />
                    )}
                  </td>
                ))}
                {editable && (
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => onChange(rows.filter((_, j) => j !== i))}
                      aria-label="Remove row"
                    >
                      <X size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <div className="empty">No rows entered</div>}
      {editable && (
        <button
          className="btn ghost sm"
          style={{ marginTop: 8 }}
          onClick={() =>
            onChange([
              ...rows,
              Object.fromEntries(columns.map((c) => [c.key, c.num ? 0 : ""])),
            ])
          }
        >
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </div>
  );
}

// ---- Minimal charts (no chart library)
export function Bars({ data, fmt = num, max, legend }) {
  const top =
    max || Math.max(1, ...data.map((d) => Math.max(d.value, d.value2 || 0)));
  return (
    <div className="bars">
      {legend && (
        <div className="legend">
          <span>
            <i style={{ background: "var(--brand)" }} />
            {legend[0]}
          </span>
          {legend[1] && (
            <span>
              <i style={{ background: "var(--accent)" }} />
              {legend[1]}
            </span>
          )}
        </div>
      )}
      {data.map((d) => (
        <div className="bar-row" key={d.label}>
          <span className="lbl" title={d.label}>
            {d.label}
          </span>
          <span style={{ display: "grid", gap: 3 }}>
            <span className="track">
              <span
                className="fill"
                style={{ width: `${(d.value / top) * 100}%`, display: "block" }}
              />
            </span>
            {d.value2 != null && (
              <span className="track">
                <span
                  className="fill alt"
                  style={{
                    width: `${(d.value2 / top) * 100}%`,
                    display: "block",
                  }}
                />
              </span>
            )}
          </span>
          <span className="num">{fmt(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

const DONUT_COLOURS = {
  green: "#1b7f4b",
  blue: "#2457ad",
  amber: "#e39a1d",
  red: "#c8443c",
  grey: "#aab3ad",
};
export function Donut({ segments, centre }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const R = 42,
    C = 2 * Math.PI * R;
  return (
    <div className="donut">
      <svg
        width="124"
        height="124"
        viewBox="0 0 110 110"
        role="img"
        aria-label="Status breakdown"
      >
        <circle
          cx="55"
          cy="55"
          r={R}
          fill="none"
          stroke="#eef1ee"
          strokeWidth="13"
        />
        {segments
          .filter((s) => s.value)
          .map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="55"
                cy="55"
                r={R}
                fill="none"
                stroke={DONUT_COLOURS[s.tone] || s.tone}
                strokeWidth="13"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                transform="rotate(-90 55 55)"
              />
            );
            acc += len;
            return el;
          })}
        <text
          x="55"
          y="53"
          textAnchor="middle"
          fontSize="19"
          fontWeight="650"
          fill="#1b2420"
        >
          {centre ?? total}
        </text>
        <text x="55" y="68" textAnchor="middle" fontSize="8.5" fill="#647069">
          total
        </text>
      </svg>
      <ul>
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: DONUT_COLOURS[s.tone] || s.tone }} />
            {s.label} <b>{s.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Progress = ({ value }) => (
  <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
    <div className="progress grow">
      <div
        style={{
          width: `${Math.min(100, value)}%`,
          background: value > 100 ? "var(--red)" : undefined,
        }}
      />
    </div>
    <span className="small muted" style={{ width: 38, textAlign: "right" }}>
      {num(value, 0)}%
    </span>
  </div>
);
