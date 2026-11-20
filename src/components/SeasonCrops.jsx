import { useMemo, useState } from "react";
import Select from "react-select";
import { RotateCcw, Wheat } from "lucide-react";
import { customSelectStyles } from "../pages/experiments/components/ExperimentSeasonsField";
import { toast } from "../lib/toast";
import { sameCrops, seasonCropsPatch } from "../lib/seasonCrops";
import { useMasterOptions, useMasters } from "../queries/masters";
import { SaveModal } from "./forms";
import { Badge, Card, Table } from "./ui";

// A trial's crops per season (`cropsBySeason` from GET /trials/:id): the experiment's crops unless
// the centre chose its own, e.g. when the protocol crop isn't available locally. The change is
// recorded in the audit trail; there is no approval step.

export function SeasonCropsCard({ trial, edit, save }) {
  const seasons = useMasterOptions("season");
  const [editing, setEditing] = useState(false);
  const rows = trial.cropsBySeason ?? [];
  const names = (list) => list.map((c) => c.name ?? c.code ?? "?").join(", ");

  return (
    <Card
      pad={false}
      title="Crops per season"
      actions={
        edit &&
        rows.length > 0 && (
          <button className="btn ghost sm" onClick={() => setEditing(true)}>
            <Wheat size={14} /> Change crops
          </button>
        )
      }
    >
      <Table
        rows={rows.map((r) => ({ ...r, id: r.seasonCode }))}
        empty="The experiment has no seasons yet."
        columns={[
          {
            label: "Season",
            render: (r) => <b>{seasons.nameOf(r.seasonCode)}</b>,
          },
          {
            label: "Crops at this centre",
            render: (r) =>
              r.crops.length ? (
                names(r.crops)
              ) : (
                <span className="muted">—</span>
              ),
          },
          {
            label: "",
            render: (r) =>
              r.changed ? (
                <span className="small">
                  <Badge tone="amber">Own crops</Badge>{" "}
                  <span className="muted">
                    Experiment: {names(r.defaultCrops) || "—"}
                  </span>
                </span>
              ) : (
                <Badge tone="green">Experiment crops</Badge>
              ),
          },
        ]}
      />
      {editing && (
        <SeasonCropsModal
          trial={trial}
          save={save}
          onClose={() => setEditing(false)}
        />
      )}
    </Card>
  );
}

function SeasonCropsModal({ trial, save, onClose }) {
  const seasons = useMasterOptions("season");
  const crops = useMasters("crop", { isActive: true });
  const rows = trial.cropsBySeason ?? [];
  const options = useMemo(
    () =>
      (crops.data ?? []).map((c) => ({
        value: String(c.id ?? c._id),
        label: `${c.name}${c.code ? ` (${c.code})` : ""}`,
      })),
    [crops.data],
  );
  const option = useMemo(
    () => new Map(options.map((o) => [o.value, o])),
    [options],
  );
  const defaults = Object.fromEntries(
    rows.map((r) => [r.seasonCode, r.defaultCrops.map((c) => c.id)]),
  );
  const [wanted, setWanted] = useState(() =>
    Object.fromEntries(
      rows.map((r) => [r.seasonCode, r.crops.map((c) => c.id)]),
    ),
  );

  const onSave = async () => {
    const patch = seasonCropsPatch(
      trial.experiment.seasons,
      trial.seasonCrops,
      wanted,
    );
    if (patch) await save({ seasonCrops: patch });
    toast.success(patch ? "Crops saved" : "No changes");
  };

  return (
    <SaveModal
      title="Crops per season"
      subtitle="Each season uses the experiment's crops unless you choose others for this centre, for example when a crop isn't available locally. The change is recorded in the audit trail."
      onSave={onSave}
      onClose={onClose}
      wide
    >
      <div className="stack" style={{ gap: 12 }}>
        {rows.map(({ seasonCode }) => {
          const own = !sameCrops(wanted[seasonCode], defaults[seasonCode]);
          return (
            <div key={seasonCode} className="row" style={{ gap: 12 }}>
              <span style={{ minWidth: 120, fontWeight: 550 }}>
                {seasons.nameOf(seasonCode)}
                {own && <span className="muted small"> · own</span>}
              </span>
              <div style={{ flex: 1, minWidth: 220 }}>
                <Select
                  isMulti
                  options={options}
                  value={wanted[seasonCode]
                    .map((id) => option.get(id))
                    .filter(Boolean)}
                  onChange={(opts) =>
                    setWanted((w) => ({
                      ...w,
                      [seasonCode]: (opts ?? []).map((o) => o.value),
                    }))
                  }
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  closeMenuOnSelect={false}
                />
              </div>
              <button
                type="button"
                className="btn ghost xs"
                disabled={!own}
                title="Use the experiment's crops for this season"
                onClick={() =>
                  setWanted((w) => ({
                    ...w,
                    [seasonCode]: defaults[seasonCode],
                  }))
                }
              >
                <RotateCcw size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </SaveModal>
  );
}
