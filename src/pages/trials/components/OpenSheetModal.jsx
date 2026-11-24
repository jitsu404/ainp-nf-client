import { AsyncFormModal } from "../../../components/forms";
import { SmallBody } from "../../../components/ui";
import {
  defaultExperimentYear,
  experimentYears,
} from "../../../config/constants";
import { inProtocolSeasons } from "../../../lib/seasonCrops";
import { toast } from "../../../lib/toast";
import { useMasterOptions } from "../../../queries/masters";
import { useCreateSheet } from "../../../queries/research";

export function OpenSheetModal({ trial, onClose, onOpened }) {
  const seasons = useMasterOptions("season");
  const crops = useMasterOptions("crop");
  const create = useCreateSheet();

  // Every year of the experiment, start to end; the server refuses other years.
  const yearOptions = experimentYears(trial.experiment);
  const allowedSeasons = seasons.options.filter(([c]) =>
    inProtocolSeasons(trial.experiment.seasons, c),
  );
  const current = defaultExperimentYear(trial.experiment);

  // The form copies `initial` once, so wait for the lists that fill it.
  if (seasons.isPending) return null;

  return (
    <AsyncFormModal
      title="Open observation sheet"
      submitLabel="Open sheet"
      intro={
        <SmallBody muted style={{ margin: 0, display: "block" }}>
          One sheet per year and season (and crop, if you record crops
          separately). The year is the one the season starts in: Rabi 2026 runs
          into 2027 but is recorded as 2026.
        </SmallBody>
      }
      fields={[
        {
          name: "year",
          label: "Year",
          type: "select",
          options: yearOptions.map((y) => [String(y), String(y)]),
          parse: Number,
          hint: `The years of this experiment (${trial.experiment.startYear}–${trial.experiment.endYear}).`,
        },
        {
          name: "seasonCode",
          label: "Season",
          type: "select",
          options: allowedSeasons,
        },
        {
          name: "cropCode",
          label: "Crop",
          type: "select",
          required: false,
          options: crops.options,
        },
      ]}
      initial={{
        year: current === "" ? "" : String(current),
        seasonCode: allowedSeasons.length === 1 ? allowedSeasons[0][0] : "",
      }}
      onSubmit={(body) => create.mutateAsync({ trialId: trial.id, ...body })}
      onDone={(s) => {
        toast.success("Sheet opened");
        onOpened(s);
      }}
      onClose={onClose}
    />
  );
}
