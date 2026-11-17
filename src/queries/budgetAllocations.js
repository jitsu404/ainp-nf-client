import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { budgetAllocationsApi } from "../api";
import { queryKeys } from "../lib/queryKeys";

/**
 * List budget allocations with filters (centre, fy, budgetHead, fundCategory, isTotal).
 */
export function useBudgetAllocations(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.budgetAllocations.list(filters),
    queryFn: async () => (await budgetAllocationsApi.list(filters)).data,
    enabled,
    placeholderData: keepPreviousData,
  });
}

/**
 * Single budget allocation by ID.
 */
export function useBudgetAllocation(id) {
  return useQuery({
    queryKey: queryKeys.budgetAllocations.detail(id),
    queryFn: async () => (await budgetAllocationsApi.get(id)).data,
    enabled: Boolean(id),
  });
}

const useBudgetAllocationMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgetAllocations.all,
      });
    },
  });
};

export const useCreateBudgetAllocation = () =>
  useBudgetAllocationMutation(
    async (body) => (await budgetAllocationsApi.create(body)).data,
  );

export const useBulkSaveBudgetAllocations = () =>
  useBudgetAllocationMutation(
    async (body) => (await budgetAllocationsApi.bulkSave(body)).data,
  );

export const useUpdateBudgetAllocation = () =>
  useBudgetAllocationMutation(
    async ({ id, ...body }) =>
      (await budgetAllocationsApi.update(id, body)).data,
  );

export const useDeleteBudgetAllocation = () =>
  useBudgetAllocationMutation(
    async (id) => (await budgetAllocationsApi.remove(id)).data,
  );
