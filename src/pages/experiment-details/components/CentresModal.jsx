import { useMemo, useState } from "react";
import Select from "react-select";
import { RotateCcw, Search } from "lucide-react";
import { ErrorNote, SaveModal } from "../../../components/forms";
import { Badge } from "../../../components/ui";
import { toast } from "../../../lib/toast";
import {
  effectiveSeasonCrops,
  sameCrops,
  seasonCropsPatch,
  seasonMap,
} from "../../../lib/seasonCrops";
import { useCentres } from "../../../queries/centres";
import { useCropOptions, useMasterOptions } from "../../../queries/masters";
import { useAssignCentres } from "../../../queries/research";
import { customSelectStyles } from "../../experiments/components/ExperimentSeasonsField";

// The PCU (research.assign) picks the centres that run the experiment. Each assigned centre has a
// trial: assigning creates it (or brings back a withdrawn one with its data), unticking withdraws
// it (kept, read-only). The experiment's seasons → crops are the default for every centre; a
// centre that grows something different gets its own crops for that season on its trial page too.
// Seasons come from the protocol only — this modal does not change them.

export function CentresModal({ experiment, trials = [], onClose }) {
  const centres = useCentres({ isActive: "true" });
  const seasons = useMasterOptions("season");
  const assign = useAssignCentres(experiment.id);

  // experiment.seasons: { SEASON_CODE: [cropId, …], … } (after seasonMap normalises it)
  const defaults = useMemo(
    () => seasonMap(experiment.seasons),
    [experiment.seasons],
  );
  const seasonCodes = Object.keys(defaults);

  const rows = useMemo(() => centres.data?.data ?? [], [centres.data]);

  const trialByCentre = useMemo(
    () => new Map(trials.map((t) => [t.centreId?.id, t])),
    [trials],
  );

  const assigned = useMemo(
    () => new Set(experiment.centreIds ?? []),
    [experiment.centreIds],
  );

  // Crop ids already selected anywhere (defaults + per-centre own) stay selectable even if the
  // crop master has since been deactivated (useCropOptions keeps them, labelled "inactive").
  const inUse = useMemo(
    () => [
      ...Object.values(defaults).flat(),
      ...trials.flatMap((t) =>
        Object.values(seasonMap(t.seasonCrops ?? {})).flat(),
      ),
    ],
    [defaults, trials],
  );
  const { options: cropOptions, optionOf } = useCropOptions(inUse);

  // Per-centre editable config: { [centreId]: { selected: bool, crops: { [seasonCode]: id[] } } }
  // Starts empty; first access seeds from the existing trial's crops (or the experiment defaults).
  const [configs, setConfigs] = useState({});

  const configOf = (centreId) => {
    if (configs[centreId]) return configs[centreId];
    const trial = trialByCentre.get(centreId);
    return {
      selected: assigned.has(centreId),
      crops: Object.fromEntries(
        effectiveSeasonCrops(experiment.seasons, trial?.seasonCrops).map(
          (s) => [s.seasonCode, s.crops],
        ),
      ),
    };
  };

  // Update fn always reads prev from the setter to avoid stale-closure issues.
  const update = (centreId, changeFn) =>
    setConfigs((prev) => {
      const current =
        prev[centreId] ??
        (() => {
          const trial = trialByCentre.get(centreId);
          return {
            selected: assigned.has(centreId),
            crops: Object.fromEntries(
              effectiveSeasonCrops(experiment.seasons, trial?.seasonCrops).map(
                (s) => [s.seasonCode, s.crops],
              ),
            ),
          };
        })();
      return { ...prev, [centreId]: { ...current, ...changeFn(current) } };
    });

  const [search, setSearch] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");

  const selectedIds = rows
    .map((c) => c.id)
    .filter((id) => configOf(id).selected);

  const withdrawing = [...assigned].filter((id) => !selectedIds.includes(id));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) =>
      [c.name, c.code, c.state, c.city, c.host].some((x) =>
        x?.toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  const onSave = async () => {
    const cropsMap = Object.fromEntries(
      selectedIds.map((id) => [
        id,
        seasonCropsPatch(
          experiment.seasons,
          trialByCentre.get(id)?.seasonCrops,
          configOf(id).crops,
        ),
      ]),
    );
    await assign.mutateAsync({
      centreIds: selectedIds,
      withdrawReason:
        withdrawing.length && withdrawReason.trim()
          ? withdrawReason.trim()
          : undefined,
      crops: cropsMap,
    });
    toast.success("Centres saved");
  };

  const reasonOk =
    !withdrawing.length ||
    withdrawReason.trim() === "" ||
    withdrawReason.trim().length >= 3;
  console.log({ filtered });
  return (
    <SaveModal
      title="Assign centres"
      subtitle="Select the centres that run this experiment. Each one uses the experiment's crops unless you set its own for a season."
      canSave={!centres.isPending && reasonOk}
      onSave={onSave}
      onClose={onClose}
      wide
    >
      <ErrorNote error={centres.error} />

      {/* ── Toolbar ── */}
      <div
        className="row spread"
        style={{ gap: 12, marginBottom: 4, flexWrap: "wrap" }}
      >
        <div className="row" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              rows.forEach((c) => update(c.id, () => ({ selected: true })))
            }
          >
            Select all
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              rows.forEach((c) => update(c.id, () => ({ selected: false })))
            }
          >
            Clear
          </button>
          <span className="muted small">
            {selectedIds.length} of {rows.length} selected
          </span>
        </div>
        <label className="search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centres…"
          />
        </label>
      </div>

      {/* ── Centre list ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: "52vh",
          overflowY: "auto",
          paddingRight: 2,
        }}
      >
        {centres.isPending && (
          <div
            className="muted"
            style={{ padding: "32px 0", textAlign: "center" }}
          >
            Loading centres…
          </div>
        )}

        {!centres.isPending && filtered.length === 0 && (
          <div
            className="muted"
            style={{ padding: "32px 0", textAlign: "center" }}
          >
            {search ? "No centres match your search." : "No centres available."}
          </div>
        )}

        {filtered.map((c) => {
          const cfg = configOf(c.id);
          const wasWithdrawn =
            trialByCentre.get(c.id)?.assignmentStatus === "Withdrawn";
          const own = seasonCodes.filter(
            (code) => !sameCrops(cfg.crops[code] ?? [], defaults[code] ?? []),
          );

          return (
            <div
              key={c.id}
              style={{
                border: `1px solid ${cfg.selected ? "var(--green, #1b7f4b)" : "var(--line, #e3e8e4)"}`,
                borderRadius: 8,
                // overflow: "hidden",
              }}
            >
              {/* Centre header row */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "10px 14px",
                  background: cfg.selected
                    ? "rgba(27, 127, 75, 0.04)"
                    : "transparent",
                }}
              >
                {/* Checkbox + name */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    margin: 0,
                    cursor: "pointer",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cfg.selected}
                    onChange={(e) =>
                      update(c.id, () => ({ selected: e.target.checked }))
                    }
                    style={{ width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "0.9rem", lineHeight: 1.3 }}>
                    <span style={{ fontWeight: 600 }}>
                      {c.host || c.code}
                      {/* asdf */}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted, #647069)",
                        marginLeft: 6,
                      }}
                    >
                      ({c.code})
                    </span>
                    {c.state && (
                      <span
                        style={{
                          color: "var(--text-muted, #647069)",
                          fontSize: "0.8rem",
                          marginLeft: 6,
                        }}
                      >
                        · {c.state}
                      </span>
                    )}
                  </span>
                </label>

                {/* Status badges */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexShrink: 0,
                    alignItems: "center",
                  }}
                >
                  {wasWithdrawn && !cfg.selected && (
                    <Badge tone="grey">Withdrawn</Badge>
                  )}
                  {wasWithdrawn && cfg.selected && (
                    <Badge tone="blue">Re-assign (keeps data)</Badge>
                  )}
                  {!cfg.selected && !wasWithdrawn && assigned.has(c.id) && (
                    <Badge tone="amber">Will be withdrawn</Badge>
                  )}
                  {cfg.selected && own.length > 0 && (
                    <Badge tone="amber">
                      Own crops: {own.map(seasons.nameOf).join(", ")}
                    </Badge>
                  )}
                  {cfg.selected &&
                    own.length === 0 &&
                    seasonCodes.length > 0 && (
                      <Badge tone="green">Experiment crops</Badge>
                    )}
                </div>
              </div>

              {/* Season-crops section — shown only for checked centres that have seasons */}
              {cfg.selected && seasonCodes.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "10px 14px 14px 42px",
                    borderTop: "1px solid var(--line, #e3e8e4)",
                    background: "var(--bg, #f5f7f5)",
                  }}
                >
                  {/* Section header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-muted, #647069)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Crops per season
                    </span>
                    {own.length > 0 && (
                      <button
                        type="button"
                        className="btn ghost xs"
                        onClick={() =>
                          update(c.id, () => ({ crops: { ...defaults } }))
                        }
                      >
                        <RotateCcw size={11} /> Reset to experiment defaults
                      </button>
                    )}
                  </div>

                  {/* One row per experiment season */}
                  {seasonCodes.map((code) => (
                    <div
                      key={code}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          minWidth: 100,
                          fontWeight: 550,
                          fontSize: "0.875rem",
                          paddingTop: 6,
                          flexShrink: 0,
                          color: own.includes(code)
                            ? "var(--amber, #a86200)"
                            : "inherit",
                        }}
                      >
                        {seasons.nameOf(code)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Select
                          isMulti
                          placeholder={`Select crops for ${seasons.nameOf(code)}…`}
                          options={cropOptions}
                          value={(cfg.crops[code] ?? [])
                            .map((id) => optionOf(id))
                            .filter(Boolean)}
                          onChange={(opts) =>
                            update(c.id, (cur) => ({
                              crops: {
                                ...cur.crops,
                                [code]: (opts ?? []).map((o) => o.value),
                              },
                            }))
                          }
                          styles={customSelectStyles}
                          menuPortalTarget={document.body}
                          closeMenuOnSelect={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No-seasons notice */}
      {seasonCodes.length === 0 && selectedIds.length > 0 && (
        <div className="note" style={{ marginTop: 4 }}>
          The experiment has no seasons configured yet — crop customisation per
          centre is not available. Add seasons in <b>Edit details</b>.
        </div>
      )}

      {/* Withdraw reason */}
      {withdrawing.length > 0 && (
        <div className="field">
          <label htmlFor="withdraw-reason">
            Reason for withdrawing {withdrawing.length} centre
            {withdrawing.length === 1 ? "" : "s"}{" "}
            <span className="muted">(optional)</span>
          </label>
          <input
            id="withdraw-reason"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="e.g. Centre moved to another programme"
          />
          {!reasonOk && (
            <span className="field-error">At least 3 characters.</span>
          )}
        </div>
      )}

      <div className="note">
        Each assigned centre gets its own trial, initialized with the
        experiment&apos;s treatments and plot configuration. A withdrawn centre
        keeps its trial and data, read-only; assigning it again brings them
        back.
      </div>
    </SaveModal>
  );
}
