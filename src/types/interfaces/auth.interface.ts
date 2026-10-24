import type { ISODateTime } from './common.interface';
import type { User } from './user.interface';

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly remember?: boolean;
}

export interface RegisterCredentials {
  readonly email: string;
  readonly password: string;
  readonly remember?: boolean;
}

export interface VerifyEmailInput {
  readonly email: string;
  readonly code: string;
}

export interface ResetPasswordInput {
  readonly email: string;
  readonly code: string;
  readonly newPassword: string;
}

export interface AuthSession {
  readonly user: User;
  readonly accessToken: string;
  readonly expiresAt: ISODateTime;
  readonly refreshToken: string;
  readonly refreshExpiresAt: ISODateTime;
}
