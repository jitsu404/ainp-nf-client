import { useState } from "react";
import { SaveModal } from "../../../components/forms";
import { Card } from "../../../components/ui";
import { toast } from "../../../lib/toast";

export const PRACTICE_FIELDS = [
  ["seedDetails", "Seed & sowing"],
  ["nutrientDetails", "Nutrient management"],
  ["protectionDetails", "Plant protection"],
  ["otherDetails", "Other practices"],
];

export function PracticesModal({ trial, save, onClose }) {
  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      trial.experiment.treatments.map((tr) => {
        const p =
          trial.practices.find((x) => x.treatmentCode === tr.code) ?? {};
        return [
          tr.code,
          Object.fromEntries(PRACTICE_FIELDS.map(([k]) => [k, p[k] ?? ""])),
        ];
      }),
    ),
  );

  const set = (code, k, v) =>
    setRows((r) => ({ ...r, [code]: { ...r[code], [k]: v } }));

  const body = () => ({
    practices: Object.entries(rows).map(([treatmentCode, p]) => ({
      treatmentCode,
      ...Object.fromEntries(
        Object.entries(p).map(([k, v]) => [k, v.trim() || null]),
      ),
    })),
  });

  return (
    <SaveModal
      title="Treatment practices"
      subtitle="Describe what each treatment involves at this centre."
      onSave={async () => {
        await save(body());
        toast.success("Practices saved");
      }}
      onClose={onClose}
    >
      {trial.experiment.treatments.map((tr) => (
        <Card
          key={tr.code}
          title={
            <>
              <b>{tr.code}</b> {tr.name}
            </>
          }
        >
          <div className="form">
            {PRACTICE_FIELDS.map(([k, label]) => (
              <div key={k} className="field">
                <label htmlFor={`p-${tr.code}-${k}`}>{label}</label>
                <textarea
                  id={`p-${tr.code}-${k}`}
                  rows={2}
                  value={rows[tr.code][k]}
                  onChange={(e) => set(tr.code, k, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </SaveModal>
  );
}
