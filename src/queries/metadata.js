import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { metadataApi } from "../api";
import { queryKeys } from "../lib/queryKeys";

// ICAR research-data metadata: one record per trial (the centre's part) plus fields common to the
// experiment (PCU). Every centre assigned to an experiment can read the others' records.

export function useTrialMetadata(trialId) {
  return useQuery({
    queryKey: queryKeys.research.trialMetadata(trialId),
    queryFn: async () => (await metadataApi.trial(trialId)).data,
    enabled: Boolean(trialId),
  });
}

export function useExperimentMetadata(experimentId) {
  return useQuery({
    queryKey: queryKeys.research.experimentMetadata(experimentId),
    queryFn: async () => (await metadataApi.experiment(experimentId)).data,
    enabled: Boolean(experimentId),
  });
}

const useMetadataMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.research.metadata,
      }),
  });
};

export const useSaveTrialMetadata = (trialId) =>
  useMetadataMutation(
    async (body) => (await metadataApi.saveTrial(trialId, body)).data,
  );

/** ({ action: 'submit' | 'return' | 'approve', remark }) */
export const useMetadataTransition = (trialId) =>
  useMetadataMutation(
    async ({ action, remark }) =>
      (await metadataApi.transition(trialId, action, remark)).data,
  );

export const useSaveCommonMetadata = (experimentId) =>
  useMetadataMutation(
    async (body) => (await metadataApi.saveCommon(experimentId, body)).data,
  );
