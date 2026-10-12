import type { AuthSession, LoginCredentials, UpdateProfileInput, User } from '@/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';

export const createAuthService = (http: AxiosInstance) => ({
  login: (credentials: LoginCredentials) =>
    http.post<AuthSession>(ENDPOINTS.auth.login, credentials).then((res) => res.data),
  logout: () => http.post<void>(ENDPOINTS.auth.logout).then(() => undefined),
  me: () => http.get<User>(ENDPOINTS.auth.me).then((res) => res.data),
  updateProfile: (input: UpdateProfileInput) =>
    http.patch<User>(ENDPOINTS.auth.profile, input).then((res) => res.data),
});

export type AuthService = ReturnType<typeof createAuthService>;

