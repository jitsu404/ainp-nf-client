// Cropping systems from the masters (GET /cropping-systems): one season, its main crop and any
// intercrops grown with it. A rotation over several seasons is several systems. Shared formatting
// for the masters tab, experiments, trials and sheets.

export const MAX_INTERCROPS = 5;

/** "Rice + Soybean": the main crop, then its intercrops (the name the server makes by default). */
export const systemNameOf = (system, cropName) =>
  system?.mainCropCode
    ? [system.mainCropCode, ...(system.intercropCodes ?? [])]
        .map((c) => cropName(c))
        .join(" + ")
    : "";

/** "2:1" from the crops' own row counts (main first), or "" while any is missing. */
export const rowRatioOf = (crops) =>
  crops.length > 1 && crops.every((c) => c.rowRatio)
    ? crops.map((c) => c.rowRatio).join(":")
    : "";

/** A trial's cropping systems that point at the master (older free-text entries are left out). */
export const trialSystems = (trial) =>
  (trial?.croppingSystems ?? []).filter((cs) => cs.croppingSystemId);

/** System id → the sub plots (trial's own copy first, else the experiment's) that grow it in some season. */
export const subPlotsBySystem = (trial) => {
  const levels = trial?.subPlotData?.length
    ? trial.subPlotData
    : (trial?.experiment?.subPlotData ?? []);
  const map = new Map();
  for (const l of levels) {
    for (const x of l.croppingSystems ?? []) {
      const id = String(x.croppingSystem);
      map.set(id, [...(map.get(id) ?? []), l.code]);
    }
  }
  return map;
};
