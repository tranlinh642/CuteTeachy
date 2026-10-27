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

export interface PushSubscriptionDto {
  readonly id?: string;
  readonly accountId?: string;
  readonly endpoint: string;
  readonly keys: PushSubscriptionKeys;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
