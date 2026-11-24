import { useCentres } from "../../../queries/centres";
import { useExperiments, useTrials } from "../../../queries/research";
import { useMasters, useParameters } from "../../../queries/masters";

/** Counts how many records refer to each key: keysOf(record) → keys (repeats within a record count once). */
const tally = (records, keysOf) => {
  if (!records || !Array.isArray(records)) return null;
  const counts = new Map();
  for (const record of records) {
    const rawKeys = keysOf(record);
    let keys = [];
    if (Array.isArray(rawKeys)) {
      keys = rawKeys;
    } else if (rawKeys instanceof Set) {
      keys = [...rawKeys];
    } else if (rawKeys instanceof Map) {
      keys = [...rawKeys.keys()];
    } else if (typeof rawKeys === "object" && rawKeys !== null) {
      keys = Object.keys(rawKeys);
    }
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
    { enabled: wants("programme", "season", "crop") },
  );
  // Experiments and a centre's own crops store crop ids; trials' cropping systems store codes.
  const crops = useMasters(wants("crop") ? "crop" : null);
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
        counts: tally(experiments.data, (e) => {
          if (!e?.seasons) return [];
          if (Array.isArray(e.seasons)) return e.seasons;
          if (e.seasons instanceof Map) return [...e.seasons.keys()];
          if (typeof e.seasons === "object") return Object.keys(e.seasons);
          return [];
        }),
      };
    case "crop": {
      // A crop is in use when an experiment's seasons list it (its default for every centre), a
      // centre chose it as its own crop, or a trial's cropping system grows it. Counted per
      // experiment and per trial, by code.
      if (!crops.data)
        return { label: "Experiments & trials", by: "code", counts: null };
      const codeOf = new Map(
        crops.data.map((c) => [String(c.id ?? c._id), c.code]),
      );
      const codes = (seasons) =>
        Object.values(seasons ?? {})
          .flat()
          .map((id) => codeOf.get(String(id?.id ?? id?._id ?? id)));
      const fromExperiments = tally(experiments.data, (e) =>
        Array.isArray(e.seasons) ? [] : codes(e.seasons),
      );
      const fromTrials = tally(trials.data, (t) => [
        ...codes(t.seasonCrops),
        ...(t.croppingSystems ?? []).flatMap((cs) =>
          (cs.crops ?? []).map((c) => c.cropCode),
        ),
      ]);
      if (!fromExperiments || !fromTrials) {
        return { label: "Experiments & trials", by: "code", counts: null };
      }
      const counts = new Map(fromExperiments);
      for (const [code, n] of fromTrials)
        counts.set(code, (counts.get(code) ?? 0) + n);
      return { label: "Experiments & trials", by: "code", counts };
    }
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
