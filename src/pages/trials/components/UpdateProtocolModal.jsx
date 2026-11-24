import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Copy,
  Info,
  Plus,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { Body, Modal, SmallBody, SubHeading } from "../../../components/ui";
import { seasonMap } from "../../../lib/seasonCrops";
import { toast } from "../../../lib/toast";
import { useCroppingSystems } from "../../../queries/croppingSystems";
import {
  SubPlotSystemsPicker,
  subPlotSeasons,
} from "../../../components/SubPlotSystems";
import { useMasterOptions, useUnitLabel } from "../../../queries/masters";

/**
 * Tri-state header checkbox with indeterminate support.
 */
function HeaderCheckbox({ checked, indeterminate, onChange, title }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={Boolean(checked)}
      onChange={onChange}
      title={title}
      style={{
        cursor: "pointer",
        width: 16,
        height: 16,
        accentColor: "var(--green, #1b7f4b)",
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Step Form for Main Plot, Sub Plot (Cropping Systems), Sub-sub Plot, or Factor 1/2/3.
 */
function PlotStepForm({
  label,
  prefix,
  rows,
  onChange,
  isSubPlot = false,
  croppingSystems,
  seasonCodes = [],
}) {
  const setField = (index, field, value) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    const nextNum = rows.length + 1;
    onChange([
      ...rows,
      isSubPlot
        ? {
            code: `${prefix}${nextNum}`,
            croppingSystems: [],
            description: "",
          }
        : {
            code: `${prefix}${nextNum}`,
            name: "",
            description: "",
          },
    ]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) {
      toast.error(`At least one ${label.toLowerCase()} is required.`);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8faf9",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--line, #e3e8e4)",
        }}
      >
        <div>
          <SubHeading as="h4" level="card">
            Configure {label}s
          </SubHeading>
          <SmallBody muted style={{ margin: "2px 0 0 0", display: "block" }}>
            Add, update, or remove {label.toLowerCase()} entries for this trial.
          </SmallBody>
        </div>
        <button
          type="button"
          className="btn ghost sm"
          onClick={addRow}
          style={{ height: 32 }}
        >
          <Plus size={14} /> Add {label.toLowerCase()}
        </button>
      </div>

      <div
        className="table-wrap"
        style={{
          border: "1px solid var(--line, #e3e8e4)",
          borderRadius: 8,
          overflow: "auto",
          maxHeight: "52vh",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "#f8faf9",
                borderBottom: "2px solid var(--line, #e3e8e4)",
              }}
            >
              <th
                style={{ width: 110, padding: "10px 12px", textAlign: "left" }}
              >
                Code
              </th>
              <th
                style={{
                  minWidth: 240,
                  padding: "10px 12px",
                  textAlign: "left",
                }}
              >
                {isSubPlot ? "Cropping System" : `${label} Name`}{" "}
                <span style={{ color: "var(--red, #b3261e)" }}>*</span>
              </th>
              <th
                style={{
                  minWidth: 260,
                  padding: "10px 12px",
                  textAlign: "left",
                }}
              >
                Details / Description
              </th>
              <th
                style={{ width: 60, padding: "10px 12px", textAlign: "center" }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid #edf0ed",
                  background: idx % 2 === 0 ? "#ffffff" : "#fafcfa",
                }}
              >
                <td style={{ padding: "8px 12px" }}>
                  <input
                    className="select"
                    style={{
                      height: 32,
                      width: "100%",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                    value={row.code}
                    onChange={(e) =>
                      setField(idx, "code", e.target.value.toUpperCase().trim())
                    }
                    placeholder={`${prefix}${idx + 1}`}
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  {isSubPlot ? (
                    <SubPlotSystemsPicker
                      label={row.code}
                      value={row.croppingSystems ?? []}
                      onChange={(v) => setField(idx, "croppingSystems", v)}
                      seasonCodes={seasonCodes}
                    />
                  ) : (
                    <input
                      className="select"
                      style={{ height: 32, width: "100%" }}
                      value={row.name}
                      onChange={(e) => setField(idx, "name", e.target.value)}
                      placeholder={`e.g. ${prefix}P-${idx + 1}`}
                      required
                    />
                  )}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    className="select"
                    style={{ height: 32, width: "100%" }}
                    value={row.description || ""}
                    onChange={(e) =>
                      setField(idx, "description", e.target.value)
                    }
                    placeholder="Optional details..."
                  />
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length <= 1}
                    title={
                      rows.length <= 1 ? "Cannot delete only row" : "Delete"
                    }
                    style={{
                      opacity: rows.length <= 1 ? 0.35 : 1,
                      cursor: rows.length <= 1 ? "not-allowed" : "pointer",
                      color: "var(--red, #b3261e)",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Step Form for Treatments (recalculating hierarchy when derived).
 */
function TreatmentsStepForm({
  isDerived,
  isFactorial,
  isSplitSplitPlot,
  names,
  level1Data,
  level2Data,
  level3Data,
  rows,
  onChange,
  croppingSystems,
}) {
  const setField = (index, field, value) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addCustomRow = () => {
    const nextNum = rows.length + 1;
    onChange([
      ...rows,
      {
        code: `T${nextNum}`,
        name: "",
        description: "",
      },
    ]);
  };

  const removeCustomRow = (index) => {
    if (rows.length <= 1) {
      toast.error("At least one treatment is required.");
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  const l1Name = (code) => level1Data.find((m) => m.code === code)?.name || "";
  const l2Name = (code) => {
    const item = level2Data.find((s) => s.code === code);
    return isFactorial
      ? item?.name || ""
      : croppingSystems?.subPlotName(item) || "";
  };
  const l3Name = (code) =>
    level3Data.find((ss) => ss.code === code)?.name || "";

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8faf9",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--line, #e3e8e4)",
        }}
      >
        <div>
          <SubHeading as="h4" level="card">
            Configure Treatments ({rows.length} treatments)
          </SubHeading>
          <SmallBody muted style={{ margin: "2px 0 0 0", display: "block" }}>
            {isDerived
              ? "Treatments are dynamically generated from the combination of plots/factors. Provide names and details."
              : "Define the treatment codes, names, and details for this trial."}
          </SmallBody>
        </div>
        {!isDerived && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={addCustomRow}
            style={{ height: 32 }}
          >
            <Plus size={14} /> Add treatment
          </button>
        )}
      </div>

      <div
        className="table-wrap"
        style={{
          border: "1px solid var(--line, #e3e8e4)",
          borderRadius: 8,
          overflow: "auto",
          maxHeight: "52vh",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "#f8faf9",
                borderBottom: "2px solid var(--line, #e3e8e4)",
              }}
            >
              <th
                style={{ width: 90, padding: "10px 12px", textAlign: "left" }}
              >
                Code
              </th>
              {isDerived && (
                <>
                  <th
                    style={{
                      minWidth: 140,
                      padding: "10px 12px",
                      textAlign: "left",
                    }}
                  >
                    {names?.A || "Factor 1"}
                  </th>
                  <th
                    style={{
                      minWidth: 140,
                      padding: "10px 12px",
                      textAlign: "left",
                    }}
                  >
                    {names?.B || "Factor 2"}
                  </th>
                  {isSplitSplitPlot && (
                    <th
                      style={{
                        minWidth: 140,
                        padding: "10px 12px",
                        textAlign: "left",
                      }}
                    >
                      {names?.C || "Factor 3"}
                    </th>
                  )}
                </>
              )}
              <th
                style={{
                  minWidth: 220,
                  padding: "10px 12px",
                  textAlign: "left",
                }}
              >
                Treatment Name{" "}
                <span style={{ color: "var(--red, #b3261e)" }}>*</span>
              </th>
              <th
                style={{
                  minWidth: 220,
                  padding: "10px 12px",
                  textAlign: "left",
                }}
              >
                Details
              </th>
              {!isDerived && (
                <th
                  style={{
                    width: 60,
                    padding: "10px 12px",
                    textAlign: "center",
                  }}
                ></th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid #edf0ed",
                  background: idx % 2 === 0 ? "#ffffff" : "#fafcfa",
                }}
              >
                <td style={{ padding: "8px 12px" }}>
                  {isDerived ? (
                    <b style={{ fontFamily: "monospace", fontSize: "0.88rem" }}>
                      {row.code}
                    </b>
                  ) : (
                    <input
                      className="select"
                      style={{
                        height: 32,
                        width: "100%",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontFamily: "monospace",
                      }}
                      value={row.code}
                      onChange={(e) =>
                        setField(
                          idx,
                          "code",
                          e.target.value.toUpperCase().trim(),
                        )
                      }
                      placeholder={`T${idx + 1}`}
                    />
                  )}
                </td>
                {isDerived && (
                  <>
                    <td style={{ padding: "8px 12px" }}>
                      <span>
                        <b>
                          {isFactorial ? row.factor1Code : row.mainPlotCode}
                        </b>
                        {l1Name(
                          isFactorial ? row.factor1Code : row.mainPlotCode,
                        ) && (
                          <span className="muted small">
                            {" "}
                            (
                            {l1Name(
                              isFactorial ? row.factor1Code : row.mainPlotCode,
                            )}
                            )
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span>
                        <b>{isFactorial ? row.factor2Code : row.subPlotCode}</b>
                        {l2Name(
                          isFactorial ? row.factor2Code : row.subPlotCode,
                        ) && (
                          <span className="muted small">
                            {" "}
                            (
                            {l2Name(
                              isFactorial ? row.factor2Code : row.subPlotCode,
                            )}
                            )
                          </span>
                        )}
                      </span>
                    </td>
                    {isSplitSplitPlot && (
                      <td style={{ padding: "8px 12px" }}>
                        <span>
                          <b>
                            {isFactorial ? row.factor3Code : row.subSubPlotCode}
                          </b>
                          {l3Name(
                            isFactorial ? row.factor3Code : row.subSubPlotCode,
                          ) && (
                            <span className="muted small">
                              {" "}
                              (
                              {l3Name(
                                isFactorial
                                  ? row.factor3Code
                                  : row.subSubPlotCode,
                              )}
                              )
                            </span>
                          )}
                        </span>
                      </td>
                    )}
                  </>
                )}
                <td style={{ padding: "8px 12px" }}>
                  <input
                    className="select"
                    style={{ height: 32, width: "100%" }}
                    value={row.name}
                    onChange={(e) => setField(idx, "name", e.target.value)}
                    placeholder={`e.g. Treatment - ${idx + 1}`}
                    required
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    className="select"
                    style={{ height: 32, width: "100%" }}
                    value={row.description || ""}
                    onChange={(e) =>
                      setField(idx, "description", e.target.value)
                    }
                    placeholder="Optional description..."
                  />
                </td>
                {!isDerived && (
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeCustomRow(idx)}
                      disabled={rows.length <= 1}
                      title={
                        rows.length <= 1 ? "Cannot delete only row" : "Delete"
                      }
                      style={{
                        opacity: rows.length <= 1 ? 0.35 : 1,
                        cursor: rows.length <= 1 ? "not-allowed" : "pointer",
                        color: "var(--red, #b3261e)",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Step Form for Set Parameters Matrix.
 */
function ParametersStepForm({
  experiment,
  treatments,
  level1Data,
  level2Data,
  level3Data,
  disabledList,
  onChange,
  croppingSystems,
}) {
  const seasonsMaster = useMasterOptions("season");
  const unit = useUnitLabel();

  const parameters = useMemo(
    () => experiment.defaultParameters ?? experiment.parameters ?? [],
    [experiment.defaultParameters, experiment.parameters],
  );

  const seasonCodes = useMemo(
    () => Object.keys(seasonMap(experiment.seasons)),
    [experiment.seasons],
  );

  const [activeSeason, setActiveSeason] = useState(() => seasonCodes[0] || "");
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");

  const sections = useMemo(() => {
    const set = new Set();
    for (const p of parameters) {
      if (p.section) set.add(p.section);
    }
    return Array.from(set).sort();
  }, [parameters]);

  const filteredParameters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parameters.filter((p) => {
      if (selectedSection !== "all" && p.section !== selectedSection)
        return false;
      if (q) {
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCode = p.code?.toLowerCase().includes(q);
        const matchSection = p.section?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSection) return false;
      }
      return true;
    });
  }, [parameters, search, selectedSection]);

  const isDisabled = (tCode, pId, season = activeSeason) => {
    const pIdStr = String(pId);
    return disabledList.some(
      (d) =>
        d.treatment === tCode &&
        d.season === season &&
        d.parameterId === pIdStr,
    );
  };

  const toggleCell = (tCode, pId) => {
    const pIdStr = String(pId);
    const exists = disabledList.some(
      (d) =>
        d.treatment === tCode &&
        d.season === activeSeason &&
        d.parameterId === pIdStr,
    );
    if (exists) {
      onChange(
        disabledList.filter(
          (d) =>
            !(
              d.treatment === tCode &&
              d.season === activeSeason &&
              d.parameterId === pIdStr
            ),
        ),
      );
    } else {
      onChange([
        ...disabledList,
        {
          treatment: tCode,
          season: activeSeason,
          parameterId: pIdStr,
        },
      ]);
    }
  };

  const toggleTreatment = (tCode) => {
    const allFilteredIds = filteredParameters.map((p) => String(p.parameterId));
    const allDisabled = allFilteredIds.every((pId) =>
      isDisabled(tCode, pId, activeSeason),
    );

    if (allDisabled) {
      onChange(
        disabledList.filter(
          (d) =>
            !(
              d.treatment === tCode &&
              d.season === activeSeason &&
              allFilteredIds.includes(d.parameterId)
            ),
        ),
      );
    } else {
      const additions = [];
      for (const pId of allFilteredIds) {
        if (
          !disabledList.some(
            (d) =>
              d.treatment === tCode &&
              d.season === activeSeason &&
              d.parameterId === pId,
          )
        ) {
          additions.push({
            treatment: tCode,
            season: activeSeason,
            parameterId: pId,
          });
        }
      }
      onChange([...disabledList, ...additions]);
    }
  };

  const toggleParameter = (pId) => {
    const pIdStr = String(pId);
    const allTreatmentCodes = treatments.map((t) => t.code);
    const allDisabled = allTreatmentCodes.every((tCode) =>
      isDisabled(tCode, pIdStr, activeSeason),
    );

    if (allDisabled) {
      onChange(
        disabledList.filter(
          (d) =>
            !(
              d.season === activeSeason &&
              d.parameterId === pIdStr &&
              allTreatmentCodes.includes(d.treatment)
            ),
        ),
      );
    } else {
      const additions = [];
      for (const tCode of allTreatmentCodes) {
        if (
          !disabledList.some(
            (d) =>
              d.treatment === tCode &&
              d.season === activeSeason &&
              d.parameterId === pIdStr,
          )
        ) {
          additions.push({
            treatment: tCode,
            season: activeSeason,
            parameterId: pIdStr,
          });
        }
      }
      onChange([...disabledList, ...additions]);
    }
  };

  const enableAllInSeason = () => {
    onChange(disabledList.filter((d) => d.season !== activeSeason));
    toast.success(
      `All parameters enabled for ${seasonsMaster.nameOf(activeSeason) || activeSeason}`,
    );
  };

  const disableAllInSeason = () => {
    const newItems = [];
    for (const t of treatments) {
      for (const p of parameters) {
        newItems.push({
          treatment: t.code,
          season: activeSeason,
          parameterId: String(p.parameterId),
        });
      }
    }
    onChange([
      ...disabledList.filter((d) => d.season !== activeSeason),
      ...newItems,
    ]);
    toast.info(
      `All parameters disabled for ${seasonsMaster.nameOf(activeSeason) || activeSeason}`,
    );
  };

  const copyToAllSeasons = () => {
    const currentSeasonDisabled = disabledList.filter(
      (d) => d.season === activeSeason,
    );
    const otherSeasons = seasonCodes.filter((s) => s !== activeSeason);
    if (!otherSeasons.length) return;

    const cloned = otherSeasons.flatMap((targetSeason) =>
      currentSeasonDisabled.map((d) => ({
        ...d,
        season: targetSeason,
      })),
    );

    onChange([...currentSeasonDisabled, ...cloned]);
    toast.success(
      `Copied ${seasonsMaster.nameOf(activeSeason) || activeSeason} configuration to ${otherSeasons.map((s) => seasonsMaster.nameOf(s) || s).join(", ")}`,
    );
  };

  const isFactorial = experiment?.design === "Factorial";

  const getTreatmentTooltip = (t) => {
    const lines = [`${t.code} - ${t.name}`];
    if (isFactorial) {
      if (t.factor1Code) {
        const f1 = level1Data.find((f) => f.code === t.factor1Code);
        lines.push(
          `Factor 1: ${t.factor1Code}${f1?.name ? ` (${f1.name})` : ""}`,
        );
      }
      if (t.factor2Code) {
        const f2 = level2Data.find((f) => f.code === t.factor2Code);
        lines.push(
          `Factor 2: ${t.factor2Code}${f2?.name ? ` (${f2.name})` : ""}`,
        );
      }
      if (t.factor3Code) {
        const f3 = level3Data.find((f) => f.code === t.factor3Code);
        lines.push(
          `Factor 3: ${t.factor3Code}${f3?.name ? ` (${f3.name})` : ""}`,
        );
      }
    } else {
      if (t.mainPlotCode) {
        const m = level1Data.find((mp) => mp.code === t.mainPlotCode);
        lines.push(`Main: ${t.mainPlotCode}${m?.name ? ` (${m.name})` : ""}`);
      }
      if (t.subPlotCode) {
        const s = level2Data.find((sp) => sp.code === t.subPlotCode);
        const csName = croppingSystems?.subPlotName(s);
        lines.push(`Sub: ${t.subPlotCode}${csName ? ` (${csName})` : ""}`);
      }
      if (t.subSubPlotCode) {
        const ss = level3Data.find((ssp) => ssp.code === t.subSubPlotCode);
        lines.push(
          `Sub-sub: ${t.subSubPlotCode}${ss?.name ? ` (${ss.name})` : ""}`,
        );
      }
    }
    if (t.description) lines.push(`Details: ${t.description}`);
    return lines.join("\n");
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      {/* Season Tabs with Badges */}
      {seasonCodes.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid var(--line, #e3e8e4)",
            paddingBottom: 2,
          }}
        >
          {seasonCodes.map((code) => {
            const isCurrent = activeSeason === code;
            const disabledCount = disabledList.filter(
              (d) => d.season === code,
            ).length;
            const seasonName = seasonsMaster.nameOf(code) || code;

            return (
              <button
                key={code}
                type="button"
                onClick={() => setActiveSeason(code)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  border: "none",
                  borderBottom: isCurrent
                    ? "2px solid var(--green, #1b7f4b)"
                    : "2px solid transparent",
                  background: isCurrent
                    ? "var(--green-bg, #e7f5ec)"
                    : "transparent",
                  color: isCurrent
                    ? "var(--green, #1b7f4b)"
                    : "var(--text-muted, #647069)",
                  fontWeight: isCurrent ? 600 : 500,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{seasonName}</span>
                {disabledCount > 0 ? (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 6px",
                      borderRadius: 10,
                      background: isCurrent
                        ? "rgba(180, 83, 9, 0.18)"
                        : "var(--grey-bg, #eef1ee)",
                      color: isCurrent
                        ? "#9a3412"
                        : "var(--text-muted, #647069)",
                      fontWeight: 600,
                    }}
                  >
                    {disabledCount} disabled
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 6px",
                      borderRadius: 10,
                      background: isCurrent
                        ? "rgba(22, 163, 74, 0.18)"
                        : "var(--grey-bg, #eef1ee)",
                      color: isCurrent
                        ? "#166534"
                        : "var(--text-muted, #647069)",
                      fontWeight: 600,
                    }}
                  >
                    All active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Action Toolbar */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          background: "#f9faf9",
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--line, #e3e8e4)",
        }}
      >
        <div
          className="row"
          style={{ gap: 10, alignItems: "center", flex: 1, minWidth: 260 }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: 240 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="select"
              style={{ paddingLeft: 30, height: 32, fontSize: "0.82rem" }}
              placeholder="Search parameters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                ×
              </button>
            )}
          </div>

          {sections.length > 1 && (
            <select
              className="select"
              style={{ maxWidth: 170, height: 32, fontSize: "0.82rem" }}
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="all">All Sections ({parameters.length})</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn ghost sm"
            style={{ height: 32 }}
            onClick={enableAllInSeason}
            title="Enable all parameters in active season"
          >
            <CheckCheck size={14} style={{ color: "var(--green, #1b7f4b)" }} />{" "}
            Enable All
          </button>
          <button
            type="button"
            className="btn ghost sm"
            style={{ height: 32 }}
            onClick={disableAllInSeason}
            title="Disable all parameters in active season"
          >
            <Square size={14} style={{ color: "var(--red, #b3261e)" }} />{" "}
            Disable All
          </button>
          {seasonCodes.length > 1 && (
            <button
              type="button"
              className="btn ghost sm"
              style={{ height: 32 }}
              onClick={copyToAllSeasons}
              title="Apply this season's settings to all other seasons"
            >
              <Copy size={14} /> Copy to all seasons
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div
        className="table-wrap"
        style={{
          maxHeight: "48vh",
          overflow: "auto",
          border: "1px solid var(--line, #e3e8e4)",
          borderRadius: 8,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  top: 0,
                  zIndex: 10,
                  background: "#f8faf9",
                  minWidth: 280,
                  maxWidth: 340,
                  borderBottom: "2px solid var(--line, #e3e8e4)",
                  borderRight: "2px solid var(--line, #e3e8e4)",
                  padding: "10px 12px",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  PARAMETER ({filteredParameters.length})
                </span>
              </th>

              {treatments.map((t) => {
                const tooltip = getTreatmentTooltip(t);
                const allFilteredIds = filteredParameters.map((p) =>
                  String(p.parameterId),
                );
                const disabledCount = allFilteredIds.filter((pId) =>
                  isDisabled(t.code, pId, activeSeason),
                ).length;
                const allChecked =
                  disabledCount === 0 && allFilteredIds.length > 0;
                const someChecked =
                  disabledCount < allFilteredIds.length && disabledCount > 0;

                return (
                  <th
                    key={t.code}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      background: "#f8faf9",
                      minWidth: 95,
                      maxWidth: 120,
                      textAlign: "center",
                      borderBottom: "2px solid var(--line, #e3e8e4)",
                      borderRight: "1px solid var(--line, #e3e8e4)",
                      padding: "8px 6px",
                    }}
                    title={tooltip}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "var(--green-bg, #e7f5ec)",
                            color: "var(--green, #1b7f4b)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                          }}
                        >
                          {t.code}
                        </span>
                        <Info
                          size={11}
                          className="text-muted"
                          style={{ cursor: "help" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted, #647069)",
                          maxWidth: 100,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={t.name}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#ffffff",
                          padding: "2px 5px",
                          borderRadius: 4,
                          border: "1px solid var(--line, #e3e8e4)",
                        }}
                      >
                        <HeaderCheckbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={() => toggleTreatment(t.code)}
                          title={
                            allChecked
                              ? `Disable all for ${t.code}`
                              : `Enable all for ${t.code}`
                          }
                        />
                        <span
                          style={{
                            fontSize: "0.66rem",
                            color: "var(--text-muted, #647069)",
                          }}
                        >
                          All
                        </span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredParameters.length === 0 ? (
              <tr>
                <td
                  colSpan={treatments.length + 1}
                  style={{ textAlign: "center", padding: 32 }}
                  className="muted"
                >
                  No parameters matching filter.
                </td>
              </tr>
            ) : (
              filteredParameters.map((p, idx) => {
                const pId = String(p.parameterId);
                const allTreatmentCodes = treatments.map((t) => t.code);
                const disabledCount = allTreatmentCodes.filter((tCode) =>
                  isDisabled(tCode, pId, activeSeason),
                ).length;
                const allChecked = disabledCount === 0;
                const someChecked =
                  disabledCount < allTreatmentCodes.length && disabledCount > 0;
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={pId}
                    style={{ background: isEven ? "#ffffff" : "#fafcfa" }}
                  >
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        background: isEven ? "#ffffff" : "#fafcfa",
                        borderBottom: "1px solid #edf0ed",
                        borderRight: "2px solid var(--line, #e3e8e4)",
                        padding: "8px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <HeaderCheckbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={() => toggleParameter(pId)}
                          title={
                            allChecked
                              ? "Disable for all treatments"
                              : "Enable for all treatments"
                          }
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                color: "var(--ink, #1b2420)",
                              }}
                            >
                              {p.name}
                            </span>
                            {p.unitCode && (
                              <span
                                className="muted small"
                                style={{ fontSize: "0.74rem" }}
                              >
                                ({unit(p.unitCode)})
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 2,
                            }}
                          >
                            {p.code && (
                              <span
                                className="muted small mono"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {p.code}
                              </span>
                            )}
                            {p.section && (
                              <span
                                style={{
                                  fontSize: "0.66rem",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  background: "var(--grey-bg, #eef1ee)",
                                  color: "var(--text-muted, #5c6660)",
                                }}
                              >
                                {p.section}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {treatments.map((t) => {
                      const disabled = isDisabled(t.code, pId, activeSeason);
                      const checked = !disabled;
                      const tooltip = getTreatmentTooltip(t);

                      return (
                        <td
                          key={t.code}
                          onClick={() => toggleCell(t.code, pId)}
                          style={{
                            textAlign: "center",
                            cursor: "pointer",
                            userSelect: "none",
                            padding: "8px 4px",
                            borderBottom: "1px solid #edf0ed",
                            borderRight: "1px solid #edf0ed",
                            background: disabled
                              ? "rgba(100, 116, 139, 0.05)"
                              : "transparent",
                          }}
                          title={`${checked ? "Active" : "Disabled"}: ${t.code} · ${p.name}\n\n${tooltip}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCell(t.code, pId)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              cursor: "pointer",
                              width: 16,
                              height: 16,
                              accentColor: "var(--green, #1b7f4b)",
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Main Multi-Step Update Protocol Modal.
 */
export function UpdateProtocolModal({ trial, save, onClose }) {
  const croppingSystems = useCroppingSystems();
  const e = trial.experiment ?? {};
  const locked = trial.locked ?? [];

  const isSplitPlot = e.design === "Split plot";
  const isSplitSplitPlot = e.design === "Split-split plot";
  const isFactorial = e.design === "Factorial";
  const hasPlots = isSplitPlot || isSplitSplitPlot || isFactorial;
  const hasC =
    isSplitSplitPlot || (isFactorial && (e.subSubPlotCount ?? 0) > 0);

  const names = isFactorial
    ? { A: "Factor 1", B: "Factor 2", C: "Factor 3" }
    : { A: "Main Plot", B: "Sub Plot", C: "Sub-sub Plot" };

  // Active steps dynamically computed based on design and locks
  const steps = useMemo(() => {
    const list = [];
    if (isFactorial) {
      if (!locked.includes("factor1") && !locked.includes("mainPlot")) {
        list.push({ key: "factor1", label: names.A, stepNum: 1 });
      }
      if (!locked.includes("factor2") && !locked.includes("subPlot")) {
        list.push({ key: "factor2", label: names.B, stepNum: 2 });
      }
      if (
        hasC &&
        !locked.includes("factor3") &&
        !locked.includes("subSubPlot")
      ) {
        list.push({ key: "factor3", label: names.C, stepNum: 3 });
      }
    } else if (hasPlots) {
      if (!locked.includes("mainPlot")) {
        list.push({ key: "mainPlot", label: names.A, stepNum: 1 });
      }
      if (!locked.includes("subPlot")) {
        list.push({ key: "subPlot", label: names.B, stepNum: 2 });
      }
      if (hasC && !locked.includes("subSubPlot")) {
        list.push({ key: "subSubPlot", label: names.C, stepNum: 3 });
      }
    }
    if (!locked.includes("treatments")) {
      list.push({
        key: "treatments",
        label: "Treatments",
        stepNum: list.length + 1,
      });
    }
    if (!locked.includes("parameters")) {
      list.push({
        key: "parameters",
        label: "Set Parameters",
        stepNum: list.length + 1,
      });
    }
    return list;
  }, [hasPlots, hasC, isFactorial, locked, names.A, names.B, names.C]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  // Local state for all sections
  const [factor1Data, setFactor1Data] = useState(() =>
    (trial.factor1Data ?? []).map((f) => ({ ...f })),
  );
  const [factor2Data, setFactor2Data] = useState(() =>
    (trial.factor2Data ?? []).map((f) => ({ ...f })),
  );
  const [factor3Data, setFactor3Data] = useState(() =>
    (trial.factor3Data ?? []).map((f) => ({ ...f })),
  );
  const [mainPlotData, setMainPlotData] = useState(() =>
    (trial.mainPlotData ?? []).map((m) => ({ ...m })),
  );
  const [subPlotData, setSubPlotData] = useState(() =>
    (trial.subPlotData ?? []).map((s) => ({ ...s })),
  );
  const [subSubPlotData, setSubSubPlotData] = useState(() =>
    (trial.subSubPlotData ?? []).map((ss) => ({ ...ss })),
  );
  const [treatments, setTreatments] = useState(() =>
    (trial.treatments ?? []).map((t) => ({ ...t })),
  );
  const [disabledList, setDisabledList] = useState(() =>
    (trial.disabledParameters ?? []).map((d) => ({
      treatment: String(d.treatment).toUpperCase().trim(),
      season: String(d.season).toUpperCase().trim(),
      parameterId: String(d.parameterId),
    })),
  );

  // Recalculate treatment combinations when arriving at Treatments step in derived designs
  const recalculateDerivedTreatments = () => {
    if (!hasPlots) return;
    const existing = treatments;
    const generated = [];
    let idx = 1;

    if (isFactorial) {
      const existingMap = new Map();
      for (const tr of existing) {
        const key = `${tr.factor1Code}|${tr.factor2Code}|${tr.factor3Code ?? ""}`;
        existingMap.set(key, tr);
      }

      for (const f1 of factor1Data) {
        for (const f2 of factor2Data) {
          if (hasC && factor3Data.length > 0) {
            for (const f3 of factor3Data) {
              const key = `${f1.code}|${f2.code}|${f3.code}`;
              const match = existingMap.get(key) || existing[idx - 1];
              generated.push({
                code: `T${idx}`,
                factor1Code: f1.code,
                factor2Code: f2.code,
                factor3Code: f3.code,
                mainPlotCode: null,
                subPlotCode: null,
                subSubPlotCode: null,
                name:
                  match?.name ||
                  `${f1.name || f1.code} + ${f2.name || f2.code} + ${f3.name || f3.code}`,
                description: match?.description || "",
              });
              idx++;
            }
          } else {
            const key = `${f1.code}|${f2.code}|`;
            const match = existingMap.get(key) || existing[idx - 1];
            generated.push({
              code: `T${idx}`,
              factor1Code: f1.code,
              factor2Code: f2.code,
              factor3Code: null,
              mainPlotCode: null,
              subPlotCode: null,
              subSubPlotCode: null,
              name:
                match?.name || `${f1.name || f1.code} + ${f2.name || f2.code}`,
              description: match?.description || "",
            });
            idx++;
          }
        }
      }
    } else {
      // Split plot
      const existingMap = new Map();
      for (const tr of existing) {
        const key = `${tr.mainPlotCode}|${tr.subPlotCode}|${tr.subSubPlotCode ?? ""}`;
        existingMap.set(key, tr);
      }

      for (const m of mainPlotData) {
        for (const s of subPlotData) {
          const sLabel = croppingSystems.subPlotName(s) || s.code;
          if (hasC && subSubPlotData.length > 0) {
            for (const ss of subSubPlotData) {
              const key = `${m.code}|${s.code}|${ss.code}`;
              const match = existingMap.get(key) || existing[idx - 1];
              generated.push({
                code: `T${idx}`,
                mainPlotCode: m.code,
                subPlotCode: s.code,
                subSubPlotCode: ss.code,
                factor1Code: null,
                factor2Code: null,
                factor3Code: null,
                name:
                  match?.name ||
                  `${m.name || m.code} + ${sLabel} + ${ss.name || ss.code}`,
                description: match?.description || "",
              });
              idx++;
            }
          } else {
            const key = `${m.code}|${s.code}|`;
            const match = existingMap.get(key) || existing[idx - 1];
            generated.push({
              code: `T${idx}`,
              mainPlotCode: m.code,
              subPlotCode: s.code,
              subSubPlotCode: null,
              factor1Code: null,
              factor2Code: null,
              factor3Code: null,
              name: match?.name || `${m.name || m.code} + ${sLabel}`,
              description: match?.description || "",
            });
            idx++;
          }
        }
      }
    }

    setTreatments(generated);
  };

  const currentStep = steps[currentStepIdx];
  const isFirstStep = currentStepIdx === 0;
  const isLastStep = currentStepIdx === steps.length - 1;

  // Save current step data and proceed
  const handleSaveAndNext = async () => {
    if (!currentStep) return;
    setBusy(true);

    try {
      if (currentStep.key === "factor1") {
        if (factor1Data.some((f) => !f.name.trim())) {
          throw new Error(`All ${names.A.toLowerCase()} names are required.`);
        }
        await save({ factor1Data });
        toast.success(`${names.A} updated`);
      } else if (currentStep.key === "factor2") {
        if (factor2Data.some((f) => !f.name.trim())) {
          throw new Error(`All ${names.B.toLowerCase()} names are required.`);
        }
        await save({ factor2Data });
        toast.success(`${names.B} updated`);
      } else if (currentStep.key === "factor3") {
        if (factor3Data.some((f) => !f.name.trim())) {
          throw new Error(`All ${names.C.toLowerCase()} names are required.`);
        }
        await save({ factor3Data });
        toast.success(`${names.C} updated`);
      } else if (currentStep.key === "mainPlot") {
        if (mainPlotData.some((m) => !m.name.trim())) {
          throw new Error(`All ${names.A.toLowerCase()} names are required.`);
        }
        await save({ mainPlotData });
        toast.success(`${names.A} updated`);
      } else if (currentStep.key === "subPlot") {
        if (subPlotData.some((s) => !s.croppingSystems?.length)) {
          throw new Error(
            `Choose a cropping system for at least one season of every sub plot.`,
          );
        }
        await save({
          subPlotData: subPlotData.map((s) => ({
            code: s.code.trim(),
            croppingSystems: s.croppingSystems ?? [],
            ...(s.description?.trim()
              ? { description: s.description.trim() }
              : {}),
          })),
        });
        toast.success(`${names.B} updated`);
      } else if (currentStep.key === "subSubPlot") {
        if (subSubPlotData.some((ss) => !ss.name.trim())) {
          throw new Error(`All ${names.C.toLowerCase()} names are required.`);
        }
        await save({ subSubPlotData });
        toast.success(`${names.C} updated`);
      } else if (currentStep.key === "treatments") {
        if (treatments.some((t) => !t.name.trim())) {
          throw new Error("All treatment names are required.");
        }
        await save({ treatments });
        toast.success("Treatments updated");
      } else if (currentStep.key === "parameters") {
        await save({
          disabledParameters: disabledList.map((d) => ({
            treatment: d.treatment,
            season: d.season,
            parameterId: d.parameterId,
          })),
        });
        toast.success("Trial protocol updated successfully");
        onClose();
        return;
      }

      if (isLastStep) {
        onClose();
      } else {
        const nextIdx = currentStepIdx + 1;
        const nextStep = steps[nextIdx];
        if (nextStep?.key === "treatments" && hasPlots) {
          recalculateDerivedTreatments();
        }
        setCurrentStepIdx(nextIdx);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update step");
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  if (!steps.length) {
    return (
      <Modal
        title="Update Protocol"
        onClose={onClose}
        wide
        style={{ maxWidth: 600 }}
      >
        <div
          className="stack"
          style={{ gap: 16, padding: 16, textAlign: "center" }}
        >
          <AlertCircle
            size={40}
            style={{ color: "var(--amber, #a86200)", margin: "0 auto" }}
          />
          <p>All protocol sections for this trial are currently locked.</p>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const level1Data = isFactorial ? factor1Data : mainPlotData;
  const level2Data = isFactorial ? factor2Data : subPlotData;
  const level3Data = isFactorial ? factor3Data : subSubPlotData;

  return (
    <Modal
      title="Update Trial Protocol"
      subtitle={`Step ${currentStepIdx + 1} of ${steps.length}: ${currentStep?.label}`}
      onClose={busy ? () => {} : onClose}
      wide
      style={{ maxWidth: "96vw", width: 1240 }}
      footer={
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            {!isFirstStep && (
              <button
                type="button"
                className="btn ghost"
                onClick={handleBack}
                disabled={busy}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <button
              type="button"
              className="btn"
              onClick={handleSaveAndNext}
              disabled={busy}
              style={{ minWidth: 120 }}
            >
              {busy ? (
                "Saving…"
              ) : isLastStep ? (
                <>
                  <Check size={14} /> Save & Finish
                </>
              ) : (
                <>
                  Save & Next <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        {/* Step Indicator Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 6,
            borderBottom: "1px solid var(--line, #e3e8e4)",
          }}
        >
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIdx;
            const isPast = idx < currentStepIdx;

            return (
              <button
                key={st.key}
                type="button"
                onClick={() => {
                  if (idx <= currentStepIdx && !busy) {
                    setCurrentStepIdx(idx);
                  }
                }}
                disabled={busy || idx > currentStepIdx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.82rem",
                  fontWeight: isCurrent ? 700 : 500,
                  border: isCurrent
                    ? "2px solid var(--green, #1b7f4b)"
                    : isPast
                      ? "1px solid var(--green, #1b7f4b)"
                      : "1px solid var(--line, #e3e8e4)",
                  background: isCurrent
                    ? "var(--green-bg, #e7f5ec)"
                    : isPast
                      ? "rgba(27, 127, 75, 0.08)"
                      : "#ffffff",
                  color:
                    isCurrent || isPast
                      ? "var(--green, #1b7f4b)"
                      : "var(--text-muted, #647069)",
                  cursor: idx <= currentStepIdx ? "pointer" : "default",
                  whiteSpace: "nowrap",
                }}
              >
                {isPast ? <Check size={12} /> : <span>{idx + 1}.</span>}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Content */}
        {currentStep?.key === "factor1" && (
          <PlotStepForm
            label={names.A}
            prefix="F1_"
            rows={factor1Data}
            onChange={setFactor1Data}
          />
        )}

        {currentStep?.key === "factor2" && (
          <PlotStepForm
            label={names.B}
            prefix="F2_"
            rows={factor2Data}
            onChange={setFactor2Data}
          />
        )}

        {currentStep?.key === "factor3" && (
          <PlotStepForm
            label={names.C}
            prefix="F3_"
            rows={factor3Data}
            onChange={setFactor3Data}
          />
        )}

        {currentStep?.key === "mainPlot" && (
          <PlotStepForm
            label={names.A}
            prefix="M"
            rows={mainPlotData}
            onChange={setMainPlotData}
          />
        )}

        {currentStep?.key === "subPlot" && (
          <PlotStepForm
            label={names.B}
            prefix="S"
            rows={subPlotData}
            onChange={setSubPlotData}
            isSubPlot
            croppingSystems={croppingSystems}
            seasonCodes={subPlotSeasons(e, croppingSystems.seasons.options)}
          />
        )}

        {currentStep?.key === "subSubPlot" && (
          <PlotStepForm
            label={names.C}
            prefix="SS"
            rows={subSubPlotData}
            onChange={setSubSubPlotData}
          />
        )}

        {currentStep?.key === "treatments" && (
          <TreatmentsStepForm
            isDerived={hasPlots}
            isFactorial={isFactorial}
            isSplitSplitPlot={hasC}
            names={names}
            level1Data={level1Data}
            level2Data={level2Data}
            level3Data={level3Data}
            rows={treatments}
            onChange={setTreatments}
            croppingSystems={croppingSystems}
          />
        )}

        {currentStep?.key === "parameters" && (
          <ParametersStepForm
            experiment={e}
            treatments={treatments}
            level1Data={level1Data}
            level2Data={level2Data}
            level3Data={level3Data}
            disabledList={disabledList}
            onChange={setDisabledList}
            croppingSystems={croppingSystems}
          />
        )}
      </div>
    </Modal>
  );
}
