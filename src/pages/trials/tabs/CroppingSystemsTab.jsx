import { Sprout } from "lucide-react";
import { SeasonCropsCard } from "../../../components/SeasonCrops";
import { Badge, Body, Card, SmallBody, Table } from "../../../components/ui";
import { formatDate } from "../../../hooks";
import {
  rowRatioOf,
  subPlotsBySystem,
  trialSystems,
} from "../../../lib/croppingSystems";
import { useCroppingSystems } from "../../../queries/masters";

const measure = (v, unit) =>
  v === null || v === undefined ? "—" : `${v} ${unit}`;

export function CroppingSystemsTab({
  trial: t,
  edit,
  save,
  onEditSystems,
  seasons,
  crops,
}) {
  const systems = useCroppingSystems();
  const usedBy = subPlotsBySystem(t);
  // The centre's own entries, plus every system the sub plots grow (shown even before it is filled in).
  const saved = trialSystems(t);
  const list = [
    ...saved,
    ...[...usedBy.keys()]
      .filter((id) => !saved.some((cs) => String(cs.croppingSystemId) === id))
      .map((id) => ({ croppingSystemId: id, crops: [] })),
  ];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <SeasonCropsCard trial={t} edit={edit} save={save} />

      <Card
        pad={false}
        title="Cropping systems"
        actions={
          edit && (
            <button className="btn ghost sm" onClick={onEditSystems}>
              <Sprout size={14} /> Edit cropping systems
            </button>
          )
        }
      >
        {!list.length && (
          <div className="empty">
            No cropping systems yet.
            {edit
              ? " Choose the systems grown here and record their varieties, spacings and seed rates."
              : ""}
          </div>
        )}
        {list.map((cs) => {
          const system = systems.byId(cs.croppingSystemId);
          const subPlots = usedBy.get(String(cs.croppingSystemId));
          const rows = (cs.crops ?? []).map((c) => ({ ...c, id: c.cropCode }));
          const ratio = rowRatioOf(cs.crops ?? []);
          return (
            <div key={cs.croppingSystemId} style={{ padding: "6px 0 10px" }}>
              <Body style={{ padding: "4px 16px" }}>
                <b>{system?.code ?? "?"}</b> ·{" "}
                {system?.name ?? "Unknown system"} ·{" "}
                {seasons.nameOf(system?.seasonCode)}
                {subPlots && (
                  <SmallBody muted> · sub plot {subPlots.join(", ")}</SmallBody>
                )}
                <SmallBody muted style={{ display: "block" }}>
                  Sowing {formatDate(cs.sowingDate)} · harvest{" "}
                  {formatDate(cs.harvestDate)}
                  {ratio ? ` · row ratio ${ratio}` : ""}
                </SmallBody>
              </Body>
              <Table
                rows={rows}
                pageSize={20}
                empty="Crops not filled in yet."
                columns={[
                  {
                    label: "Crop",
                    render: (r) => (
                      <span>
                        {crops.nameOf(r.cropCode)}{" "}
                        <Badge tone={r.role === "main" ? "green" : "blue"}>
                          {r.role === "main" ? "Main" : "Intercrop"}
                        </Badge>
                      </span>
                    ),
                  },
                  { label: "Variety", render: (r) => r.variety || "—" },
                  {
                    label: "Plant × row spacing",
                    render: (r) =>
                      r.plantSpacing == null && r.rowSpacing == null
                        ? "—"
                        : `${r.plantSpacing ?? "?"} × ${r.rowSpacing ?? "?"} cm`,
                  },
                  {
                    label: "Rows",
                    num: true,
                    render: (r) => r.rowRatio ?? "—",
                  },
                  {
                    label: "Seed rate",
                    num: true,
                    render: (r) => measure(r.seedRate, "kg/ha"),
                  },
                ]}
              />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
