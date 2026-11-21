import { AsyncFormModal } from "../../../components/forms";
import { TRIAL_STATUSES } from "../../../config/constants";
import { toast } from "../../../lib/toast";

export function TrialStatusNotesModal({ trial: t, save, onClose }) {
  return (
    <AsyncFormModal
      title="Trial status & notes"
      fields={[
        {
          name: "status",
          label: "Status",
          type: "select",
          options: TRIAL_STATUSES,
        },
        {
          name: "layoutNotes",
          label: "Layout notes",
          type: "textarea",
          required: false,
          clearable: true,
          hint: "Plot size, layout, field location …",
        },
      ]}
      initial={{ status: t.status, layoutNotes: t.layoutNotes ?? "" }}
      onSubmit={save}
      onDone={() => toast.success("Saved")}
      onClose={onClose}
    />
  );
}
