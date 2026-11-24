import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communicationsApi } from "../api";
import { queryKeys } from "../lib/queryKeys";

// Communication & correspondence. Mail belongs to a side: the PCU, or the user's centre. Every
// change can move the unread badge, a list and the open item, so mutations refresh the whole tree.

const UNREAD_STALE_MS = 60_000;

/** `filters` = { box: 'inbox' | 'sent', type, status, search, page, limit } → { data, meta }. */
export function useCommunications(filters) {
  return useQuery({
    queryKey: queryKeys.communications.list(filters),
    queryFn: () => communicationsApi.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useCommunication(id) {
  return useQuery({
    queryKey: queryKeys.communications.detail(id),
    queryFn: async () => (await communicationsApi.get(id)).data,
    enabled: Boolean(id),
  });
}

/** One recipient's reply thread; the sender names the centre when there are several recipients. */
export function useCommunicationReplies(id, centreId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.communications.replies(id, centreId),
    queryFn: async () => (await communicationsApi.replies(id, centreId)).data,
    enabled: Boolean(id) && enabled,
  });
}

/** For the navigation badge. No polling: it refreshes when the window regains focus. */
export function useUnreadCommunications({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.communications.unread(),
    queryFn: async () => (await communicationsApi.unreadCount()).data.unread,
    staleTime: UNREAD_STALE_MS,
    enabled,
  });
}

const useRefreshing = (mutationFn, { inline = false } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    ...(inline ? { meta: { inlineErrors: true } } : {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.all }),
  });
};

export const useSendCommunication = () =>
  useRefreshing(async (body) => (await communicationsApi.send(body)).data, {
    inline: true,
  });

export const useMarkCommunicationRead = () =>
  useRefreshing(async (id) => (await communicationsApi.read(id)).data);

export const useAcknowledgeCommunication = () =>
  useRefreshing(async (id) => (await communicationsApi.acknowledge(id)).data);

/** ({ id, body, centreId }) */
export const useReplyToCommunication = () =>
  useRefreshing(
    async ({ id, body, centreId }) =>
      (await communicationsApi.reply(id, body, centreId)).data,
    { inline: true },
  );
