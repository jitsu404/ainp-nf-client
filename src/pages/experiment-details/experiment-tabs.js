export const getExperimentTabs = ({ config, trialCount = 0 }) => [
  ["protocol", "Protocol"],
  ["centres", config ? "Centres" : "My centre", trialCount],
  ["reporting", "Reporting"],
  ["summary", "Results summary"],
  ["trend", "Trend"],
  ["metadata", "Metadata"],
];
