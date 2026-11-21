/**
 * Tab configuration for Trial Detail page.
 */
export const getTrialTabs = ({ sheetCount = 0, systemCount = 0 } = {}) => [
  ["protocol", "Protocol"],
  ["sheets", "Observation sheets", sheetCount],
  ["systems", "Crops & cropping systems", systemCount],
  ["practices", "Treatment practices"],
  ["metadata", "Metadata"],
];
