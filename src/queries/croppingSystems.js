import {
  useCroppingSystems as useCroppingSystemsMaster,
  useMasterOptions,
} from "./masters";

// The cropping systems master (GET /cropping-systems) in the shape the protocol editors use. A sub
// plot of a split / split-split plot names one system per season (`croppingSystems:
// [{ seasonCode, croppingSystem }]`), since a treatment's land is cropped season after season.
//  - `options` [id, "Rice + Soybean · Kharif (CSY-001)"]: every system (inactive ones marked, so an
//    existing choice still shows; the server refuses choosing one anew).
//  - `optionsFor(season, currentId)`: the active systems of one season, plus the current choice.
//  - `nameOf(id or code)`: a system's name.
//  - `subPlotName(subPlot)`: "Rice + Soybean → Wheat + Chickpea", its systems in season order.
export function useCroppingSystems() {
  const query = useCroppingSystemsMaster();
  const seasons = useMasterOptions("season");
  const list = query.items;
  const nameOf = (idOrCode) => {
    if (!idOrCode) return "";
    const key = String(idOrCode);
    return list.find((c) => c.id === key || c.code === key)?.name || "";
  };
  const label = (c) =>
    `${c.name} · ${seasons.nameOf(c.seasonCode)} (${c.code})${c.isActive ? "" : " · inactive"}`;
  const seasonOrder = (code) => {
    const i = seasons.options.findIndex(([c]) => c === code);
    return i === -1 ? 99 : i;
  };
  const subPlotName = (subPlot) =>
    [...(subPlot?.croppingSystems ?? [])]
      .sort((a, b) => seasonOrder(a.seasonCode) - seasonOrder(b.seasonCode))
      .map((x) => nameOf(x.croppingSystem))
      .filter(Boolean)
      .join(" → ");

  return {
    ...query,
    systems: list,
    options: list.map((c) => [c.id, label(c)]),
    optionsFor: (seasonCode, currentId) =>
      list
        .filter(
          (c) =>
            c.seasonCode === seasonCode &&
            (c.isActive || c.id === String(currentId ?? "")),
        )
        .map((c) => [
          c.id,
          `${c.name} (${c.code})${c.isActive ? "" : " · inactive"}`,
        ]),
    nameOf,
    subPlotName,
    seasons,
  };
}
