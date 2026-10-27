import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';
import type {
  CreatePushSubscriptionInput,
  DeletePushSubscriptionInput,
  PushSubscriptionDto,
  VapidPublicKeyResponse,
} from '@/types';

export const createPushService = (http: AxiosInstance) => {
  const getVapidPublicKey = () =>
    http.get<VapidPublicKeyResponse>(ENDPOINTS.push.vapidPublicKey).then((res) => res.data);

  const createPushSubscription = (payload: CreatePushSubscriptionInput) =>
    http.post<PushSubscriptionDto>(ENDPOINTS.push.subscriptions, payload).then((res) => res.data);

  const deletePushSubscription = (payload: DeletePushSubscriptionInput) =>
    http.delete<void>(ENDPOINTS.push.subscriptions, { data: payload }).then(() => undefined);

  return {
    getVapidPublicKey,
    createPushSubscription,
    createSubscription: createPushSubscription,
    deletePushSubscription,
    deleteSubscription: deletePushSubscription,
  };
};

export type PushService = ReturnType<typeof createPushService>;
