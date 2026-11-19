import { ExperimentResults } from "../../../components/ExperimentResults";

export function ResultsSummaryTab({ experiment, canSeeUnapproved }) {
  return (
    <ExperimentResults
      experiment={experiment}
      canSeeUnapproved={canSeeUnapproved}
    />
  );
}
