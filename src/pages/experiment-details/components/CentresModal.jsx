import { useMemo, useState } from "react";
import Select from "react-select";
import { ChevronDown, ChevronUp, RotateCcw, Search } from "lucide-react";
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
import { useMasterOptions, useMasters } from "../../../queries/masters";
import { useAssignCentres } from "../../../queries/research";
import { customSelectStyles } from "../../experiments/components/ExperimentSeasonsField";

// The PCU (research.assign) picks the centres that run the experiment. Each assigned centre has a
// trial: assigning creates it (or brings back a withdrawn one with its data), unticking withdraws
// it (kept, read-only). The experiment's crops per season are every centre's default; a centre
// that grows something else gets its own crops for that season on its trial (also editable by the
// centre on its trial page). Seasons come from the protocol only.

export function CentresModal({ experiment, trials = [], onClose }) {
  const centres = useCentres({ isActive: "true" });
  const seasons = useMasterOptions("season");
  const cropsQuery = useMasters("crop", { isActive: true });
  const assign = useAssignCentres(experiment.id);

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

  const cropOptions = useMemo(
    () =>
      (cropsQuery.data ?? []).map((c) => ({
        value: String(c.id ?? c._id),
        label: `${c.name}${c.code ? ` (${c.code})` : ""}`,
      })),
    [cropsQuery.data],
  );
  const cropOption = useMemo(
    () => new Map(cropOptions.map((o) => [o.value, o])),
    [cropOptions],
  );

  // { [centreId]: { selected, crops: { [season]: ids } } }, starting from each trial's crops.
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
  const update = (centreId, change) =>
    setConfigs((prev) => ({
      ...prev,
      [centreId]: { ...configOf(centreId), ...change(configOf(centreId)) },
    }));

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState("");

  const selectedIds = rows
    .map((c) => c.id)
    .filter((id) => configOf(id).selected);
  const withdrawing = [...assigned].filter((id) => !selectedIds.includes(id));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) =>
      [c.name, c.code, c.state].some((x) => x?.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const onSave = async () => {
    const crops = Object.fromEntries(
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
      withdrawReason: withdrawing.length ? withdrawReason.trim() : undefined,
      crops,
    });
    toast.success("Centres saved");
  };

  const reasonOk =
    !withdrawing.length ||
    withdrawReason.trim() === "" ||
    withdrawReason.trim().length >= 3;

  return (
    <SaveModal
      title="Assign centres"
      subtitle="Select the centres that run this experiment. Each one uses the experiment's crops unless you set its own for a season."
      canSave={!centres.isPending && reasonOk}
      onSave={onSave}
      onClose={onClose}
      wide
      style={{ maxWidth: 860 }}
    >
      <ErrorNote error={centres.error} />

      <div
        className="row spread"
        style={{ gap: 12, marginBottom: 12, flexWrap: "wrap" }}
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
        <label className="search" style={{ minWidth: 220 }}>
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centres…"
          />
        </label>
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
        {filtered.length === 0 && (
          <div className="muted center" style={{ padding: "32px 0" }}>
            No centres match your search.
          </div>
        )}
        {filtered.map((c) => {
          const cfg = configOf(c.id);
          const open = cfg.selected && expanded === c.id;
          const own = seasonCodes.filter(
            (code) => !sameCrops(cfg.crops[code] ?? [], defaults[code] ?? []),
          );
          const wasWithdrawn =
            trialByCentre.get(c.id)?.assignmentStatus === "Withdrawn";
          return (
            <div
              key={c.id}
              style={{
                border: `1px solid ${cfg.selected ? "var(--green, #1b7f4b)" : "var(--line, #e3e8e4)"}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                className="row spread"
                style={{
                  padding: "10px 14px",
                  cursor: cfg.selected ? "pointer" : "default",
                  background: cfg.selected
                    ? "rgba(27, 127, 75, 0.04)"
                    : "transparent",
                }}
                onClick={() => cfg.selected && setExpanded(open ? null : c.id)}
              >
                <label
                  className="row"
                  style={{ gap: 10, margin: 0, cursor: "pointer" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={cfg.selected}
                    onChange={(e) =>
                      update(c.id, () => ({ selected: e.target.checked }))
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: 600 }}>
                    {c.name} <span className="muted">({c.code})</span>
                    {c.state && (
                      <span className="muted small"> · {c.state}</span>
                    )}
                  </span>
                </label>
                <div className="row" style={{ gap: 6 }}>
                  {wasWithdrawn && !cfg.selected && (
                    <Badge tone="grey">Withdrawn</Badge>
                  )}
                  {wasWithdrawn && cfg.selected && (
                    <Badge tone="blue">Re-assign (keeps its data)</Badge>
                  )}
                  {cfg.selected && seasonCodes.length > 0 && (
                    <>
                      {own.length ? (
                        <Badge tone="amber">
                          Own crops: {own.map(seasons.nameOf).join(", ")}
                        </Badge>
                      ) : (
                        <Badge tone="green">Experiment crops</Badge>
                      )}
                      {open ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </>
                  )}
                  {!cfg.selected && !wasWithdrawn && assigned.has(c.id) && (
                    <Badge tone="amber">Will be withdrawn</Badge>
                  )}
                  {!cfg.selected && !wasWithdrawn && !assigned.has(c.id) && (
                    <span className="muted small">Not assigned</span>
                  )}
                </div>
              </div>

              {open && (
                <div
                  className="stack"
                  style={{
                    gap: 10,
                    padding: "12px 14px 14px 38px",
                    borderTop: "1px solid var(--line, #e3e8e4)",
                  }}
                >
                  <div className="row spread">
                    <span className="small" style={{ fontWeight: 600 }}>
                      Crops at {c.name}
                    </span>
                    <button
                      type="button"
                      className="btn ghost xs"
                      onClick={() =>
                        update(c.id, () => ({ crops: { ...defaults } }))
                      }
                    >
                      <RotateCcw size={12} /> Use the experiment's crops
                    </button>
                  </div>
                  {seasonCodes.map((code) => (
                    <div
                      key={code}
                      className="row"
                      style={{ gap: 12, alignItems: "center" }}
                    >
                      <span style={{ minWidth: 120, fontWeight: 550 }}>
                        {seasons.nameOf(code)}
                        {own.includes(code) && (
                          <span className="muted small"> · own</span>
                        )}
                      </span>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <Select
                          isMulti
                          placeholder={`Crops for ${seasons.nameOf(code)}…`}
                          options={cropOptions}
                          value={(cfg.crops[code] ?? [])
                            .map((id) => cropOption.get(id))
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

      {seasonCodes.length === 0 && (
        <div className="note" style={{ marginTop: 12 }}>
          The experiment has no seasons yet, so there are no crops to set per
          centre. Add seasons and crops in Edit details.
        </div>
      )}

      {withdrawing.length > 0 && (
        <div className="field" style={{ marginTop: 12 }}>
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

      <div className="note" style={{ marginTop: 12 }}>
        Each assigned centre gets its own trial. A withdrawn centre keeps its
        trial and data, read-only; assigning it again brings them back.
      </div>
    </SaveModal>
  );
}
