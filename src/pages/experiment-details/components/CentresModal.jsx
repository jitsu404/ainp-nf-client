import { useMemo, useState } from "react";
import Select from "react-select";
import { ChevronDown, ChevronUp, RotateCcw, Search } from "lucide-react";
import { ErrorNote, SaveModal } from "../../../components/forms";
import { Badge } from "../../../components/ui";
import { useCentres } from "../../../queries/centres";
import { useMasterOptions, useMasters } from "../../../queries/masters";
import {
  useBulkAssignExperiment,
  useExperimentAssignments,
} from "../../../queries/assignments";
import { customSelectStyles } from "../../experiments/components/ExperimentSeasonsField";

const extractCropIds = (crops) => {
  if (!Array.isArray(crops)) return [];
  return crops
    .map((c) => (typeof c === "object" ? c?._id || c?.id : String(c)))
    .filter(Boolean);
};

const normalizeSeasons = (raw) => {
  if (!raw) return {};
  const res = {};
  if (raw instanceof Map) {
    for (const [k, v] of raw.entries()) {
      res[k] = extractCropIds(v);
    }
  } else if (typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      res[k] = extractCropIds(v);
    }
  }
  return res;
};

export function CentresModal({ experiment, save, onClose }) {
  const centres = useCentres({ isActive: "true" });
  const seasonsMaster = useMasterOptions("season");
  const cropsQuery = useMasters("crop", { isActive: true });
  const assignmentsQuery = useExperimentAssignments({
    experiment: experiment.id || experiment._id,
  });
  const bulkAssign = useBulkAssignExperiment();

  const [search, setSearch] = useState("");
  const [expandedCentreId, setExpandedCentreId] = useState(null);

  // Protocol defaults from experiment.seasons
  const defaultSeasons = useMemo(
    () => normalizeSeasons(experiment.seasons),
    [experiment.seasons],
  );

  const rows = useMemo(() => centres.data?.data ?? [], [centres.data]);

  // Crop options for react-select
  const cropSelectOptions = useMemo(() => {
    return (cropsQuery.data ?? []).map((c) => ({
      value: String(c._id || c.id),
      label: `${c.name}${c.code ? ` (${c.code})` : ""}`,
    }));
  }, [cropsQuery.data]);

  const cropMap = useMemo(() => {
    const map = new Map();
    for (const opt of cropSelectOptions) {
      map.set(opt.value, opt);
    }
    return map;
  }, [cropSelectOptions]);

  // Centre configs: { [centreId]: { selected: boolean, seasons: Record<string, string[]> } }
  const [centreConfigs, setCentreConfigs] = useState(() => {
    const initial = {};
    const assignedIds = new Set(experiment.centreIds || []);
    for (const c of rows) {
      initial[c.id] = {
        selected: assignedIds.has(c.id),
        seasons: { ...defaultSeasons },
      };
    }
    return initial;
  });

  // Once existing assignments load from backend, merge existing customized seasons & status
  const [initializedAssignments, setInitializedAssignments] = useState(false);
  if (!initializedAssignments && assignmentsQuery.data && rows.length > 0) {
    setCentreConfigs((prev) => {
      const next = { ...prev };
      const assignmentList = Array.isArray(assignmentsQuery.data)
        ? assignmentsQuery.data
        : (assignmentsQuery.data?.data ?? []);

      const assignmentMap = new Map();
      for (const a of assignmentList) {
        const cId = String(a.centre?._id || a.centre?.id || a.centre);
        assignmentMap.set(cId, a);
      }

      for (const c of rows) {
        const existingAssignment = assignmentMap.get(String(c.id));
        if (existingAssignment) {
          const isAssigned = existingAssignment.status !== "inactive";
          next[c.id] = {
            selected: isAssigned,
            seasons: isAssigned
              ? {
                  ...defaultSeasons,
                  ...normalizeSeasons(existingAssignment.seasons),
                }
              : { ...defaultSeasons },
          };
        } else if (!next[c.id]) {
          const isAssigned = (experiment.centreIds || []).includes(c.id);
          next[c.id] = {
            selected: isAssigned,
            seasons: { ...defaultSeasons },
          };
        }
      }
      return next;
    });
    setInitializedAssignments(true);
  }

  const selectedCount = useMemo(() => {
    return Object.values(centreConfigs).filter((cfg) => cfg?.selected).length;
  }, [centreConfigs]);

  const handleSelectAll = () => {
    setCentreConfigs((prev) => {
      const next = { ...prev };
      for (const c of rows) {
        next[c.id] = {
          selected: true,
          seasons: next[c.id]?.seasons || { ...defaultSeasons },
        };
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setCentreConfigs((prev) => {
      const next = { ...prev };
      for (const c of rows) {
        next[c.id] = {
          ...(next[c.id] || {}),
          selected: false,
        };
      }
      return next;
    });
  };

  const handleToggleCentre = (centreId, on) => {
    setCentreConfigs((prev) => ({
      ...prev,
      [centreId]: {
        selected: on,
        seasons: prev[centreId]?.seasons || { ...defaultSeasons },
      },
    }));
    if (on && !expandedCentreId) {
      setExpandedCentreId(centreId);
    }
  };

  const handleToggleSeason = (centreId, seasonCode, on) => {
    setCentreConfigs((prev) => {
      const current = prev[centreId] || { selected: true, seasons: {} };
      const nextSeasons = { ...(current.seasons || {}) };
      if (on) {
        nextSeasons[seasonCode] =
          nextSeasons[seasonCode] || defaultSeasons[seasonCode] || [];
      } else {
        delete nextSeasons[seasonCode];
      }
      return {
        ...prev,
        [centreId]: {
          ...current,
          seasons: nextSeasons,
        },
      };
    });
  };

  const handleCropsChange = (centreId, seasonCode, selectedOpts) => {
    const newCropIds = (selectedOpts ?? []).map((opt) => opt.value);
    setCentreConfigs((prev) => {
      const current = prev[centreId] || { selected: true, seasons: {} };
      return {
        ...prev,
        [centreId]: {
          ...current,
          seasons: {
            ...(current.seasons || {}),
            [seasonCode]: newCropIds,
          },
        },
      };
    });
  };

  const handleResetToDefault = (centreId, e) => {
    e.stopPropagation();
    setCentreConfigs((prev) => ({
      ...prev,
      [centreId]: {
        ...(prev[centreId] || {}),
        seasons: { ...defaultSeasons },
      },
    }));
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.state && c.state.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const onSave = async () => {
    const selectedAssignments = rows
      .filter((c) => centreConfigs[c.id]?.selected)
      .map((c) => ({
        centre: c.id,
        status: "In progress",
        seasons: centreConfigs[c.id]?.seasons || defaultSeasons,
      }));

    // Call backend bulk-add API
    await bulkAssign.mutateAsync({
      experiment: experiment.id || experiment._id,
      assignments: selectedAssignments,
    });

    // Also update experiment document centreIds for full consistency
    if (typeof save === "function") {
      await save({ centreIds: selectedAssignments.map((a) => a.centre) });
    }
  };

  const seasonOptionsList = seasonsMaster.options || [];

  return (
    <SaveModal
      title="Assign centres"
      subtitle="Select centres to run this experiment and customize their seasons and crops."
      canSave={!centres.isPending && !bulkAssign.isPending}
      onSave={onSave}
      onClose={onClose}
      wide={true}
      style={{ maxWidth: 860 }}
    >
      <ErrorNote error={centres.error || bulkAssign.error} />

      <div
        className="row spread"
        style={{
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleClearAll}
          >
            Clear
          </button>
          <span className="muted small font-medium">
            {selectedCount} of {rows.length} selected
          </span>
        </div>

        <div
          className="row"
          style={{
            alignItems: "center",
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--line, #e3e8e4)",
            borderRadius: "6px",
            padding: "4px 8px",
            minWidth: 220,
          }}
        >
          <Search size={14} className="muted" style={{ marginRight: 6 }} />
          <input
            type="text"
            placeholder="Search centres…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.85rem",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div
        className="stack"
        style={{
          maxHeight: "52vh",
          overflowY: "auto",
          gap: 8,
          paddingRight: 4,
        }}
      >
        {filteredRows.length === 0 ? (
          <div
            className="muted center"
            style={{ padding: "32px 0", fontSize: "0.9rem" }}
          >
            No centres match your search.
          </div>
        ) : (
          filteredRows.map((c) => {
            const config = centreConfigs[c.id] || {
              selected: false,
              seasons: defaultSeasons,
            };
            const isSelected = !!config.selected;
            const isExpanded = expandedCentreId === c.id;
            const centreSeasons = config.seasons || {};
            const activeSeasonCodes = Object.keys(centreSeasons);

            return (
              <div
                key={c.id}
                style={{
                  border: isSelected
                    ? "1px solid var(--green, #1b7f4b)"
                    : "1px solid var(--line, #e3e8e4)",
                  borderRadius: "8px",
                  background: isSelected
                    ? "var(--surface, #ffffff)"
                    : "var(--bg, #fbfcfb)",
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Header row */}
                <div
                  className="row spread"
                  style={{
                    padding: "10px 14px",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    background: isSelected
                      ? "rgba(27, 127, 75, 0.04)"
                      : "transparent",
                  }}
                  onClick={() =>
                    isSelected && setExpandedCentreId(isExpanded ? null : c.id)
                  }
                >
                  <div
                    className="row"
                    style={{
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleToggleCentre(c.id, e.target.checked)
                      }
                      style={{
                        cursor: "pointer",
                        width: 16,
                        height: 16,
                        accentColor: "var(--green, #1b7f4b)",
                      }}
                    />
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.92rem",
                        color: isSelected
                          ? "var(--ink, #1b2420)"
                          : "var(--text-muted, #647069)",
                      }}
                    >
                      {c.name}
                      <span
                        className="muted"
                        style={{ marginLeft: 6, fontWeight: 400 }}
                      >
                        ({c.code})
                      </span>
                      {c.state && (
                        <span
                          className="muted small"
                          style={{ marginLeft: 6, fontWeight: 400 }}
                        >
                          · {c.state}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="row" style={{ alignItems: "center", gap: 8 }}>
                    {isSelected ? (
                      <>
                        <div
                          className="row"
                          style={{
                            gap: 4,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          {activeSeasonCodes.length === 0 ? (
                            <Badge tone="amber">No seasons enabled</Badge>
                          ) : (
                            activeSeasonCodes.map((sCode) => {
                              const sName =
                                seasonsMaster.nameOf(sCode) || sCode;
                              const cropCount = (centreSeasons[sCode] || [])
                                .length;
                              return (
                                <Badge key={sCode} tone="green">
                                  {sName}: {cropCount}{" "}
                                  {cropCount === 1 ? "crop" : "crops"}
                                </Badge>
                              );
                            })
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn ghost xs"
                          title="Reset seasons & crops to protocol defaults"
                          onClick={(e) => handleResetToDefault(c.id, e)}
                        >
                          <RotateCcw size={12} />
                        </button>

                        <button
                          type="button"
                          className="btn ghost xs"
                          style={{ padding: "3px 6px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCentreId(isExpanded ? null : c.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </>
                    ) : (
                      <span className="muted small">Not assigned</span>
                    )}
                  </div>
                </div>

                {/* Customization sub-panel when expanded */}
                {isSelected && isExpanded && (
                  <div
                    style={{
                      padding: "12px 14px 14px 38px",
                      borderTop: "1px solid var(--line, #e3e8e4)",
                      background: "var(--surface, #ffffff)",
                    }}
                  >
                    <div
                      className="row spread"
                      style={{
                        marginBottom: 10,
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="small"
                        style={{
                          fontWeight: 600,
                          color: "var(--ink, #1b2420)",
                        }}
                      >
                        Customize seasons and crops for {c.name}:
                      </span>
                      <button
                        type="button"
                        className="btn ghost xs"
                        onClick={(e) => handleResetToDefault(c.id, e)}
                      >
                        <RotateCcw size={12} /> Reset to experiment defaults
                      </button>
                    </div>

                    <div className="stack" style={{ gap: 10 }}>
                      {seasonOptionsList.map(([sCode, sName]) => {
                        const isSeasonActive = Boolean(
                          centreSeasons[sCode] !== undefined,
                        );
                        const selectedCrops = (centreSeasons[sCode] || [])
                          .map((id) => cropMap.get(id))
                          .filter(Boolean);

                        return (
                          <div
                            key={sCode}
                            className="row"
                            style={{
                              alignItems: "center",
                              gap: 12,
                              padding: "6px 8px",
                              borderRadius: "6px",
                              background: isSeasonActive
                                ? "var(--green-bg, #f4faf6)"
                                : "var(--bg, #f9faf9)",
                              border: "1px solid var(--line, #e3e8e4)",
                            }}
                          >
                            <label
                              className="row"
                              style={{
                                alignItems: "center",
                                gap: 8,
                                minWidth: 140,
                                cursor: "pointer",
                                margin: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSeasonActive}
                                onChange={(e) =>
                                  handleToggleSeason(
                                    c.id,
                                    sCode,
                                    e.target.checked,
                                  )
                                }
                                style={{
                                  accentColor: "var(--green, #1b7f4b)",
                                }}
                              />
                              <span
                                style={{
                                  fontWeight: isSeasonActive ? 600 : 400,
                                  fontSize: "0.85rem",
                                  color: isSeasonActive
                                    ? "var(--ink, #1b2420)"
                                    : "var(--text-muted, #647069)",
                                }}
                              >
                                {sName}
                              </span>
                            </label>

                            <div style={{ flex: 1, minWidth: 200 }}>
                              <Select
                                isMulti
                                isDisabled={!isSeasonActive}
                                placeholder={
                                  isSeasonActive
                                    ? `Select crops for ${sName}…`
                                    : `Enable ${sName} to select crops`
                                }
                                options={cropSelectOptions}
                                value={selectedCrops}
                                onChange={(opts) =>
                                  handleCropsChange(c.id, sCode, opts)
                                }
                                styles={customSelectStyles}
                                menuPortalTarget={document.body}
                                closeMenuOnSelect={false}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="note" style={{ marginTop: 12 }}>
        Each assigned centre gets its own trial to set up and record data in.
        Removing a centre marks its assignment as inactive while retaining
        historical records.
      </div>
    </SaveModal>
  );
}
