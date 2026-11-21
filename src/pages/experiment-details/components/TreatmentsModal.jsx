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
  const isSubSubPlot = type === "subSubPlot";
  const isPlot = isMainPlot || isSubPlot || isSubSubPlot;

  const isSplitPlot = experiment?.design === "Split plot";
  const isSplitSplitPlot = experiment?.design === "Split-split plot";
  const isDerivedTreatments = !isPlot && (isSplitPlot || isSplitSplitPlot);

  const mCount = experiment?.mainPlotCount ?? 0;
  const sCount = experiment?.subPlotCount ?? 0;
  const ssCount = isSplitSplitPlot ? (experiment?.subSubPlotCount ?? 0) : 0;

  const targetCount = isPlot
    ? isMainPlot
      ? mCount
      : isSubPlot
        ? sCount
        : isSubSubPlot
          ? ssCount
          : null
    : isDerivedTreatments
      ? isSplitSplitPlot
        ? mCount * sCount * ssCount
        : mCount * sCount
      : null;

  const fieldKey = isMainPlot
    ? "mainPlotData"
    : isSubPlot
      ? "subPlotData"
      : isSubSubPlot
        ? "subSubPlotData"
        : "treatments";

  const prefix = isMainPlot ? "M" : isSubPlot ? "S" : isSubSubPlot ? "SS" : "T";

  const existingList = isMainPlot
    ? (experiment.mainPlotData ?? [])
    : isSubPlot
      ? (experiment.subPlotData ?? [])
      : isSubSubPlot
        ? (experiment.subSubPlotData ?? [])
        : (experiment.treatments ?? []);

  const original = new Set(existingList.map((t) => t.code));

  const mainPlotName = (code) =>
    (experiment.mainPlotData ?? []).find((t) => t.code === code)?.name || "";
  const subPlotName = (code) =>
    (experiment.subPlotData ?? []).find((t) => t.code === code)?.name || "";
  const subSubPlotName = (code) =>
    (experiment.subSubPlotData ?? []).find((t) => t.code === code)?.name || "";

  const generateDerivedRows = () => {
    if (mCount <= 0 || sCount <= 0 || (isSplitSplitPlot && ssCount <= 0)) {
      return [];
    }
    const existing = experiment?.treatments ?? [];
    const existingMap = new Map();
    for (const t of existing) {
      if (t.mainPlotCode && t.subPlotCode) {
        const key = `${t.mainPlotCode}|${t.subPlotCode}|${t.subSubPlotCode ?? ""}`;
        existingMap.set(key, t);
      }
    }

    const generated = [];
    let idx = 1;
    for (let m = 1; m <= mCount; m++) {
      for (let s = 1; s <= sCount; s++) {
        if (isSplitSplitPlot) {
          for (let ss = 1; ss <= ssCount; ss++) {
            const key = `M${m}|S${s}|SS${ss}`;
            const match = existingMap.get(key) || existing[idx - 1];
            generated.push({
              code: `T${idx}`,
              mainPlotCode: `M${m}`,
              subPlotCode: `S${s}`,
              subSubPlotCode: `SS${ss}`,
              name: match?.name ?? "",
              description: match?.description ?? "",
            });
            idx++;
          }
        } else {
          const key = `M${m}|S${s}|`;
          const match = existingMap.get(key) || existing[idx - 1];
          generated.push({
            code: `T${idx}`,
            mainPlotCode: `M${m}`,
            subPlotCode: `S${s}`,
            subSubPlotCode: null,
            name: match?.name ?? "",
            description: match?.description ?? "",
          });
          idx++;
        }
      }
    }
    return generated;
  };

  const [rows, setRows] = useState(() => {
    if (isDerivedTreatments) {
      return generateDerivedRows();
    }
    if (existingList.length) {
      return existingList.map((t) => ({
        code: t.code,
        name: t.name,
        description: t.description ?? "",
        mainPlotCode: t.mainPlotCode ?? null,
        subPlotCode: t.subPlotCode ?? null,
        subSubPlotCode: t.subSubPlotCode ?? null,
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
    if (isDerivedTreatments) return;
    if (isPlot && rows.length >= targetCount) return;
    setRows((r) => [
      ...r,
      { code: `${prefix}${r.length + 1}`, name: "", description: "" },
    ]);
  };

  const remove = (i) => {
    if (isDerivedTreatments) return;
    setRows((r) => r.filter((_, j) => j !== i));
  };

  const frozen = (row) => experiment.dataLocked && original.has(row.code);
  const codes = rows.map((r) => r.code.trim().toUpperCase());

  const countValid =
    !isPlot && !isDerivedTreatments
      ? true
      : targetCount != null && targetCount > 0 && rows.length === targetCount;

  const valid =
    countValid &&
    rows.length > 0 &&
    rows.every((r) => r.code.trim() && r.name.trim()) &&
    new Set(codes).size === codes.length;

  const title = isMainPlot
    ? "Main Plot"
    : isSubPlot
      ? "Sub Plot"
      : isSubSubPlot
        ? "Sub-sub Plot"
        : "Treatments";

  const subtitle = isMainPlot
    ? `The main plots configured for this experiment (${targetCount} required).`
    : isSubPlot
      ? `The sub plots configured for this experiment (${targetCount} required).`
      : isSubSubPlot
        ? `The sub-sub plots configured for this Split-split plot experiment (${targetCount} required).`
        : isDerivedTreatments
          ? isSplitSplitPlot
            ? `Fixed treatment combinations for Split-split plot (${targetCount} required: ${mCount} Main × ${sCount} Sub × ${ssCount} Sub-sub).`
            : `Fixed treatment combinations for Split plot (${targetCount} required: ${mCount} Main × ${sCount} Sub).`
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
            mainPlotCode: r.mainPlotCode ?? null,
            subPlotCode: r.subPlotCode ?? null,
            subSubPlotCode: r.subSubPlotCode ?? null,
            ...(r.description?.trim()
              ? { description: r.description.trim() }
              : {}),
          })),
        })
      }
      onClose={onClose}
    >
      {isPlot && targetCount <= 0 && (
        <div className="note warn">
          {isMainPlot
            ? "Main Plot Count"
            : isSubPlot
              ? "Sub Plot Count"
              : "Sub-sub Plot Count"}{" "}
          is 0. Please set the count in Edit details before saving.
        </div>
      )}
      {isDerivedTreatments && targetCount <= 0 && (
        <div className="note warn">
          Plot counts (
          {isSplitSplitPlot
            ? "Main Plot, Sub Plot, Sub-sub Plot"
            : "Main Plot, Sub Plot"}
          ) are not configured. Please set plot counts in Edit details before
          configuring treatments.
        </div>
      )}
      {(isPlot || isDerivedTreatments) &&
        targetCount > 0 &&
        rows.length !== targetCount && (
          <div className="note warn">
            Exactly {targetCount}{" "}
            {isMainPlot
              ? "main plots"
              : isSubPlot
                ? "sub plots"
                : isSubSubPlot
                  ? "sub-sub plots"
                  : "treatments"}{" "}
            must be configured (currently {rows.length}).
          </div>
        )}
      {!valid && rows.length > 0 && (
        <div className="note warn">
          Every{" "}
          {isMainPlot
            ? "main plot"
            : isSubPlot
              ? "sub plot"
              : isSubSubPlot
                ? "sub-sub plot"
                : "treatment"}{" "}
          needs a unique code and a name.
        </div>
      )}

      {isDerivedTreatments && rows.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSplitSplitPlot
              ? "65px 75px 75px 75px 1.2fr 1fr"
              : "65px 85px 85px 1.2fr 1fr",
            gap: 8,
            padding: "0 4px",
            fontWeight: 600,
            fontSize: "0.8rem",
            color: "var(--text-muted, #556056)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <div>Code</div>
          <div>Main Plot</div>
          <div>Sub Plot</div>
          {isSplitSplitPlot && <div>Sub-sub Plot</div>}
          <div>Name *</div>
          <div>Description</div>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            className="editor-row"
            style={
              isDerivedTreatments
                ? {
                    display: "grid",
                    gridTemplateColumns: isSplitSplitPlot
                      ? "65px 75px 75px 75px 1.2fr 1fr"
                      : "65px 85px 85px 1.2fr 1fr",
                    gap: 8,
                  }
                : undefined
            }
          >
            <input
              aria-label="Code"
              value={r.code}
              disabled
              readOnly
              className="select"
              style={{
                width: isDerivedTreatments ? "100%" : 70,
                cursor: "not-allowed",
                backgroundColor: "var(--surface-muted, #f3f5f3)",
                color: "var(--text-muted, #556056)",
                fontWeight: 600,
                textAlign: isDerivedTreatments ? "center" : "left",
              }}
            />
            {isDerivedTreatments && (
              <>
                <div
                  className="select"
                  title={mainPlotName(r.mainPlotCode)}
                  style={{
                    backgroundColor: "var(--surface-muted, #f3f5f3)",
                    color: "var(--text-muted, #556056)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "default",
                    userSelect: "none",
                  }}
                >
                  {r.mainPlotCode}
                </div>
                <div
                  className="select"
                  title={subPlotName(r.subPlotCode)}
                  style={{
                    backgroundColor: "var(--surface-muted, #f3f5f3)",
                    color: "var(--text-muted, #556056)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "default",
                    userSelect: "none",
                  }}
                >
                  {r.subPlotCode}
                </div>
                {isSplitSplitPlot && (
                  <div
                    className="select"
                    title={subSubPlotName(r.subSubPlotCode)}
                    style={{
                      backgroundColor: "var(--surface-muted, #f3f5f3)",
                      color: "var(--text-muted, #556056)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                      userSelect: "none",
                    }}
                  >
                    {r.subSubPlotCode}
                  </div>
                )}
              </>
            )}
            <input
              aria-label={
                isMainPlot
                  ? "Main plot name"
                  : isSubPlot
                    ? "Sub plot name"
                    : isSubSubPlot
                      ? "Sub-sub plot name"
                      : "Treatment name"
              }
              value={r.name}
              onChange={(e) => set(i, "name", e.target.value)}
              placeholder={
                isMainPlot
                  ? "Main plot name, e.g. Natural farming system"
                  : isSubPlot
                    ? "Sub plot name, e.g. Desi variety"
                    : isSubSubPlot
                      ? "Sub-sub plot name, e.g. Sub-treatment A"
                      : "Treatment name, e.g. Complete NF"
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
            {!isDerivedTreatments && (
              <button
                className="icon-btn"
                aria-label={`Remove ${r.code}`}
                title={frozen(r) ? "Has recorded data" : "Remove"}
                disabled={frozen(r)}
                onClick={() => remove(i)}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
        <div>
          <button
            className="btn ghost sm"
            onClick={add}
            disabled={
              isDerivedTreatments || (isPlot && rows.length >= targetCount)
            }
          >
            <Plus size={14} /> Add{" "}
            {isMainPlot
              ? "main plot"
              : isSubPlot
                ? "sub plot"
                : isSubSubPlot
                  ? "sub-sub plot"
                  : "treatment"}
          </button>
          {isPlot && (
            <span className="muted small" style={{ marginLeft: 10 }}>
              {rows.length} of {targetCount} configured
            </span>
          )}
          {isDerivedTreatments && (
            <span className="muted small" style={{ marginLeft: 10 }}>
              Fixed layout ({rows.length} of {targetCount} treatments) —
              combinations are fixed by plot design
            </span>
          )}
        </div>
      </div>
    </SaveModal>
  );
}
