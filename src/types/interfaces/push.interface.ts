export interface VapidPublicKeyResponse {
  readonly publicKey: string;
}

export interface PushSubscriptionKeys {
  readonly p256dh: string;
  readonly auth: string;
}

export interface CreatePushSubscriptionInput {
  readonly endpoint: string;
  readonly keys: PushSubscriptionKeys;
}

export interface DeletePushSubscriptionInput {
  readonly endpoint: string;
}
