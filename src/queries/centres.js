import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { centresApi } from '../api'
import { MAX_PAGE_SIZE } from '../config/constants'
import { queryKeys } from '../lib/queryKeys'

// Data hooks for centres and their Centre PIs. Pages use these, never centresApi directly,
// so caching and cache invalidation stay consistent.

/** Centre list. `filters` = { search, isActive, sort, … } (sent as query parameters). */
export function useCentres(filters = {}) {
  const params = { limit: MAX_PAGE_SIZE, sort: 'name', ...filters }
  return useQuery({
    queryKey: queryKeys.centres.list(params),
    queryFn: () => centresApi.list(params),
    // While a new search loads, keep showing the previous results instead of an empty table.
    placeholderData: keepPreviousData,
  })
}

export function useCentre(id) {
  return useQuery({
    queryKey: queryKeys.centres.detail(id),
    queryFn: async () => (await centresApi.get(id)).data,
    enabled: Boolean(id),
  })
}

/** Current and previous Centre PIs (active first). */
export function useCentrePis(id) {
  return useQuery({
    queryKey: queryKeys.centres.pis(id),
    queryFn: async () => (await centresApi.pis(id)).data,
    enabled: Boolean(id),
  })
}

// Mutations. All of them are used from form dialogs, which show errors inline (meta.inlineErrors).
// Any change to a centre or its PI can affect every centre view (list, dashboard, detail), so
// they invalidate the whole 'centres' tree.

const useCentreMutation = (mutationFn, { alsoUsers = false } = {}) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centres.all })
      if (alsoUsers) queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export const useCreateCentre = () => useCentreMutation(async (body) => (await centresApi.create(body)).data)

export const useUpdateCentre = (id) => useCentreMutation(async (body) => (await centresApi.update(id, body)).data)

/** Assigns the Centre PI, replacing (and deactivating) the current one if there is one. */
export const useAssignCentrePi = (id) =>
  useCentreMutation(async (body) => (await centresApi.assignPi(id, body)).data, { alsoUsers: true })
