// Crops per season. The experiment's `seasons` (season code → crop master ids) are the default for
// every centre; a trial's `seasonCrops` holds only the seasons where that centre grows something
// else. These helpers read both shapes the API returns (plain objects, ids or populated items).

const idOf = (item) =>
  item && typeof item === "object" ? String(item.id ?? item._id) : String(item);

/** { KHARIF: ["id", …] } from a map-like value (or a plain list of season codes). */
export const seasonMap = (raw) => {
  if (!raw) return {};
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((c) => [c, []]));
  const entries = raw instanceof Map ? [...raw.entries()] : Object.entries(raw);
  return Object.fromEntries(
    entries.map(([code, ids]) => [code, (ids ?? []).map(idOf)]),
  );
};

export const sameCrops = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * What a centre grows in each of the experiment's seasons:
 * [{ seasonCode, crops, defaultCrops, changed }] (crop ids).
 */
export const effectiveSeasonCrops = (experimentSeasons, trialSeasonCrops) => {
  const defaults = seasonMap(experimentSeasons);
  const own = seasonMap(trialSeasonCrops);
  return Object.keys(defaults).map((seasonCode) => {
    const changed = seasonCode in own;
    return {
      seasonCode,
      crops: changed ? own[seasonCode] : defaults[seasonCode],
      defaultCrops: defaults[seasonCode],
      changed,
    };
  });
};

/**
 * The `seasonCrops` PATCH that turns `current` (the trial's stored choices) into `wanted`
 * (season → crop ids the centre should grow): a season equal to the experiment's default is sent
 * as null (back to the default). Returns null when nothing changes.
 */
export const seasonCropsPatch = (experimentSeasons, current, wanted) => {
  const defaults = seasonMap(experimentSeasons);
  const own = seasonMap(current);
  const patch = {};
  for (const [code, crops] of Object.entries(wanted)) {
    const next = sameCrops(crops, defaults[code] ?? []) ? null : crops;
    const before = code in own ? own[code] : null;
    if (next === null ? before !== null : !sameCrops(next, before ?? [])) {
      patch[code] = next;
    }
  }
  return Object.keys(patch).length ? patch : null;
};
