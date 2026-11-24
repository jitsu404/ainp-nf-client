import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveModal } from "../../../components/forms";
import { Badge, Card, SmallBody } from "../../../components/ui";
import {
  rowRatioOf,
  subPlotsBySystem,
  trialSystems,
} from "../../../lib/croppingSystems";
import { toast } from "../../../lib/toast";
import {
  useCroppingSystems,
  useMasterOptions,
  useMasters,
} from "../../../queries/masters";

// The centre chooses cropping systems from the masters and records how it grows each crop: variety,
// plant and row spacing, its rows in the row ratio and seed rate, plus sowing and harvest dates. The
// master fixes each system's season and crops, so they can't be changed here.

const NUMBERS = ["plantSpacing", "rowSpacing", "rowRatio", "seedRate"];
const dateInput = (d) => (d ? String(d).slice(0, 10) : "");
const text = (v) => (v === null || v === undefined ? "" : String(v));

/** The master's crops, filled with what the trial already recorded. */
const fromMaster = (system, saved) => {
  const crop = (cropCode, role) => {
    const o = saved?.crops?.find((c) => c.cropCode === cropCode) ?? {};
    return {
      cropCode,
      role,
      variety: text(o.variety),
      ...Object.fromEntries(NUMBERS.map((k) => [k, text(o[k])])),
    };
  };
  return {
    croppingSystemId: system.id,
    sowingDate: dateInput(saved?.sowingDate),
    harvestDate: dateInput(saved?.harvestDate),
    crops: [
      crop(system.mainCropCode, "main"),
      ...(system.intercropCodes ?? []).map((c) => crop(c, "intercrop")),
    ],
  };
};

export function CroppingSystemsModal({ trial, save, onClose }) {
  const systems = useCroppingSystems();
  const seasons = useMasterOptions("season");
  const crops = useMasters("crop");
  const cropName = (code) =>
    (crops.data ?? []).find((c) => c.code === code)?.name ?? code;
  const usedBy = subPlotsBySystem(trial);
  const [entries, setEntries] = useState(null);
  const [picked, setPicked] = useState("");

  // Built once the master list is in, so every entry follows its system's current crops.
  if (systems.isPending) return null;
  // The centre's own entries, plus every system the sub plots grow (they always appear here).
  const saved = trialSystems(trial);
  const list =
    entries ??
    [
      ...saved.map((cs) => String(cs.croppingSystemId)),
      ...[...usedBy.keys()].filter(
        (id) => !saved.some((cs) => String(cs.croppingSystemId) === id),
      ),
    ]
      .map((id) => {
        const system = systems.byId(id);
        return system
          ? fromMaster(
              system,
              saved.find((cs) => String(cs.croppingSystemId) === id),
            )
          : null;
      })
      .filter(Boolean);
  const update = (fn) => setEntries(fn(list));
  const chosen = new Set(list.map((e) => e.croppingSystemId));
  const choices = systems.items.filter((s) => s.isActive && !chosen.has(s.id));
  const label = (s) =>
    s ? `${s.code} · ${s.name} (${seasons.nameOf(s.seasonCode)})` : "";

  const add = (id) => {
    const system = systems.byId(id);
    if (!system) return;
    update((xs) => [...xs, fromMaster(system)]);
    setPicked("");
  };
  const setField = (i, k, v) =>
    update((xs) => xs.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const setCrop = (i, ci, k, v) =>
    update((xs) =>
      xs.map((e, j) =>
        j !== i
          ? e
          : {
              ...e,
              crops: e.crops.map((c, cj) => (cj === ci ? { ...c, [k]: v } : c)),
            },
      ),
    );

  const num = (v) => (v === "" ? null : Number(v));
  const body = () => ({
    croppingSystems: list.map((e) => ({
      croppingSystemId: e.croppingSystemId,
      sowingDate: e.sowingDate || null,
      harvestDate: e.harvestDate || null,
      crops: e.crops.map((c) => ({
        cropCode: c.cropCode,
        role: c.role,
        variety: c.variety.trim() || null,
        ...Object.fromEntries(NUMBERS.map((k) => [k, num(c[k])])),
      })),
    })),
  });
  const badDates = list.some(
    (e) => e.sowingDate && e.harvestDate && e.sowingDate > e.harvestDate,
  );

  const numberInput = (i, ci, c, k, aria, props = {}) => (
    <input
      aria-label={aria}
      type="number"
      min={props.min ?? 0}
      step={props.step ?? "any"}
      value={c[k]}
      style={{ width: 80 }}
      onChange={(ev) => setCrop(i, ci, k, ev.target.value)}
    />
  );

  return (
    <SaveModal
      title="Cropping systems"
      subtitle="The systems the sub plots grow are listed; record how each crop is grown here. You can add other systems the centre grows."
      canSave={!badDates}
      onSave={async () => {
        await save(body());
        toast.success("Cropping systems saved");
      }}
      onClose={onClose}
    >
      {badDates && (
        <div className="note warn">Harvest dates must be after sowing.</div>
      )}
      {list.length === 0 && (
        <SmallBody muted>No cropping systems chosen yet.</SmallBody>
      )}
      {list.map((e, i) => {
        const system = systems.byId(e.croppingSystemId);
        const subPlots = usedBy.get(e.croppingSystemId);
        const ratio = rowRatioOf(e.crops);
        return (
          <Card
            key={e.croppingSystemId}
            pad={false}
            title={
              <span>
                <b>{system?.code}</b> · {system?.name} ·{" "}
                {seasons.nameOf(system?.seasonCode)}
                {subPlots && (
                  <SmallBody muted> · sub plot {subPlots.join(", ")}</SmallBody>
                )}
              </span>
            }
            actions={
              // Systems the sub plots grow stay; only the centre's extra ones can be removed.
              !subPlots && (
                <button
                  className="icon-btn"
                  aria-label={`Remove ${system?.name ?? "system"}`}
                  onClick={() => update((xs) => xs.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </button>
              )
            }
          >
            <div className="table-wrap">
              <table className="entry">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Variety</th>
                    <th>
                      Plant spacing<small>cm</small>
                    </th>
                    <th>
                      Row spacing<small>cm</small>
                    </th>
                    <th>
                      Rows<small>row ratio</small>
                    </th>
                    <th>
                      Seed rate<small>kg/ha</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {e.crops.map((c, ci) => (
                    <tr key={c.cropCode}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {cropName(c.cropCode)}{" "}
                        <Badge tone={c.role === "main" ? "green" : "blue"}>
                          {c.role === "main" ? "Main" : "Intercrop"}
                        </Badge>
                      </td>
                      <td>
                        <input
                          aria-label={`${cropName(c.cropCode)} variety`}
                          value={c.variety}
                          style={{ minWidth: 120 }}
                          onChange={(ev) =>
                            setCrop(i, ci, "variety", ev.target.value)
                          }
                        />
                      </td>
                      <td>
                        {numberInput(
                          i,
                          ci,
                          c,
                          "plantSpacing",
                          "Plant to plant spacing",
                        )}
                      </td>
                      <td>
                        {numberInput(
                          i,
                          ci,
                          c,
                          "rowSpacing",
                          "Row to row spacing",
                        )}
                      </td>
                      <td>
                        {numberInput(
                          i,
                          ci,
                          c,
                          "rowRatio",
                          "Rows in the row ratio",
                          {
                            min: 1,
                            step: 1,
                          },
                        )}
                      </td>
                      <td>{numberInput(i, ci, c, "seedRate", "Seed rate")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="row"
              style={{ gap: 16, padding: "8px 12px", flexWrap: "wrap" }}
            >
              <label className="row" style={{ gap: 6 }}>
                <SmallBody>Sowing</SmallBody>
                <input
                  aria-label="Sowing date"
                  type="date"
                  value={e.sowingDate}
                  onChange={(ev) => setField(i, "sowingDate", ev.target.value)}
                />
              </label>
              <label className="row" style={{ gap: 6 }}>
                <SmallBody>Harvest</SmallBody>
                <input
                  aria-label="Harvest date"
                  type="date"
                  value={e.harvestDate}
                  onChange={(ev) => setField(i, "harvestDate", ev.target.value)}
                />
              </label>
              {ratio && <SmallBody muted>Row ratio {ratio}</SmallBody>}
            </div>
          </Card>
        );
      })}
      <div className="row" style={{ gap: 8 }}>
        <select
          aria-label="Cropping system to add"
          value={picked}
          onChange={(ev) => setPicked(ev.target.value)}
          style={{ minWidth: 280 }}
          className="select"
        >
          <option value="">Choose a cropping system…</option>
          {choices.map((s) => (
            <option key={s.id} value={s.id}>
              {label(s)}
            </option>
          ))}
        </select>
        <button
          className="btn ghost sm"
          disabled={!picked}
          onClick={() => add(picked)}
        >
          <Plus size={14} /> Add
        </button>
        {systems.items.length === 0 && (
          <SmallBody muted>
            The PCU adds cropping systems in Masters → Cropping systems.
          </SmallBody>
        )}
      </div>
    </SaveModal>
  );
}
