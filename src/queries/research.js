import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { experimentsApi, sheetsApi, trialsApi } from "../api";
import { queryKeys } from "../lib/queryKeys";

// Research data hooks: PCU experiments (protocols) → centre trials → observation sheets.
// Centre users only ever receive their own centre's trials and sheets (the API scopes them).

export function useExperiments(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.research.experiments(filters),
    queryFn: async () => (await experimentsApi.list(filters)).data,
    enabled,
  });
}

export function useExperiment(id) {
  return useQuery({
    queryKey: queryKeys.research.experiment(id),
    queryFn: async () => (await experimentsApi.get(id)).data,
    enabled: Boolean(id),
  });
}

export function useTrials(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.research.trials(filters),
    queryFn: async () => (await trialsApi.list(filters)).data,
    enabled,
  });
}

export function useTrial(id) {
  return useQuery({
    queryKey: queryKeys.research.trial(id),
    queryFn: async () => (await trialsApi.get(id)).data,
    enabled: Boolean(id),
  });
}

export function useSheets(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.research.sheets(filters),
    queryFn: async () => (await sheetsApi.list(filters)).data,
    enabled,
  });
}

export function useSheet(id) {
  return useQuery({
    queryKey: queryKeys.research.sheet(id),
    queryFn: async () => (await sheetsApi.get(id)).data,
    enabled: Boolean(id),
  });
}

export function useSheetAnalysis(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.research.analysis(id),
    queryFn: async () => (await sheetsApi.analysis(id)).data,
    enabled: Boolean(id) && enabled,
  });
}

/** Cross-centre treatment means. `params` = { experimentId, year, seasonCode?, includeUnapproved? } */
export function useExperimentSummary(params) {
  return useQuery({
    queryKey: queryKeys.research.summary(params),
    queryFn: async () => (await sheetsApi.summary(params)).data,
    enabled: Boolean(params.experimentId && params.year),
  });
}

/** Treatment means per year since the start. `params` = { experimentId, seasonCode?, centreId? } */
export function useTrend(params) {
  return useQuery({
    queryKey: queryKeys.research.trend(params),
    queryFn: async () => (await sheetsApi.trend(params)).data,
    enabled: Boolean(params.experimentId),
  });
}

/** Centre × year × season grid of sheet statuses for one experiment. */
export function useReporting(experimentId) {
  return useQuery({
    queryKey: queryKeys.research.reporting(experimentId),
    queryFn: async () => (await sheetsApi.reporting(experimentId)).data,
    enabled: Boolean(experimentId),
  });
}

// Every research change refreshes the whole research tree (see queryKeys.research).
const useResearchMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.research.all }),
  });
};

export const useCreateExperiment = () =>
  useResearchMutation(async (body) => (await experimentsApi.create(body)).data);
export const useUpdateExperiment = (id) =>
  useResearchMutation(
    async (body) => (await experimentsApi.update(id, body)).data,
  );
/**
 * Assigns the experiment's centres (PCU, research.assign) and records each centre's own crops.
 * The experiment PATCH creates, reactivates or withdraws the trials; then each trial whose crops
 * change gets its `seasonCrops`. `crops`: { [centreId]: seasonCrops patch }.
 */
export const useAssignCentres = (experimentId) =>
  useResearchMutation(async ({ centreIds, withdrawReason, crops = {} }) => {
    const experiment = (
      await experimentsApi.update(experimentId, {
        centreIds,
        ...(withdrawReason ? { withdrawReason } : {}),
      })
    ).data;
    const changed = Object.entries(crops).filter(([, patch]) => patch);
    if (changed.length) {
      const trials = (await trialsApi.list({ experimentId })).data;
      const byCentre = new Map(trials.map((t) => [t.centreId?.id, t.id]));
      for (const [centreId, seasonCrops] of changed) {
        const trialId = byCentre.get(centreId);
        if (trialId) await trialsApi.update(trialId, { seasonCrops });
      }
    }
    return experiment;
  });

export const useUpdateTrial = (id) =>
  useResearchMutation(async (body) => (await trialsApi.update(id, body)).data);
export const useToggleTrialLock = (id) =>
  useResearchMutation(
    async ({ lockedKey, isLocked }) =>
      (await trialsApi.toggleLock(id, { lockedKey, isLocked })).data,
  );
export const useCreateSheet = () =>
  useResearchMutation(async (body) => (await sheetsApi.create(body)).data);

/** Saves changed cells: [{ treatmentCode, replication, parameterId, value }]; null clears a cell. */
export const useSaveSheetValues = (id) =>
  useResearchMutation(
    async (values) => (await sheetsApi.saveValues(id, values)).data,
  );

/** ({ action: 'submit' | 'return' | 'approve', remark }) */
export const useSheetTransition = (id) =>
  useResearchMutation(async ({ action, remark }) => {
    const call = {
      submit: sheetsApi.submit,
      return: sheetsApi.returnSheet,
      approve: sheetsApi.approve,
    }[action];
    return (await call(id, remark)).data;
  });

/** Excel import: ({ file, dryRun }) → { dryRun, total, filled, cleared, errors }. */
export const useImportSheet = (id) =>
  useResearchMutation(
    async ({ file, dryRun }) =>
      (await sheetsApi.importFile(id, file, dryRun)).data,
  );
