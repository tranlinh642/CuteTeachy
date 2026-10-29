'use client';

import type {
  ApplyAiDraftInput,
  ApplyAiDraftResponse,
  ID,
  ListAiChatMessagesResponse,
  SendAiMessageInput,
  SendAiMessageResponse,
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';

export interface UseAiMessagesOptions {
  readonly limit?: number;
  readonly enabled?: boolean;
}

export function useAiMessages(options?: UseAiMessagesOptions) {
  const { aiAssistant } = useServices();
  const params = options?.limit !== undefined ? { limit: options.limit } : undefined;

  return useQuery<ListAiChatMessagesResponse, ApiError>({
    queryKey: queryKeys.aiAssistant.messages(params),
    queryFn: () => aiAssistant.listMessages(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSendAiMessage() {
  const { aiAssistant } = useServices();
  const queryClient = useQueryClient();

  return useMutation<SendAiMessageResponse, ApiError, SendAiMessageInput>({
    mutationFn: (input) => aiAssistant.sendMessage(input),
    onSuccess: (response) => {
      queryClient.setQueriesData<ListAiChatMessagesResponse>(
        { queryKey: queryKeys.aiAssistant.all },
        (old) => {
          if (!old) {
            return { items: [response.userMessage, response.assistantMessage] };
          }
          return {
            items: [...old.items, response.userMessage, response.assistantMessage],
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.aiAssistant.all });
    },
  });
}

export interface ApplyAiDraftVariables extends ApplyAiDraftInput {
  readonly messageId: ID;
}

export function useApplyAiDraft() {
  const { aiAssistant } = useServices();
  const queryClient = useQueryClient();

  return useMutation<ApplyAiDraftResponse, ApiError, ApplyAiDraftVariables>({
    mutationFn: ({ messageId, conflictStrategy, items }) =>
      aiAssistant.applyDraft(messageId, { conflictStrategy, items }),
    onSuccess: (response) => {
      queryClient.setQueriesData<ListAiChatMessagesResponse>(
        { queryKey: queryKeys.aiAssistant.all },
        (old) => {
          if (!old) return old;
          return {
            items: old.items.map((item) =>
              item.id === response.message.id ? response.message : item,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.aiAssistant.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.timetableSlots.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useClearAiMessages() {
  const { aiAssistant } = useServices();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => aiAssistant.clearMessages(),
    onSuccess: () => {
      queryClient.setQueriesData<ListAiChatMessagesResponse>(
        { queryKey: queryKeys.aiAssistant.all },
        { items: [] },
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.aiAssistant.all });
    },
  });
}
