import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../api";
import { REFERENCE_STALE_TIME_MS } from "../config/constants";
import { queryKeys } from "../lib/queryKeys";

// The public site's data: open to everyone, no sign-in.

/** { centres, experiments: [{ code, title, programmeCode, design, startYear, endYear, centres }] } */
export function usePublicSummary() {
  return useQuery({
    queryKey: queryKeys.public.summary(),
    queryFn: async () => (await publicApi.summary()).data,
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}
