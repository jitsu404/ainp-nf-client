import { BarStatChart } from "./BarStatChart";

// Experiments running now (X axis) × how many centres run each (Y axis), from GET /public/summary.
// Fills its parent's height (give the parent one).

export function ExperimentCentresChart({ experiments }) {
  if (!experiments.length)
    return (
      <div className="muted center" style={{ padding: "40px 0" }}>
        No experiments are running yet.
      </div>
    );
  const data = experiments.map((e) => ({
    label: e.code,
    title: e.title,
    value: e.centres,
  }));
  return (
    <BarStatChart
      data={data}
      orientation="columns"
      valueLabel="Centres"
      xLabel="Experiment"
      yLabel="Number of centres"
      height="100%"
      ariaLabel={`Centres running each experiment: ${data
        .map((d) => `${d.label} ${d.value}`)
        .join(", ")}`}
    />
  );
}
