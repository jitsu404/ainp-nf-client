import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { experimentPisApi } from "../api";
import { queryKeys } from "../lib/queryKeys";

// Experiment PI seats: permanent logins (pi1.npnf@icar.org.in …) created by the PCU, each held by
// one person at a time. An experiment shows its PI, so every change also refreshes 'research'.

export function useExperimentPis({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.experimentPis.list(),
    queryFn: async () => (await experimentPisApi.list()).data,
    enabled,
  });
}

const useSeatMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experimentPis.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.research.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useCreateExperimentPi = () =>
  useSeatMutation(async (body) => (await experimentPisApi.create(body)).data);

export const useUpdateExperimentPi = () =>
  useSeatMutation(
    async ({ id, ...body }) => (await experimentPisApi.update(id, body)).data,
  );

/** ({ id, ...person, password, reason }): a new person takes the seat. */
export const useReplaceExperimentPi = () =>
  useSeatMutation(
    async ({ id, ...body }) => (await experimentPisApi.replace(id, body)).data,
  );
