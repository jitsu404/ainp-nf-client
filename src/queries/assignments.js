import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { experimentAssignmentsApi } from "../api";
import { queryKeys } from "../lib/queryKeys";

export function useExperimentAssignments(
  filters = {},
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: queryKeys.assignments.list(filters),
    queryFn: async () => (await experimentAssignmentsApi.list(filters)).data,
    enabled,
  });
}

export function useExperimentAssignment(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.assignments.detail(id),
    queryFn: async () => (await experimentAssignmentsApi.get(id)).data,
    enabled: Boolean(id) && enabled,
  });
}

export function useBulkAssignExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await experimentAssignmentsApi.bulkAssign(body)).data,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.research.all });
    },
  });
}

export function useCreateExperimentAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await experimentAssignmentsApi.create(body)).data,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.research.all });
    },
  });
}

export function useUpdateExperimentAssignment(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await experimentAssignmentsApi.update(id, body)).data,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.research.all });
    },
  });
}
