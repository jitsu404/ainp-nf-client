import { Sprout } from "lucide-react";
import { SeasonCropsCard } from "../../../components/SeasonCrops";
import { Body, Card, Table } from "../../../components/ui";
import { formatDate } from "../../../hooks";

export function CroppingSystemsTab({
  trial: t,
  edit,
  save,
  onEditSystems,
  seasons,
  crops,
}) {
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
        {!t.croppingSystems.length && (
          <div className="empty">
            No cropping systems yet.
            {edit ? " Add the crops and varieties grown in each season." : ""}
          </div>
        )}
        {t.croppingSystems.map((cs) => (
          <div key={cs.code} style={{ padding: "6px 0 10px" }}>
            <Body style={{ padding: "4px 16px" }}>
              <b>{cs.code}</b> · {cs.name}
            </Body>
            <Table
              rows={cs.seasons.map((s) => ({ ...s, id: s.seasonCode }))}
              pageSize={10}
              empty="No seasons."
              columns={[
                {
                  label: "Season",
                  render: (s) => seasons.nameOf(s.seasonCode),
                },
                {
                  label: "Main crop",
                  render: (s) =>
                    `${crops.nameOf(s.mainCropCode)}${s.mainVariety ? ` (${s.mainVariety})` : ""}`,
                },
                {
                  label: "Intercrop",
                  render: (s) =>
                    s.intercropCode
                      ? `${crops.nameOf(s.intercropCode)}${s.intercropVariety ? ` (${s.intercropVariety})` : ""}${s.rowRatio ? ` · ${s.rowRatio}` : ""}`
                      : "—",
                },
                {
                  label: "Seed rate (kg/ha)",
                  num: true,
                  render: (s) => s.seedRate ?? "—",
                },
                {
                  label: "Sowing",
                  render: (s) => formatDate(s.sowingDate),
                },
                {
                  label: "Harvest",
                  render: (s) => formatDate(s.harvestDate),
                },
              ]}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
