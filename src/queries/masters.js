import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  croppingSystemsApi,
  financialYearsApi,
  mastersApi,
  parametersApi,
} from "../api";
import { REFERENCE_STALE_TIME_MS } from "../config/constants";
import { queryKeys } from "../lib/queryKeys";

// Reference data: lookup lists (seasons, units, crops …), financial years and the parameter
// library. Everyone signed in reads them (they fill dropdowns); `masters.edit` changes them.

export function useMasterTypes() {
  return useQuery({
    queryKey: queryKeys.masters.types(),
    queryFn: async () => (await mastersApi.types()).data,
    staleTime: Infinity,
  });
}

/** Items of one master type. `filters` = { isActive, group, search }. */
export function useMasters(type, filters = {}) {
  return useQuery({
    queryKey: queryKeys.masters.list(type, filters),
    queryFn: async () => (await mastersApi.list(type, filters)).data,
    enabled: Boolean(type),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

const cropId = (c) => String(c.id ?? c._id);
const cropOption = (c) => ({
  value: cropId(c),
  label: `${c.name}${c.code ? ` (${c.code})` : ""}${c.isActive === false ? " · inactive" : ""}`,
});

/**
 * Crop options for react-select: the active crops, plus any crop in `selectedIds` that has been
 * deactivated since it was chosen (marked "inactive"), so editing never drops it silently.
 * `optionOf(id)` finds the option of any crop, active or not.
 */
export function useCropOptions(selectedIds = []) {
  const query = useMasters("crop");
  const all = query.data ?? [];
  const chosen = new Set(selectedIds.map(String));
  const byId = new Map(all.map((c) => [cropId(c), cropOption(c)]));
  return {
    ...query,
    options: all
      .filter((c) => c.isActive !== false || chosen.has(cropId(c)))
      .map(cropOption),
    optionOf: (id) => byId.get(String(id)),
  };
}

/** Active items of a type as select options [code, name], plus a code → name lookup. */
export function useMasterOptions(type) {
  const query = useMasters(type, { isActive: true });
  const items = query.data ?? [];
  return {
    ...query,
    options: items.map((m) => [m.code, m.name]),
    nameOf: (code) =>
      code ? (items.find((m) => m.code === code)?.name ?? code) : "—",
  };
}

const useInvalidating = (mutationFn, queryKey) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};

export const useCreateMaster = (type) =>
  useInvalidating(
    async (body) => (await mastersApi.create(type, body)).data,
    queryKeys.masters.all,
  );

/** ({ id, ...changes }) */
export const useUpdateMaster = (type) =>
  useInvalidating(
    async ({ id, ...body }) => (await mastersApi.update(type, id, body)).data,
    queryKeys.masters.all,
  );

/** Excel import: ({ file, dryRun }) → { dryRun, total, created, updated, errors }. */
export const useImportMasters = (type) =>
  useInvalidating(
    async ({ file, dryRun }) =>
      (await mastersApi.importFile(type, file, dryRun)).data,
    queryKeys.masters.all,
  );

export function useFinancialYears() {
  return useQuery({
    queryKey: queryKeys.financialYears.all,
    queryFn: async () => (await financialYearsApi.list()).data,
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}

export const useCreateFinancialYear = () =>
  useInvalidating(
    async (body) => (await financialYearsApi.create(body)).data,
    queryKeys.financialYears.all,
  );

export const useUpdateFinancialYear = () =>
  useInvalidating(
    async ({ id, ...body }) => (await financialYearsApi.update(id, body)).data,
    queryKeys.financialYears.all,
  );

/**
 * Cropping systems master: per season one main crop and its intercrops. `filters` = { isActive }.
 * Adds `byId(id)` (any system, active or not, so old choices still read well).
 */
export function useCroppingSystems(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.croppingSystems.list(filters),
    queryFn: async () => (await croppingSystemsApi.list(filters)).data,
    staleTime: REFERENCE_STALE_TIME_MS,
  });
  const items = query.data ?? [];
  return {
    ...query,
    items,
    byId: (id) => (id ? items.find((s) => s.id === String(id)) : undefined),
  };
}

export const useCreateCroppingSystem = () =>
  useInvalidating(
    async (body) => (await croppingSystemsApi.create(body)).data,
    queryKeys.croppingSystems.all,
  );

export const useUpdateCroppingSystem = () =>
  useInvalidating(
    async ({ id, ...body }) => (await croppingSystemsApi.update(id, body)).data,
    queryKeys.croppingSystems.all,
  );

/** Parameter library. `filters` = { category, isActive, search }. */
export function useParameters(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.parameters.list(filters),
    queryFn: async () => (await parametersApi.list(filters)).data,
    staleTime: REFERENCE_STALE_TIME_MS,
    enabled,
  });
}

export const useCreateParameter = () =>
  useInvalidating(
    async (body) => (await parametersApi.create(body)).data,
    queryKeys.parameters.all,
  );

export const useUpdateParameter = () =>
  useInvalidating(
    async ({ id, ...body }) => (await parametersApi.update(id, body)).data,
    queryKeys.parameters.all,
  );

export const useImportParameters = () =>
  useInvalidating(
    async ({ file, dryRun }) =>
      (await parametersApi.importFile(file, dryRun)).data,
    queryKeys.parameters.all,
  );

/** Display name of a unit code (UNT-001 → kg/ha); falls back to the code while units load. */
export function useUnitLabel() {
  const units = useMasterOptions("unit");
  return (code) => (code ? units.nameOf(code) : "");
}
