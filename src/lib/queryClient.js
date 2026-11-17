import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api";
import {
  QUERY_GC_TIME_MS,
  QUERY_RETRY_COUNT,
  QUERY_STALE_TIME_MS,
} from "../config/constants";
import { reportError } from "./errors";

const isClientError = (error) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

/**
 * Error policy:
 * - Session errors (signed out, password change required) → handled by the auth layer only.
 * - Query fails on FIRST load with a 5xx/network error → thrown to the nearest ErrorBoundary,
 *   which shows a fallback with "Try again".
 * - Query fails on first load with a 4xx (e.g. 404 centre not found) → returned to the page,
 *   which shows it inline.
 * - Query fails during a background refresh (data already on screen) → toast; the old data stays.
 * - Mutation fails → toast, unless the caller shows it inline (`meta: { inlineErrors: true }`,
 *   used by every form dialog).
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error?.isSessionError) return;
      if (query.state.data !== undefined)
        reportError(error, `refreshing ${JSON.stringify(query.queryKey)}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (error?.isSessionError || mutation.meta?.inlineErrors) return;
      reportError(error, "saving");
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
      retry: (failureCount, error) =>
        !isClientError(error) && failureCount < QUERY_RETRY_COUNT,
      refetchOnWindowFocus: true,
      throwOnError: (error, query) =>
        query.state.data === undefined && !isClientError(error),
    },
    mutations: { retry: false },
  },
});
