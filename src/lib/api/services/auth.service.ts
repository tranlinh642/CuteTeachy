import type { AuthSession, LoginCredentials, RegisterCredentials, UpdateProfileInput, User } from '@/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';

export const createAuthService = (http: AxiosInstance) => ({
  register: (credentials: RegisterCredentials) =>
    http.post<AuthSession>(ENDPOINTS.auth.register, credentials).then((res) => res.data),
  login: (credentials: LoginCredentials) =>
    http.post<AuthSession>(ENDPOINTS.auth.login, credentials).then((res) => res.data),
  refresh: (refreshToken: string) =>
    http.post<AuthSession>(ENDPOINTS.auth.refresh, { refreshToken }).then((res) => res.data),
  logout: (refreshToken?: string) =>
    http.post<void>(ENDPOINTS.auth.logout, { refreshToken }).then(() => undefined),
  me: () => http.get<User>(ENDPOINTS.auth.me).then((res) => res.data),
  googleExchange: (code: string) =>
    http.post<AuthSession>(ENDPOINTS.auth.googleExchange, { code }).then((res) => res.data),
  updateProfile: (input: UpdateProfileInput) =>
    http.patch<User>(ENDPOINTS.auth.profile, input).then((res) => res.data),
  uploadAvatar: (file: File | Blob) => {
    const formData = new FormData();
    formData.append('file', file);
    return http
      .post<User>(ENDPOINTS.auth.avatar, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  deleteAvatar: () =>
    http.delete<User>(ENDPOINTS.auth.avatar).then((res) => res.data),
});

export type AuthService = ReturnType<typeof createAuthService>;
