import { Pencil } from "lucide-react";
import { Card, Table } from "../../../components/ui";
import { PRACTICE_FIELDS } from "../components";

export function TreatmentPracticesTab({ trial: t, edit, onEditPractices }) {
  const e = t.experiment;
  const practiceOf = (code) =>
    t.practices.find((p) => p.treatmentCode === code) ?? {};

  return (
    <Card
      pad={false}
      title="What each treatment means at this centre"
      actions={
        edit && (
          <button className="btn ghost sm" onClick={onEditPractices}>
            <Pencil size={14} /> Edit practices
          </button>
        )
      }
    >
      <Table
        rows={e.treatments.map((tr) => ({ ...tr, id: tr.code }))}
        pageSize={30}
        empty="The experiment has no treatments yet."
        columns={[
          {
            label: "Treatment",
            render: (tr) => (
              <>
                <b>{tr.code}</b> {tr.name}
              </>
            ),
          },
          ...PRACTICE_FIELDS.map(([key, label]) => ({
            label,
            render: (tr) => (
              <span className="small" style={{ whiteSpace: "pre-wrap" }}>
                {practiceOf(tr.code)[key] || "—"}
              </span>
            ),
          })),
        ]}
      />
    </Card>
  );
}
