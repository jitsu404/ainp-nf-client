import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { auditApi } from '../api'
import { queryKeys } from '../lib/queryKeys'

/**
 * One page of the audit trail. `filters` = { page, limit, search, module, roleId, userId, centreId,
 * entityId, from, to }. Always refetched when shown (staleTime 0), because any change anywhere in
 * the app adds rows; the previous page stays on screen while the next loads.
 */
export function useAudit(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => auditApi.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 0,
    enabled,
  })
}
