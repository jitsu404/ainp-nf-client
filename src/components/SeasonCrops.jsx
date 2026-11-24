import { useState } from "react";
import Select from "react-select";
import { Wheat } from "lucide-react";
import { customSelectStyles } from "../pages/experiments/components/ExperimentSeasonsField";
import { toast } from "../lib/toast";
import { seasonCropsPatch } from "../lib/seasonCrops";
import { useCropOptions, useMasterOptions } from "../queries/masters";
import { SaveModal } from "./forms";
import { Body, Card, SmallBody, Table } from "./ui";

// A trial's crops per season (`cropsBySeason` from GET /trials/:id): the crops chosen for this
// centre for each season. The change is recorded in the audit trail.

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
  const rows = trial.cropsBySeason ?? [];
  // Crops this trial already uses stay selectable even if deactivated since.
  const { options, optionOf } = useCropOptions(
    rows.flatMap((r) => r.crops.map((c) => c.id)),
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
      subtitle="Select the crops grown at this centre for each season."
      onSave={onSave}
      onClose={onClose}
      wide
    >
      <div className="stack" style={{ gap: 12 }}>
        {rows.map(({ seasonCode }) => (
          <div key={seasonCode} className="row" style={{ gap: 12 }}>
            <span style={{ minWidth: 120, fontWeight: 550 }}>
              {seasons.nameOf(seasonCode)}
            </span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Select
                isMulti
                options={options}
                value={(wanted[seasonCode] ?? [])
                  .map((id) => optionOf(id))
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
          </div>
        ))}
      </div>
    </SaveModal>
  );
}
