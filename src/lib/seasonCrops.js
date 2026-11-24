// Crops per season. The experiment's `seasons` (season code → crop master ids) are the default for
// every centre; a trial's `seasonCrops` holds only the seasons where that centre grows something
// else. These helpers read both shapes the API returns (plain objects, ids or populated items).

const idOf = (item) =>
  item && typeof item === "object" ? String(item.id ?? item._id) : String(item);

/** { KHARIF: ["id", …] } from a map-like value (or a plain list of season codes). */
export const seasonMap = (raw) => {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    return Object.fromEntries(
      raw.map((c) => [typeof c === "string" ? c : c?.code, []]),
    );
  }
  const entries = raw instanceof Map ? [...raw.entries()] : Object.entries(raw);
  return Object.fromEntries(
    entries.map(([code, ids]) => [code, (ids ?? []).map(idOf)]),
  );
};

/** Whether a season is one of the experiment's (an experiment without seasons allows any). */
export const inProtocolSeasons = (experimentSeasons, code) => {
  if (!experimentSeasons) return true;
  if (Array.isArray(experimentSeasons)) {
    return !experimentSeasons.length || experimentSeasons.includes(code);
  }
  const codes = Object.keys(seasonMap(experimentSeasons));
  return !codes.length || codes.includes(code);
};

export const sameCrops = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * What a centre grows in each of the experiment's seasons:
 * [{ seasonCode, crops, defaultCrops, changed }] (crop ids).
 */
export const effectiveSeasonCrops = (experimentSeasons, trialSeasonCrops) => {
  const seasonCodes = Array.isArray(experimentSeasons)
    ? experimentSeasons
    : Object.keys(seasonMap(experimentSeasons));
  const own = seasonMap(trialSeasonCrops);
  return seasonCodes.map((seasonCode) => {
    const crops = own[seasonCode] ?? [];
    return {
      seasonCode,
      crops,
      defaultCrops: [],
      changed: crops.length > 0,
    };
  });
};

/**
 * The `seasonCrops` PATCH that turns `current` into `wanted`.
 */
export const seasonCropsPatch = (_experimentSeasons, current, wanted) => {
  const own = seasonMap(current);
  const patch = {};
  for (const [code, crops] of Object.entries(wanted)) {
    const before = own[code] ?? [];
    if (!sameCrops(crops, before)) {
      patch[code] = crops;
    }
  }
  return Object.keys(patch).length ? patch : null;
};
