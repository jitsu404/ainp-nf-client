import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CheckCheck,
  Copy,
  Info,
  Search,
  Square,
} from "lucide-react";
import { SaveModal } from "../../../components/forms";
import { seasonMap } from "../../../lib/seasonCrops";
import { toast } from "../../../lib/toast";
import { useMasterOptions, useUnitLabel } from "../../../queries/masters";

/**
 * Three-state header checkbox with indeterminate support.
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
 * Configure which parameters are recorded per treatment in each season.
 * All parameters are ACTIVE (checked) by default.
 * Only unchecked if present in `experiment.disabledParameters`.
 * Sends full dataset across all seasons upon save.
 */
export function TreatmentParametersModal({ experiment, save, onClose }) {
  const seasonsMaster = useMasterOptions("season");
  const unit = useUnitLabel();

  const treatments = useMemo(
    () => experiment.treatments ?? [],
    [experiment.treatments],
  );
  const parameters = useMemo(
    () => experiment.defaultParameters ?? experiment.parameters ?? [],
    [experiment.defaultParameters, experiment.parameters],
  );

  const mainPlotData = experiment.mainPlotData ?? [];
  const subPlotData = experiment.subPlotData ?? [];
  const subSubPlotData = experiment.subSubPlotData ?? [];

  const seasonCodes = useMemo(
    () => Object.keys(seasonMap(experiment.seasons)),
    [experiment.seasons],
  );

  const [activeSeason, setActiveSeason] = useState(() => seasonCodes[0] || "");
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [isTransposed, setIsTransposed] = useState(false);

  // disabledList holds all { treatment, season, parameterId } entries across all seasons
  const [disabledList, setDisabledList] = useState(() =>
    (experiment.disabledParameters ?? []).map((d) => ({
      treatment: String(d.treatment).toUpperCase().trim(),
      season: String(d.season).toUpperCase().trim(),
      parameterId: String(d.parameterId),
    })),
  );

  // Unique sections from parameters
  const sections = useMemo(() => {
    const set = new Set();
    for (const p of parameters) {
      if (p.section) set.add(p.section);
    }
    return Array.from(set).sort();
  }, [parameters]);

  // Filtered parameters based on search and section filter
  const filteredParameters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parameters.filter((p) => {
      if (selectedSection !== "all" && p.section !== selectedSection) {
        return false;
      }
      if (q) {
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCode = p.code?.toLowerCase().includes(q);
        const matchSection = p.section?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSection) return false;
      }
      return true;
    });
  }, [parameters, search, selectedSection]);

  // Treatment hover details resolution
  const getTreatmentInfo = (t) => {
    const mainPlot = mainPlotData.find((m) => m.code === t.mainPlotCode);
    const subPlot = subPlotData.find((s) => s.code === t.subPlotCode);
    const subSubPlot = subSubPlotData.find(
      (ss) => ss.code === t.subSubPlotCode,
    );

    const lines = [];
    lines.push(`Treatment: ${t.code} - ${t.name}`);
    if (t.mainPlotCode) {
      lines.push(
        `Main Plot: ${t.mainPlotCode}${mainPlot?.name ? ` (${mainPlot.name})` : ""}`,
      );
    }
    if (t.subPlotCode) {
      lines.push(
        `Sub Plot: ${t.subPlotCode}${subPlot?.name ? ` (${subPlot.name})` : ""}`,
      );
    }
    if (t.subSubPlotCode) {
      lines.push(
        `Sub-sub Plot: ${t.subSubPlotCode}${subSubPlot?.name ? ` (${subSubPlot.name})` : ""}`,
      );
    }
    if (t.description) {
      lines.push(`Description: ${t.description}`);
    }
    return {
      title: lines.join("\n"),
      mainPlotName: mainPlot?.name,
      subPlotName: subPlot?.name,
      subSubPlotName: subSubPlot?.name,
    };
  };

  // Check if disabled in the given season
  const isDisabled = (tCode, pId, season = activeSeason) => {
    const pIdStr = String(pId);
    return disabledList.some(
      (d) =>
        d.treatment === tCode &&
        d.season === season &&
        d.parameterId === pIdStr,
    );
  };

  // Toggle single cell
  const toggleCell = (tCode, pId) => {
    const pIdStr = String(pId);
    setDisabledList((prev) => {
      const exists = prev.some(
        (d) =>
          d.treatment === tCode &&
          d.season === activeSeason &&
          d.parameterId === pIdStr,
      );
      if (exists) {
        // Was disabled -> now enabled
        return prev.filter(
          (d) =>
            !(
              d.treatment === tCode &&
              d.season === activeSeason &&
              d.parameterId === pIdStr
            ),
        );
      } else {
        // Was enabled -> now disabled
        return [
          ...prev,
          {
            treatment: tCode,
            season: activeSeason,
            parameterId: pIdStr,
          },
        ];
      }
    });
  };

  // Toggle treatment (column in default view, row in transposed view)
  const toggleTreatment = (tCode) => {
    const allFilteredIds = filteredParameters.map((p) => String(p.parameterId));
    const allDisabled = allFilteredIds.every((pId) =>
      isDisabled(tCode, pId, activeSeason),
    );

    setDisabledList((prev) => {
      if (allDisabled) {
        // All were disabled -> enable all
        return prev.filter(
          (d) =>
            !(
              d.treatment === tCode &&
              d.season === activeSeason &&
              allFilteredIds.includes(d.parameterId)
            ),
        );
      } else {
        // Some or all were enabled -> disable all
        const additions = [];
        for (const pId of allFilteredIds) {
          if (
            !prev.some(
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
        return [...prev, ...additions];
      }
    });
  };

  // Toggle parameter (row in default view, column in transposed view)
  const toggleParameter = (pId) => {
    const pIdStr = String(pId);
    const allTreatmentCodes = treatments.map((t) => t.code);
    const allDisabled = allTreatmentCodes.every((tCode) =>
      isDisabled(tCode, pIdStr, activeSeason),
    );

    setDisabledList((prev) => {
      if (allDisabled) {
        // All were disabled -> enable all
        return prev.filter(
          (d) =>
            !(
              d.season === activeSeason &&
              d.parameterId === pIdStr &&
              allTreatmentCodes.includes(d.treatment)
            ),
        );
      } else {
        // Some or all were enabled -> disable all
        const additions = [];
        for (const tCode of allTreatmentCodes) {
          if (
            !prev.some(
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
        return [...prev, ...additions];
      }
    });
  };

  // Bulk enable all in active season
  const enableAllInSeason = () => {
    setDisabledList((prev) => prev.filter((d) => d.season !== activeSeason));
    toast.success(
      `All parameters enabled for ${seasonsMaster.nameOf(activeSeason) || activeSeason}`,
    );
  };

  // Bulk disable all in active season
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
    setDisabledList((prev) => [
      ...prev.filter((d) => d.season !== activeSeason),
      ...newItems,
    ]);
    toast.info(
      `All parameters disabled for ${seasonsMaster.nameOf(activeSeason) || activeSeason}`,
    );
  };

  // Copy current season configuration to all other seasons
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

    setDisabledList([...currentSeasonDisabled, ...cloned]);
    toast.success(
      `Copied ${seasonsMaster.nameOf(activeSeason) || activeSeason} configuration to ${otherSeasons.map((s) => seasonsMaster.nameOf(s) || s).join(", ")}`,
    );
  };

  // Save handler sends the complete array spanning all seasons
  const onSave = async () => {
    await save({
      disabledParameters: disabledList.map((d) => ({
        treatment: d.treatment,
        season: d.season,
        parameterId: d.parameterId,
      })),
    });
  };

  const activeSeasonDisabledCount = disabledList.filter(
    (d) => d.season === activeSeason,
  ).length;

  return (
    <SaveModal
      title="Set Treatment Parameters"
      subtitle="Configure parameter applicability across treatments per season. All parameters are active by default; uncheck to exclude a parameter from data collection."
      onSave={onSave}
      onClose={onClose}
      style={{ maxWidth: "95vw", width: 1280 }}
    >
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
          {/* Left: Search & Filter */}
          <div
            className="row"
            style={{ gap: 10, alignItems: "center", flex: 1, minWidth: 280 }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
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
                placeholder="Filter parameters…"
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
                style={{ maxWidth: 180, height: 32, fontSize: "0.82rem" }}
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

          {/* Right: Actions & View Switcher */}
          <div
            className="row"
            style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}
          >
            <button
              type="button"
              className="btn ghost sm"
              style={{ height: 32 }}
              onClick={enableAllInSeason}
              title="Enable all parameters in active season"
            >
              <CheckCheck
                size={14}
                style={{ color: "var(--green, #1b7f4b)" }}
              />{" "}
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
            <button
              type="button"
              className="btn ghost sm"
              style={{ height: 32 }}
              onClick={() => setIsTransposed((t) => !t)}
              title="Switch rows and columns"
            >
              <ArrowLeftRight size={14} />{" "}
              {isTransposed ? "Treatments as Columns" : "Treatments as Rows"}
            </button>
          </div>
        </div>

        {/* Matrix Grid Container */}
        <div
          className="table-wrap"
          style={{
            maxHeight: "56vh",
            overflow: "auto",
            border: "1px solid var(--line, #e3e8e4)",
            borderRadius: 8,
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          {!isTransposed ? (
            /* Standard View: Parameters as Rows, Treatments as Columns */
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  {/* Sticky Top-Left Corner Cell */}
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      top: 0,
                      zIndex: 10,
                      background: "#f8faf9",
                      minWidth: 320,
                      maxWidth: 380,
                      borderBottom: "2px solid var(--line, #e3e8e4)",
                      borderRight: "2px solid var(--line, #e3e8e4)",
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      className="row"
                      style={{
                        justifyContent: "space-between",
                        alignItems: "center",
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
                      <span
                        className="muted small"
                        style={{ fontWeight: 500, fontSize: "0.72rem" }}
                      >
                        Row toggle on left
                      </span>
                    </div>
                  </th>

                  {/* Treatment Column Headers */}
                  {treatments.map((t) => {
                    const info = getTreatmentInfo(t);
                    const allFilteredIds = filteredParameters.map((p) =>
                      String(p.parameterId),
                    );
                    const disabledCount = allFilteredIds.filter((pId) =>
                      isDisabled(t.code, pId, activeSeason),
                    ).length;
                    const allChecked =
                      disabledCount === 0 && allFilteredIds.length > 0;
                    const someChecked =
                      disabledCount < allFilteredIds.length &&
                      disabledCount > 0;

                    return (
                      <th
                        key={t.code}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 5,
                          background: "#f8faf9",
                          minWidth: 105,
                          maxWidth: 130,
                          textAlign: "center",
                          borderBottom: "2px solid var(--line, #e3e8e4)",
                          borderRight: "1px solid var(--line, #e3e8e4)",
                          padding: "8px 6px",
                        }}
                        title={info.title}
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
                                padding: "2px 7px",
                                borderRadius: 4,
                                background: "var(--green-bg, #e7f5ec)",
                                color: "var(--green, #1b7f4b)",
                                fontWeight: 700,
                                fontSize: "0.82rem",
                                letterSpacing: "0.02em",
                              }}
                            >
                              {t.code}
                            </span>
                            <Info
                              size={12}
                              className="text-muted"
                              style={{ cursor: "help" }}
                            />
                          </div>

                          <div
                            style={{
                              fontSize: "0.73rem",
                              color: "var(--text-muted, #647069)",
                              fontWeight: 500,
                              maxWidth: 110,
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
                              padding: "2px 6px",
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
                                fontSize: "0.68rem",
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
                      style={{ textAlign: "center", padding: 36 }}
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
                      disabledCount < allTreatmentCodes.length &&
                      disabledCount > 0;
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={pId}
                        style={{ background: isEven ? "#ffffff" : "#fafcfa" }}
                      >
                        {/* Sticky Parameter Name Column */}
                        <td
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 3,
                            background: isEven ? "#ffffff" : "#fafcfa",
                            borderBottom: "1px solid #edf0ed",
                            borderRight: "2px solid var(--line, #e3e8e4)",
                            padding: "8px 14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
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
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "0.84rem",
                                    color: "var(--ink, #1b2420)",
                                  }}
                                >
                                  {p.name}
                                </span>
                                {p.unitCode && (
                                  <span
                                    className="muted small"
                                    style={{ fontSize: "0.75rem" }}
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
                                    style={{ fontSize: "0.72rem" }}
                                  >
                                    {p.code}
                                  </span>
                                )}
                                {p.section && (
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      background: "var(--grey-bg, #eef1ee)",
                                      color: "var(--text-muted, #5c6660)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {p.section}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Treatment Checkbox Cells */}
                        {treatments.map((t) => {
                          const disabled = isDisabled(
                            t.code,
                            pId,
                            activeSeason,
                          );
                          const checked = !disabled;
                          const info = getTreatmentInfo(t);

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
                                  ? "rgba(100, 116, 139, 0.04)"
                                  : "transparent",
                                transition: "background 0.12s ease",
                              }}
                              title={`${checked ? "Active" : "Disabled"}: ${t.code} · ${p.name}\nClick to toggle\n\n${info.title}`}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "100%",
                                  height: "100%",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCell(t.code, pId)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    cursor: "pointer",
                                    width: 17,
                                    height: 17,
                                    accentColor: "var(--green, #1b7f4b)",
                                  }}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Transposed View: Treatments as Rows, Parameters as Columns */
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  {/* Sticky Top-Left Corner Cell */}
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      top: 0,
                      zIndex: 10,
                      background: "#f8faf9",
                      minWidth: 260,
                      borderBottom: "2px solid var(--line, #e3e8e4)",
                      borderRight: "2px solid var(--line, #e3e8e4)",
                      padding: "10px 14px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        letterSpacing: "0.04em",
                      }}
                    >
                      TREATMENT ({treatments.length})
                    </span>
                  </th>

                  {/* Parameter Column Headers */}
                  {filteredParameters.map((p) => {
                    const pId = String(p.parameterId);
                    const allTreatmentCodes = treatments.map((t) => t.code);
                    const disabledCount = allTreatmentCodes.filter((tCode) =>
                      isDisabled(tCode, pId, activeSeason),
                    ).length;
                    const allChecked = disabledCount === 0;
                    const someChecked =
                      disabledCount < allTreatmentCodes.length &&
                      disabledCount > 0;

                    return (
                      <th
                        key={pId}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 5,
                          background: "#f8faf9",
                          minWidth: 110,
                          maxWidth: 130,
                          textAlign: "center",
                          borderBottom: "2px solid var(--line, #e3e8e4)",
                          borderRight: "1px solid var(--line, #e3e8e4)",
                          padding: "8px 6px",
                        }}
                        title={`${p.name}${p.unitCode ? ` (${unit(p.unitCode)})` : ""}\nSection: ${p.section || "—"}`}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span
                            style={{
                              maxWidth: 105,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                            }}
                          >
                            {p.name}
                          </span>
                          <span
                            className="muted small"
                            style={{ fontSize: "0.68rem" }}
                          >
                            {p.section || "—"}
                          </span>
                          <div
                            style={{
                              marginTop: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#ffffff",
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: "1px solid var(--line, #e3e8e4)",
                            }}
                          >
                            <HeaderCheckbox
                              checked={allChecked}
                              indeterminate={someChecked}
                              onChange={() => toggleParameter(pId)}
                              title={
                                allChecked
                                  ? `Disable all for ${p.name}`
                                  : `Enable all for ${p.name}`
                              }
                            />
                            <span
                              style={{
                                fontSize: "0.68rem",
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
                {treatments.map((t, idx) => {
                  const info = getTreatmentInfo(t);
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
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={t.code}
                      style={{ background: isEven ? "#ffffff" : "#fafcfa" }}
                    >
                      {/* Sticky Treatment Name Column */}
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 3,
                          background: isEven ? "#ffffff" : "#fafcfa",
                          borderBottom: "1px solid #edf0ed",
                          borderRight: "2px solid var(--line, #e3e8e4)",
                          padding: "8px 14px",
                        }}
                        title={info.title}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
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
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
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
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.84rem",
                                  color: "var(--ink, #1b2420)",
                                }}
                              >
                                {t.name}
                              </span>
                              <Info
                                size={12}
                                className="text-muted"
                                style={{ cursor: "help" }}
                              />
                            </div>

                            {(info.mainPlotName ||
                              info.subPlotName ||
                              info.subSubPlotName) && (
                              <div
                                className="muted small"
                                style={{ fontSize: "0.72rem", marginTop: 2 }}
                              >
                                {[
                                  info.mainPlotName &&
                                    `M: ${info.mainPlotName}`,
                                  info.subPlotName && `S: ${info.subPlotName}`,
                                  info.subSubPlotName &&
                                    `SS: ${info.subSubPlotName}`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Parameter Checkbox Cells */}
                      {filteredParameters.map((p) => {
                        const pId = String(p.parameterId);
                        const disabled = isDisabled(t.code, pId, activeSeason);
                        const checked = !disabled;

                        return (
                          <td
                            key={pId}
                            onClick={() => toggleCell(t.code, pId)}
                            style={{
                              textAlign: "center",
                              cursor: "pointer",
                              userSelect: "none",
                              padding: "8px 4px",
                              borderBottom: "1px solid #edf0ed",
                              borderRight: "1px solid #edf0ed",
                              background: disabled
                                ? "rgba(100, 116, 139, 0.04)"
                                : "transparent",
                              transition: "background 0.12s ease",
                            }}
                            title={`${checked ? "Active" : "Disabled"}: ${t.code} · ${p.name}`}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCell(t.code, pId)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  cursor: "pointer",
                                  width: 17,
                                  height: 17,
                                  accentColor: "var(--green, #1b7f4b)",
                                }}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Legend and Summary Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "8px 12px",
            background: "#f9faf9",
            borderRadius: 6,
            border: "1px solid var(--line, #e3e8e4)",
            fontSize: "0.8rem",
          }}
        >
          <div className="row" style={{ gap: 20, alignItems: "center" }}>
            <span className="row" style={{ gap: 6, alignItems: "center" }}>
              <input
                type="checkbox"
                checked
                readOnly
                style={{
                  width: 15,
                  height: 15,
                  accentColor: "var(--green, #1b7f4b)",
                }}
              />
              <span>
                Checked = <b>Active</b> (Recorded in sheet)
              </span>
            </span>
            <span className="row" style={{ gap: 6, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={false}
                readOnly
                style={{ width: 15, height: 15 }}
              />
              <span>
                Unchecked = <b>Disabled</b> (Excluded from sheet)
              </span>
            </span>
          </div>

          <div className="muted" style={{ fontSize: "0.78rem" }}>
            Season <b>{seasonsMaster.nameOf(activeSeason) || activeSeason}</b>:{" "}
            <span
              style={{
                color:
                  activeSeasonDisabledCount > 0
                    ? "var(--amber, #a86200)"
                    : "var(--green, #1b7f4b)",
                fontWeight: 600,
              }}
            >
              {activeSeasonDisabledCount} disabled
            </span>{" "}
            · Total across all seasons: <b>{disabledList.length}</b> disabled
          </div>
        </div>
      </div>
    </SaveModal>
  );
}
