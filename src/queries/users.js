import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api'
import { MAX_PAGE_SIZE } from '../config/constants'
import { queryKeys } from '../lib/queryKeys'

// Data hooks for user accounts. The API only returns accounts the signed-in user may manage.

export function useUsers(filters = {}, { enabled = true } = {}) {
  const params = { limit: MAX_PAGE_SIZE, sort: 'name', ...filters }
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.list(params),
    enabled,
  })
}

// A user change can show up on centre pages too (the Centre PI card and history),
// so every user mutation refreshes both trees.
const useUserMutation = (mutationFn) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.centres.all })
    },
  })
}

export const useCreateUser = () => useUserMutation(async (body) => (await usersApi.create(body)).data)

export const useUpdateUser = () => useUserMutation(async ({ id, ...body }) => (await usersApi.update(id, body)).data)

export const useDeactivateUser = () => useUserMutation(async ({ id, reason }) => (await usersApi.deactivate(id, reason)).data)

export const useActivateUser = () => useUserMutation(async ({ id }) => (await usersApi.activate(id)).data)

export const useResetPassword = () =>
  useUserMutation(async ({ id, temporaryPassword }) => (await usersApi.resetPassword(id, temporaryPassword)).data)
