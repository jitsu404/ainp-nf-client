import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveModal } from "../../../components/forms";
import { Body, SmallBody } from "../../../components/ui";
import { useCroppingSystems } from "../../../queries/croppingSystems";
import {
  SubPlotSystemsPicker,
  subPlotSeasons,
} from "../../../components/SubPlotSystems";

export function TreatmentsModal({
  experiment,
  type = "treatments",
  save,
  onClose,
}) {
  const croppingSystems = useCroppingSystems();

  const isSplitPlot = experiment?.design === "Split plot";
  const isSplitSplitPlot = experiment?.design === "Split-split plot";
  const isFactorial = experiment?.design === "Factorial";

  const isFactor1 = isFactorial
    ? type === "factor1" || type === "mainPlot"
    : type === "factor1";
  const isFactor2 = isFactorial
    ? type === "factor2" || type === "subPlot"
    : type === "factor2";
  const isFactor3 = isFactorial
    ? type === "factor3" || type === "subSubPlot"
    : type === "factor3";
  const isFactor = isFactor1 || isFactor2 || isFactor3;

  const isMainPlot = !isFactorial && type === "mainPlot";
  const isSubPlot = !isFactorial && type === "subPlot";
  const isSubSubPlot = !isFactorial && type === "subSubPlot";
  const isPlot = isMainPlot || isSubPlot || isSubSubPlot;

  const isLevelConfig = isPlot || isFactor;
  const isDerivedTreatments =
    !isLevelConfig && (isSplitPlot || isSplitSplitPlot || isFactorial);

  const mCount = experiment?.mainPlotCount ?? 0;
  const sCount = experiment?.subPlotCount ?? 0;
  const ssCount =
    isSplitSplitPlot || isFactorial ? (experiment?.subSubPlotCount ?? 0) : 0;
  const hasC = isSplitSplitPlot || (isFactorial && ssCount > 0);

  const names = isFactorial
    ? { A: "Factor 1", B: "Factor 2", C: "Factor 3" }
    : { A: "Main Plot", B: "Sub Plot", C: "Sub-sub Plot" };

  const targetCount = isLevelConfig
    ? isMainPlot || isFactor1
      ? mCount
      : isSubPlot || isFactor2
        ? sCount
        : isSubSubPlot || isFactor3
          ? ssCount
          : null
    : isDerivedTreatments
      ? hasC
        ? mCount * sCount * ssCount
        : mCount * sCount
      : null;

  const fieldKey = isFactor1
    ? "factor1Data"
    : isFactor2
      ? "factor2Data"
      : isFactor3
        ? "factor3Data"
        : isMainPlot
          ? "mainPlotData"
          : isSubPlot
            ? "subPlotData"
            : isSubSubPlot
              ? "subSubPlotData"
              : "treatments";

  const prefix = isFactor1
    ? "F1_"
    : isFactor2
      ? "F2_"
      : isFactor3
        ? "F3_"
        : isMainPlot
          ? "M"
          : isSubPlot
            ? "S"
            : isSubSubPlot
              ? "SS"
              : "T";

  const existingList = isFactor1
    ? (experiment.factor1Data ?? [])
    : isFactor2
      ? (experiment.factor2Data ?? [])
      : isFactor3
        ? (experiment.factor3Data ?? [])
        : isMainPlot
          ? (experiment.mainPlotData ?? [])
          : isSubPlot
            ? (experiment.subPlotData ?? [])
            : isSubSubPlot
              ? (experiment.subSubPlotData ?? [])
              : (experiment.treatments ?? []);

  const original = new Set(existingList.map((t) => t.code));

  const mainPlotName = (code) =>
    (experiment.mainPlotData ?? []).find((t) => t.code === code)?.name || "";
  const subPlotName = (code) => {
    const sp = (experiment.subPlotData ?? []).find((t) => t.code === code);
    return croppingSystems.subPlotName(sp) || sp?.code || "";
  };
  const subSubPlotName = (code) =>
    (experiment.subSubPlotData ?? []).find((t) => t.code === code)?.name || "";

  const factor1Name = (code) =>
    (experiment.factor1Data ?? []).find((t) => t.code === code)?.name || "";
  const factor2Name = (code) =>
    (experiment.factor2Data ?? []).find((t) => t.code === code)?.name || "";
  const factor3Name = (code) =>
    (experiment.factor3Data ?? []).find((t) => t.code === code)?.name || "";

  const generateDerivedRows = () => {
    if (mCount <= 0 || sCount <= 0 || (hasC && ssCount <= 0)) {
      return [];
    }
    const existing = experiment?.treatments ?? [];
    const generated = [];
    let idx = 1;

    if (isFactorial) {
      const existingMap = new Map();
      for (const t of existing) {
        if (t.factor1Code && t.factor2Code) {
          const key = `${t.factor1Code}|${t.factor2Code}|${t.factor3Code ?? ""}`;
          existingMap.set(key, t);
        }
      }

      const f1List = experiment.factor1Data ?? [];
      const f2List = experiment.factor2Data ?? [];
      const f3List = experiment.factor3Data ?? [];

      for (let m = 1; m <= mCount; m++) {
        const f1Code = f1List[m - 1]?.code || `F1_${m}`;
        const f1Item = f1List[m - 1];
        for (let s = 1; s <= sCount; s++) {
          const f2Code = f2List[s - 1]?.code || `F2_${s}`;
          const f2Item = f2List[s - 1];
          if (hasC) {
            for (let ss = 1; ss <= ssCount; ss++) {
              const f3Code = f3List[ss - 1]?.code || `F3_${ss}`;
              const f3Item = f3List[ss - 1];
              const key = `${f1Code}|${f2Code}|${f3Code}`;
              const match = existingMap.get(key) || existing[idx - 1];
              const autoName = [f1Item?.name, f2Item?.name, f3Item?.name]
                .filter(Boolean)
                .join(" | ");
              generated.push({
                code: `T${idx}`,
                factor1Code: f1Code,
                factor2Code: f2Code,
                factor3Code: f3Code,
                mainPlotCode: null,
                subPlotCode: null,
                subSubPlotCode: null,
                name: match?.name ?? autoName,
                description: match?.description ?? "",
              });
              idx++;
            }
          } else {
            const key = `${f1Code}|${f2Code}|`;
            const match = existingMap.get(key) || existing[idx - 1];
            const autoName = [f1Item?.name, f2Item?.name]
              .filter(Boolean)
              .join(" | ");
            generated.push({
              code: `T${idx}`,
              factor1Code: f1Code,
              factor2Code: f2Code,
              factor3Code: null,
              mainPlotCode: null,
              subPlotCode: null,
              subSubPlotCode: null,
              name: match?.name ?? autoName,
              description: match?.description ?? "",
            });
            idx++;
          }
        }
      }
    } else {
      // Split Plot or Split-split Plot
      const existingMap = new Map();
      for (const t of existing) {
        if (t.mainPlotCode && t.subPlotCode) {
          const key = `${t.mainPlotCode}|${t.subPlotCode}|${t.subSubPlotCode ?? ""}`;
          existingMap.set(key, t);
        }
      }

      const mList = experiment.mainPlotData ?? [];
      const sList = experiment.subPlotData ?? [];
      const ssList = experiment.subSubPlotData ?? [];

      for (let m = 1; m <= mCount; m++) {
        const mCode = mList[m - 1]?.code || `M${m}`;
        const mItem = mList[m - 1];
        for (let s = 1; s <= sCount; s++) {
          const sCode = sList[s - 1]?.code || `S${s}`;
          const sItem = sList[s - 1];
          const csName = croppingSystems.subPlotName(sItem);
          if (hasC) {
            for (let ss = 1; ss <= ssCount; ss++) {
              const ssCode = ssList[ss - 1]?.code || `SS${ss}`;
              const ssItem = ssList[ss - 1];
              const key = `${mCode}|${sCode}|${ssCode}`;
              const match = existingMap.get(key) || existing[idx - 1];
              const autoName = [mItem?.name, csName || sCode, ssItem?.name]
                .filter(Boolean)
                .join(" | ");
              generated.push({
                code: `T${idx}`,
                mainPlotCode: mCode,
                subPlotCode: sCode,
                subSubPlotCode: ssCode,
                factor1Code: null,
                factor2Code: null,
                factor3Code: null,
                name: match?.name ?? autoName,
                description: match?.description ?? "",
              });
              idx++;
            }
          } else {
            const key = `${mCode}|${sCode}|`;
            const match = existingMap.get(key) || existing[idx - 1];
            const autoName = [mItem?.name, csName || sCode]
              .filter(Boolean)
              .join(" | ");
            generated.push({
              code: `T${idx}`,
              mainPlotCode: mCode,
              subPlotCode: sCode,
              subSubPlotCode: null,
              factor1Code: null,
              factor2Code: null,
              factor3Code: null,
              name: match?.name ?? autoName,
              description: match?.description ?? "",
            });
            idx++;
          }
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
        name: t.name ?? "",
        croppingSystems: t.croppingSystems ?? [],
        description: t.description ?? "",
        mainPlotCode: t.mainPlotCode ?? null,
        subPlotCode: t.subPlotCode ?? null,
        subSubPlotCode: t.subSubPlotCode ?? null,
        factor1Code: t.factor1Code ?? null,
        factor2Code: t.factor2Code ?? null,
        factor3Code: t.factor3Code ?? null,
      }));
    }
    if (isLevelConfig && targetCount > 0) {
      return Array.from({ length: targetCount }, (_, idx) => ({
        code: `${prefix}${idx + 1}`,
        name: "",
        croppingSystems: [],
        description: "",
      }));
    }
    return [
      { code: `${prefix}1`, name: "", croppingSystems: [], description: "" },
    ];
  });

  const set = (i, k, value) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: value } : row)));

  const add = () => {
    if (isDerivedTreatments) return;
    if (isLevelConfig && rows.length >= targetCount) return;
    setRows((r) => [
      ...r,
      {
        code: `${prefix}${r.length + 1}`,
        name: "",
        croppingSystems: [],
        description: "",
      },
    ]);
  };

  const remove = (i) => {
    if (isDerivedTreatments) return;
    setRows((r) => r.filter((_, j) => j !== i));
  };

  const frozen = (row) => experiment.dataLocked && original.has(row.code);
  const codes = rows.map((r) => r.code.trim().toUpperCase());

  const countValid =
    !isLevelConfig && !isDerivedTreatments
      ? true
      : targetCount != null && targetCount > 0 && rows.length === targetCount;

  const valid =
    countValid &&
    rows.length > 0 &&
    (isSubPlot
      ? rows.every((r) => r.code.trim() && r.croppingSystems?.length)
      : rows.every((r) => r.code.trim() && r.name.trim())) &&
    new Set(codes).size === codes.length;

  const title = isFactor1
    ? names.A
    : isFactor2
      ? names.B
      : isFactor3
        ? names.C
        : isMainPlot
          ? names.A
          : isSubPlot
            ? names.B
            : isSubSubPlot
              ? names.C
              : "Treatments";

  const subtitle = isFactor1
    ? `The Factor 1 levels configured for this experiment (${targetCount} required).`
    : isFactor2
      ? `The Factor 2 levels configured for this experiment (${targetCount} required).`
      : isFactor3
        ? `The Factor 3 levels configured for this experiment (${targetCount} required).`
        : isMainPlot
          ? `The main plots configured for this experiment (${targetCount} required).`
          : isSubPlot
            ? `The sub plots configured for this experiment (${targetCount} required): one cropping system per season, as the same land is cropped each season. Centres get these choices.`
            : isSubSubPlot
              ? `The sub-sub plots configured for this Split-split plot experiment (${targetCount} required).`
              : isDerivedTreatments
                ? isFactorial
                  ? `Fixed treatment combinations for the factorial (${targetCount} required: ${[mCount, sCount, ssCount].filter(Boolean).join(" × ")} levels of ${hasC ? "factors 1, 2, 3" : "factors 1, 2"}).`
                  : isSplitSplitPlot
                    ? `Fixed treatment combinations for Split-split plot (${targetCount} required: ${mCount} Main × ${sCount} Sub × ${ssCount} Sub-sub).`
                    : `Fixed treatment combinations for Split plot (${targetCount} required: ${mCount} Main × ${sCount} Sub).`
                : "The common treatments every centre applies (T1, T2 …).";

  const handleSave = () => {
    if (isSubPlot) {
      return save({
        subPlotData: rows.map((r) => ({
          code: r.code.trim(),
          croppingSystems: r.croppingSystems ?? [],
          ...(r.description?.trim()
            ? { description: r.description.trim() }
            : {}),
        })),
      });
    }

    if (isFactor1 || isFactor2 || isFactor3 || isMainPlot || isSubSubPlot) {
      return save({
        [fieldKey]: rows.map((r) => ({
          code: r.code.trim(),
          name: r.name.trim(),
          ...(r.description?.trim()
            ? { description: r.description.trim() }
            : {}),
        })),
      });
    }

    if (isDerivedTreatments) {
      return save({
        treatments: rows.map((r) => ({
          code: r.code.trim(),
          name: r.name.trim(),
          mainPlotCode: r.mainPlotCode ?? null,
          subPlotCode: r.subPlotCode ?? null,
          subSubPlotCode: r.subSubPlotCode ?? null,
          factor1Code: r.factor1Code ?? null,
          factor2Code: r.factor2Code ?? null,
          factor3Code: r.factor3Code ?? null,
          ...(r.description?.trim()
            ? { description: r.description.trim() }
            : {}),
        })),
      });
    }

    return save({
      treatments: rows.map((r) => ({
        code: r.code.trim(),
        name: r.name.trim(),
        mainPlotCode: null,
        subPlotCode: null,
        subSubPlotCode: null,
        factor1Code: null,
        factor2Code: null,
        factor3Code: null,
        ...(r.description?.trim() ? { description: r.description.trim() } : {}),
      })),
    });
  };

  return (
    <SaveModal
      title={title}
      subtitle={subtitle}
      canSave={valid}
      onSave={handleSave}
      onClose={onClose}
    >
      {isLevelConfig && targetCount <= 0 && (
        <Body as="div" className="note warn">
          {title} count is 0. Please set the count in Edit details before
          saving.
        </Body>
      )}
      {isDerivedTreatments && targetCount <= 0 && (
        <Body as="div" className="note warn">
          Counts (
          {hasC
            ? `${names.A}, ${names.B}, ${names.C}`
            : `${names.A}, ${names.B}`}
          ) are not configured. Please set counts in Edit details before
          configuring treatments.
        </Body>
      )}
      {(isLevelConfig || isDerivedTreatments) &&
        targetCount > 0 &&
        rows.length !== targetCount && (
          <Body as="div" className="note warn">
            Exactly {targetCount}{" "}
            {isFactor1
              ? "Factor 1 levels"
              : isFactor2
                ? "Factor 2 levels"
                : isFactor3
                  ? "Factor 3 levels"
                  : isMainPlot
                    ? "main plots"
                    : isSubPlot
                      ? "sub plots"
                      : isSubSubPlot
                        ? "sub-sub plots"
                        : "treatments"}{" "}
            must be configured (currently {rows.length}).
          </Body>
        )}
      {!valid && rows.length > 0 && (
        <Body as="div" className="note warn">
          Every{" "}
          {isFactor1
            ? "Factor 1 level"
            : isFactor2
              ? "Factor 2 level"
              : isFactor3
                ? "Factor 3 level"
                : isMainPlot
                  ? "main plot"
                  : isSubPlot
                    ? "sub plot"
                    : isSubSubPlot
                      ? "sub-sub plot"
                      : "treatment"}{" "}
          {isSubPlot
            ? "needs a unique code and a cropping system for at least one season."
            : "needs a unique code and a name."}
        </Body>
      )}

      {isDerivedTreatments && rows.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: hasC
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
          <div>{names.A}</div>
          <div>{names.B}</div>
          {hasC && <div>{names.C}</div>}
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
                    gridTemplateColumns: hasC
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
                  title={
                    isFactorial
                      ? factor1Name(r.factor1Code)
                      : mainPlotName(r.mainPlotCode)
                  }
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
                  {isFactorial ? r.factor1Code : r.mainPlotCode}
                </div>
                <div
                  className="select"
                  title={
                    isFactorial
                      ? factor2Name(r.factor2Code)
                      : subPlotName(r.subPlotCode)
                  }
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
                  {isFactorial ? r.factor2Code : r.subPlotCode}
                </div>
                {hasC && (
                  <div
                    className="select"
                    title={
                      isFactorial
                        ? factor3Name(r.factor3Code)
                        : subSubPlotName(r.subSubPlotCode)
                    }
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
                    {isFactorial ? r.factor3Code : r.subSubPlotCode}
                  </div>
                )}
              </>
            )}

            {isSubPlot ? (
              <SubPlotSystemsPicker
                label={r.code}
                value={r.croppingSystems ?? []}
                onChange={(v) => set(i, "croppingSystems", v)}
                seasonCodes={subPlotSeasons(
                  experiment,
                  croppingSystems.seasons.options,
                )}
              />
            ) : (
              <input
                aria-label={
                  isFactor1
                    ? "Factor 1 name"
                    : isFactor2
                      ? "Factor 2 name"
                      : isFactor3
                        ? "Factor 3 name"
                        : isMainPlot
                          ? "Main plot name"
                          : isSubSubPlot
                            ? "Sub-sub plot name"
                            : "Treatment name"
                }
                value={r.name}
                onChange={(e) => set(i, "name", e.target.value)}
                placeholder={
                  isFactor1
                    ? "Factor 1 name, e.g. Conventional"
                    : isFactor2
                      ? "Factor 2 name, e.g. Tillage method"
                      : isFactor3
                        ? "Factor 3 name, e.g. Nitrogen level"
                        : isMainPlot
                          ? "Main plot name, e.g. Natural farming system"
                          : isSubSubPlot
                            ? "Sub-sub plot name, e.g. Sub-treatment A"
                            : "Treatment name, e.g. Complete NF"
                }
                className="select"
              />
            )}

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
              isDerivedTreatments ||
              (isLevelConfig && rows.length >= targetCount)
            }
          >
            <Plus size={14} /> Add{" "}
            {isFactor1
              ? "Factor 1 level"
              : isFactor2
                ? "Factor 2 level"
                : isFactor3
                  ? "Factor 3 level"
                  : isMainPlot
                    ? "main plot"
                    : isSubPlot
                      ? "sub plot"
                      : isSubSubPlot
                        ? "sub-sub plot"
                        : "treatment"}
          </button>
          {isLevelConfig && (
            <SmallBody muted style={{ marginLeft: 10 }}>
              {rows.length} of {targetCount} configured
            </SmallBody>
          )}
          {isDerivedTreatments && (
            <SmallBody muted style={{ marginLeft: 10 }}>
              Fixed layout ({rows.length} of {targetCount} treatments) —
              combinations are fixed by design
            </SmallBody>
          )}
        </div>
      </div>
    </SaveModal>
  );
}
