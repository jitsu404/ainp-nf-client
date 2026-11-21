import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveModal } from "../../../components/forms";
import { Card } from "../../../components/ui";
import { inProtocolSeasons } from "../../../lib/seasonCrops";
import { toast } from "../../../lib/toast";
import { useMasterOptions } from "../../../queries/masters";

const dateInput = (d) => (d ? String(d).slice(0, 10) : "");
const blankSeason = (seasonCode = "") => ({
  seasonCode,
  mainCropCode: "",
  mainVariety: "",
  intercropCode: "",
  intercropVariety: "",
  rowRatio: "",
  seedRate: "",
  sowingDate: "",
  harvestDate: "",
});

export function CroppingSystemsModal({ trial, save, onClose }) {
  const seasons = useMasterOptions("season");
  const crops = useMasterOptions("crop");
  const allowedSeasons = seasons.options.filter(([c]) =>
    inProtocolSeasons(trial.experiment.seasons, c),
  );
  const [systems, setSystems] = useState(() =>
    trial.croppingSystems.map((cs) => ({
      code: cs.code,
      name: cs.name,
      seasons: cs.seasons.map((s) => ({
        ...blankSeason(),
        ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? ""])),
        seedRate: s.seedRate ?? "",
        sowingDate: dateInput(s.sowingDate),
        harvestDate: dateInput(s.harvestDate),
      })),
    })),
  );

  const setSystem = (i, k, v) =>
    setSystems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const setSeason = (i, si, k, v) =>
    setSystems((xs) =>
      xs.map((x, j) =>
        j === i
          ? {
              ...x,
              seasons: x.seasons.map((s, sj) =>
                sj === si ? { ...s, [k]: v } : s,
              ),
            }
          : x,
      ),
    );
  const addSystem = () =>
    setSystems((xs) => [
      ...xs,
      {
        code: `CS${xs.length + 1}`,
        name: "",
        seasons: [blankSeason(allowedSeasons[0]?.[0] ?? "")],
      },
    ]);

  const body = () => ({
    croppingSystems: systems.map((cs) => ({
      code: cs.code.trim(),
      name: cs.name.trim(),
      seasons: cs.seasons.map((s) => ({
        seasonCode: s.seasonCode,
        mainCropCode: s.mainCropCode,
        mainVariety: s.mainVariety.trim() || null,
        intercropCode: s.intercropCode || null,
        intercropVariety: s.intercropVariety.trim() || null,
        rowRatio: s.rowRatio.trim() || null,
        seedRate: s.seedRate === "" ? null : Number(s.seedRate),
        sowingDate: s.sowingDate || null,
        harvestDate: s.harvestDate || null,
      })),
    })),
  });

  const valid = systems.every(
    (cs) =>
      cs.code.trim() &&
      cs.name.trim().length >= 2 &&
      cs.seasons.every((s) => s.seasonCode && s.mainCropCode),
  );

  const cropSelect = (value, onChange, label, optional) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{optional ? "None" : "Select…"}</option>
      {crops.options.map(([c, n]) => (
        <option key={c} value={c}>
          {n}
        </option>
      ))}
    </select>
  );

  return (
    <SaveModal
      title="Cropping systems"
      subtitle="The crops and varieties grown in each season at this centre."
      canSave={valid}
      onSave={async () => {
        await save(body());
        toast.success("Cropping systems saved");
      }}
      onClose={onClose}
    >
      {!valid && (
        <div className="note warn">
          Each system needs a code, a name (2+ characters), and a season and
          main crop on every row.
        </div>
      )}
      {systems.map((cs, i) => (
        <Card
          key={i}
          title={
            <span className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
              <input
                aria-label="System code"
                className="select"
                style={{ width: 80 }}
                value={cs.code}
                onChange={(e) => setSystem(i, "code", e.target.value)}
              />
              <input
                aria-label="System name"
                className="select"
                style={{ minWidth: 220 }}
                value={cs.name}
                placeholder="e.g. Rice – Wheat"
                onChange={(e) => setSystem(i, "name", e.target.value)}
              />
            </span>
          }
          actions={
            <button
              className="icon-btn"
              aria-label="Remove system"
              onClick={() => setSystems((xs) => xs.filter((_, j) => j !== i))}
            >
              <Trash2 size={15} />
            </button>
          }
          pad={false}
        >
          <div className="table-wrap">
            <table className="entry">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Main crop</th>
                  <th>Variety</th>
                  <th>Intercrop</th>
                  <th>Variety</th>
                  <th>Row ratio</th>
                  <th>
                    Seed rate<small>kg/ha</small>
                  </th>
                  <th>Sowing</th>
                  <th>Harvest</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cs.seasons.map((s, si) => (
                  <tr key={si}>
                    <td>
                      <select
                        aria-label="Season"
                        value={s.seasonCode}
                        onChange={(e) =>
                          setSeason(i, si, "seasonCode", e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {allowedSeasons.map(([c, n]) => (
                          <option key={c} value={c}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {cropSelect(
                        s.mainCropCode,
                        (v) => setSeason(i, si, "mainCropCode", v),
                        "Main crop",
                      )}
                    </td>
                    <td>
                      <input
                        aria-label="Main variety"
                        value={s.mainVariety}
                        onChange={(e) =>
                          setSeason(i, si, "mainVariety", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      {cropSelect(
                        s.intercropCode,
                        (v) => setSeason(i, si, "intercropCode", v),
                        "Intercrop",
                        true,
                      )}
                    </td>
                    <td>
                      <input
                        aria-label="Intercrop variety"
                        value={s.intercropVariety}
                        onChange={(e) =>
                          setSeason(i, si, "intercropVariety", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Row ratio"
                        value={s.rowRatio}
                        placeholder="2:1"
                        onChange={(e) =>
                          setSeason(i, si, "rowRatio", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Seed rate"
                        type="number"
                        min={0}
                        value={s.seedRate}
                        onChange={(e) =>
                          setSeason(i, si, "seedRate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Sowing date"
                        type="date"
                        value={s.sowingDate}
                        onChange={(e) =>
                          setSeason(i, si, "sowingDate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Harvest date"
                        type="date"
                        value={s.harvestDate}
                        onChange={(e) =>
                          setSeason(i, si, "harvestDate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        aria-label="Remove season"
                        onClick={() =>
                          setSystem(
                            i,
                            "seasons",
                            cs.seasons.filter((_, sj) => sj !== si),
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "8px 12px" }}>
            <button
              className="btn ghost sm"
              onClick={() =>
                setSystem(i, "seasons", [...cs.seasons, blankSeason()])
              }
            >
              <Plus size={14} /> Add season
            </button>
          </div>
        </Card>
      ))}
      <div>
        <button className="btn ghost sm" onClick={addSystem}>
          <Plus size={14} /> Add cropping system
        </button>
      </div>
    </SaveModal>
  );
}
