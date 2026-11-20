import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveModal } from "../../../components/forms";

export function TreatmentsModal({
  experiment,
  type = "treatments",
  save,
  onClose,
}) {
  const isMainPlot = type === "mainPlot";
  const isSubPlot = type === "subPlot";
  const isPlot = isMainPlot || isSubPlot;

  const targetCount = isMainPlot
    ? (experiment.mainPlotCount ?? 0)
    : isSubPlot
      ? (experiment.subPlotCount ?? 0)
      : null;

  const fieldKey = isMainPlot
    ? "mainPlotData"
    : isSubPlot
      ? "subPlotData"
      : "treatments";

  const prefix = isMainPlot ? "M" : isSubPlot ? "S" : "T";

  const existingList = isMainPlot
    ? (experiment.mainPlotData ?? [])
    : isSubPlot
      ? (experiment.subPlotData ?? [])
      : (experiment.treatments ?? []);

  const original = new Set(existingList.map((t) => t.code));

  const [rows, setRows] = useState(() => {
    if (existingList.length) {
      return existingList.map((t) => ({
        code: t.code,
        name: t.name,
        description: t.description ?? "",
      }));
    }
    if (isPlot && targetCount > 0) {
      return Array.from({ length: targetCount }, (_, idx) => ({
        code: `${prefix}${idx + 1}`,
        name: "",
        description: "",
      }));
    }
    return [{ code: `${prefix}1`, name: "", description: "" }];
  });

  const set = (i, k, value) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: value } : row)));

  const add = () => {
    if (isPlot && rows.length >= targetCount) return;
    setRows((r) => [
      ...r,
      { code: `${prefix}${r.length + 1}`, name: "", description: "" },
    ]);
  };

  const remove = (i) => setRows((r) => r.filter((_, j) => j !== i));
  const frozen = (row) => experiment.dataLocked && original.has(row.code);
  const codes = rows.map((r) => r.code.trim().toUpperCase());

  const countValid = !isPlot || rows.length === targetCount;
  const valid =
    countValid &&
    rows.length > 0 &&
    rows.every((r) => r.code.trim() && r.name.trim()) &&
    new Set(codes).size === codes.length;

  const title = isMainPlot
    ? "Main Plot"
    : isSubPlot
      ? "Sub Plot"
      : "Treatments";

  const subtitle = isMainPlot
    ? `The main plots configured for this Split plot experiment (${targetCount} required).`
    : isSubPlot
      ? `The sub plots configured for this Split plot experiment (${targetCount} required).`
      : "The common treatments every centre applies (T1, T2 …).";

  return (
    <SaveModal
      title={title}
      subtitle={subtitle}
      canSave={valid}
      onSave={() =>
        save({
          [fieldKey]: rows.map((r) => ({
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
      {isPlot && targetCount <= 0 && (
        <div className="note warn">
          {isMainPlot ? "Main Plot Count" : "Sub Plot Count"} is 0. Please set
          the count in Edit details before saving.
        </div>
      )}
      {isPlot && targetCount > 0 && rows.length !== targetCount && (
        <div className="note warn">
          Exactly {targetCount} {isMainPlot ? "main plots" : "sub plots"} must
          be configured (currently {rows.length}).
        </div>
      )}
      {!valid && rows.length > 0 && (
        <div className="note warn">
          Every{" "}
          {isMainPlot ? "main plot" : isSubPlot ? "sub plot" : "treatment"}{" "}
          needs a unique code and a name.
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
              aria-label={
                isMainPlot
                  ? "Main plot name"
                  : isSubPlot
                    ? "Sub plot name"
                    : "Treatment name"
              }
              value={r.name}
              onChange={(e) => set(i, "name", e.target.value)}
              placeholder={
                isMainPlot
                  ? "Main plot name, e.g. Natural farming system"
                  : isSubPlot
                    ? "Sub plot name, e.g. Desi variety"
                    : "Treatment, e.g. Complete NF"
              }
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
          <button
            className="btn ghost sm"
            onClick={add}
            disabled={isPlot && rows.length >= targetCount}
          >
            <Plus size={14} /> Add{" "}
            {isMainPlot ? "main plot" : isSubPlot ? "sub plot" : "treatment"}
          </button>
          {isPlot && (
            <span className="muted small" style={{ marginLeft: 10 }}>
              {rows.length} of {targetCount} configured
            </span>
          )}
        </div>
      </div>
    </SaveModal>
  );
}
