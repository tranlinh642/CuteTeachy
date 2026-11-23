import type { AxiosInstance } from 'axios';
import type {
  ApplyAiDraftInput,
  ApplyAiDraftResponse,
  ID,
  ListAiChatMessagesResponse,
  SendAiMessageInput,
  SendAiMessageResponse,
} from '@/types';
import { ENDPOINTS } from '../endpoints';

export const createAiAssistantService = (http: AxiosInstance) => {
  const listMessages = (params?: { limit?: number }) =>
    http
      .get<ListAiChatMessagesResponse>(
        ENDPOINTS.aiAssistant.messages,
        params ? { params } : undefined,
      )
      .then((res) => res.data);

  const sendMessage = (input: SendAiMessageInput) => {
    if (input.image) {
      const formData = new FormData();
      if (input.message !== undefined && input.message !== '') {
        formData.append('message', input.message);
      }
      formData.append('image', input.image);
      return http
        .post<SendAiMessageResponse>(ENDPOINTS.aiAssistant.messages, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => res.data);
    }

    return http
      .post<SendAiMessageResponse>(ENDPOINTS.aiAssistant.messages, {
        message: input.message,
      })
      .then((res) => res.data);
  };

  const applyDraft = (messageId: ID, input: ApplyAiDraftInput) =>
    http
      .post<ApplyAiDraftResponse>(ENDPOINTS.aiAssistant.applyDraft(messageId), input)
      .then((res) => res.data);

  const clearMessages = () =>
    http.delete<void>(ENDPOINTS.aiAssistant.messages).then(() => undefined);

  return {
    listMessages,
    list: listMessages,
    sendMessage,
    send: sendMessage,
    applyDraft,
    clearMessages,
    clear: clearMessages,
  };
};

export type AiAssistantService = ReturnType<typeof createAiAssistantService>;
