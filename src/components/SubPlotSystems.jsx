import { seasonMap } from "../lib/seasonCrops";
import { useCroppingSystems } from "../queries/croppingSystems";
import { SmallBody } from "./ui";

/** The seasons a sub plot can have systems for: the protocol's, or every season when it lists none. */
export const subPlotSeasons = (experiment, seasonOptions) => {
  const own = Array.isArray(experiment?.seasons)
    ? experiment.seasons
    : Object.keys(seasonMap(experiment?.seasons));
  return own.length ? own : seasonOptions.map(([c]) => c);
};

/**
 * One cropping system per season for a sub plot (split / split-split plots). `value` is the sub
 * plot's `croppingSystems` list; a season left on "None" has no system (e.g. fallow).
 */
export function SubPlotSystemsPicker({
  value = [],
  onChange,
  seasonCodes = [],
  label,
  hideLabels = false,
}) {
  const systems = useCroppingSystems();
  const chosen = (season) =>
    value.find((x) => x.seasonCode === season)?.croppingSystem ?? "";
  const setSeason = (season, id) =>
    onChange(
      [
        ...value.filter((x) => x.seasonCode !== season),
        ...(id ? [{ seasonCode: season, croppingSystem: id }] : []),
      ].sort(
        (a, b) =>
          seasonCodes.indexOf(a.seasonCode) - seasonCodes.indexOf(b.seasonCode),
      ),
    );

  const cols = seasonCodes.length || 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 8,
        minWidth: 0,
        width: "100%",
        alignItems: "center",
      }}
    >
      {seasonCodes.map((season) => {
        const options = systems.optionsFor(season, chosen(season));
        const select = (
          <select
            aria-label={`${label ?? "Sub plot"} ${systems.seasons.nameOf(season)} cropping system`}
            className="select"
            style={{ height: 36, width: "100%", maxWidth: "none" }}
            value={chosen(season)}
            onChange={(e) => setSeason(season, e.target.value)}
          >
            <option value="">
              {options.length ? "None" : "No systems for this season"}
            </option>
            {options.map(([id, text]) => (
              <option key={id} value={id}>
                {text}
              </option>
            ))}
          </select>
        );

        if (hideLabels) {
          return (
            <div key={season} style={{ minWidth: 0 }}>
              {select}
            </div>
          );
        }

        return (
          <label key={season} style={{ display: "grid", gap: 2, minWidth: 0 }}>
            <SmallBody muted>{systems.seasons.nameOf(season)}</SmallBody>
            {select}
          </label>
        );
      })}
    </div>
  );
}
