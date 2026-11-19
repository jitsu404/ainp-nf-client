import { useMemo } from "react";
import { ExperimentTrend } from "../../../components/ExperimentTrend";

export function TrendTab({ experiment, trialRows = [] }) {
  const centres = useMemo(
    () => trialRows.map((t) => t.centreId).filter(Boolean),
    [trialRows],
  );

  return <ExperimentTrend experiment={experiment} centres={centres} />;
}
