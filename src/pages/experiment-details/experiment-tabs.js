export const getExperimentTabs = ({ config, isPi, trialCount = 0 }) => {
  const tabs = [
    ["protocol", "Protocol"],
    ["centres", config ? "Centres" : "My centre", trialCount],
    ["reporting", "Reporting"],
    ["summary", "Results summary"],
    ["trend", "Trend"],
  ];
  if (isPi) {
    tabs.push(["metadata", "Metadata"]);
  }
  return tabs;
};
