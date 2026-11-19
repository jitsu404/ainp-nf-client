import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveModal } from "../../../components/forms";

export function TreatmentsModal({ experiment, save, onClose }) {
  const original = new Set(experiment.treatments.map((t) => t.code));
  const [rows, setRows] = useState(() =>
    experiment.treatments.length
      ? experiment.treatments.map((t) => ({
          code: t.code,
          name: t.name,
          description: t.description ?? "",
        }))
      : [{ code: "T1", name: "", description: "" }],
  );
  const set = (i, k, value) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: value } : row)));
  const add = () =>
    setRows((r) => [
      ...r,
      { code: `T${r.length + 1}`, name: "", description: "" },
    ]);
  const remove = (i) => setRows((r) => r.filter((_, j) => j !== i));
  // Treatments with recorded data can't be removed or renamed by code (the API also refuses).
  const frozen = (row) => experiment.dataLocked && original.has(row.code);
  const codes = rows.map((r) => r.code.trim().toUpperCase());
  const valid =
    rows.every((r) => r.code.trim() && r.name.trim()) &&
    new Set(codes).size === codes.length;

  return (
    <SaveModal
      title="Treatments"
      subtitle="The common treatments every centre applies (T1, T2 …)."
      canSave={valid}
      onSave={() =>
        save({
          treatments: rows.map((r) => ({
            code: r.code.trim(),
            name: r.name.trim(),
            ...(r.description.trim()
              ? { description: r.description.trim() }
              : {}),
          })),
        })
      }
      onClose={onClose}
    >
      {!valid && rows.length > 0 && (
        <div className="note warn">
          Every treatment needs a unique code and a name.
        </div>
      )}
      <div className="stack" style={{ gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} className="editor-row">
            <input
              aria-label="Code"
              value={r.code}
              disabled={frozen(r)}
              onChange={(e) => set(i, "code", e.target.value)}
              className="select"
            />
            <input
              aria-label="Treatment name"
              value={r.name}
              onChange={(e) => set(i, "name", e.target.value)}
              placeholder="Treatment, e.g. Complete NF"
              className="select"
            />
            <input
              aria-label="Details"
              value={r.description}
              onChange={(e) => set(i, "description", e.target.value)}
              placeholder="Details (optional)"
              className="select"
            />
            <button
              className="icon-btn"
              aria-label={`Remove ${r.code}`}
              title={frozen(r) ? "Has recorded data" : "Remove"}
              disabled={frozen(r)}
              onClick={() => remove(i)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <div>
          <button className="btn ghost sm" onClick={add}>
            <Plus size={14} /> Add treatment
          </button>
        </div>
      </div>
    </SaveModal>
  );
}
