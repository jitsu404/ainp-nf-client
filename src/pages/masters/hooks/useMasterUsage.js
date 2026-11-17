import { useCentres } from "../../../queries/centres";
import { useExperiments, useTrials } from "../../../queries/research";
import { useParameters } from "../../../queries/masters";

/** Counts how many records refer to each key: keysOf(record) → keys (repeats within a record count once). */
const tally = (records, keysOf) => {
  if (!records) return null;
  const counts = new Map();
  for (const record of records) {
    const keys = keysOf(record) ?? [];
    for (const key of new Set(keys)) {
      if (key !== undefined && key !== null && key !== "") {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
};

/**
 * Hook to retrieve usage counts for master items across other entities
 * (experiments, trials, parameters, centres).
 */
export function useMasterUsage(typeId) {
  const wants = (...types) => types.includes(typeId);
  const experiments = useExperiments(
    {},
    { enabled: wants("programme", "season") },
  );
  const trials = useTrials({}, { enabled: wants("crop") });
  const parameters = useParameters({}, { enabled: wants("unit") });
  const centres = useCentres({}, { enabled: wants("zone") });

  switch (typeId) {
    case "programme":
      return {
        label: "Experiments",
        by: "code",
        counts: tally(experiments.data, (e) => [e.programmeCode]),
      };
    case "season":
      return {
        label: "Experiments",
        by: "code",
        counts: tally(experiments.data, (e) => e.seasons),
      };
    case "crop":
      return {
        label: "Trials",
        by: "code",
        counts: tally(trials.data, (t) =>
          t.croppingSystems?.flatMap((cs) =>
            cs.seasons?.flatMap((s) => [s.mainCropCode, s.intercropCode]),
          ),
        ),
      };
    case "unit":
      return {
        label: "Parameters",
        by: "code",
        counts: tally(parameters.data, (p) => [p.unitCode]),
      };
    case "zone":
      // Centres store their zone by name.
      return {
        label: "Centres",
        by: "name",
        counts: tally(centres.data?.data, (c) => [c.zone]),
      };
    default:
      return null;
  }
}
