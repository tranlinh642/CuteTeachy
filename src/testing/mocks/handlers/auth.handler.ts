import { profileSchema } from '@/utils';
import type { AuthSession, LoginCredentials } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { MOCK_DEMO_CREDENTIALS } from '../seed/user.seed';
import { badRequest, noContent, ok, route, unauthorized } from '../mock-router';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const authRoutes = [
  route(
    'POST',
    ENDPOINTS.auth.login,
    (request, db) => {
      const { email, password } = (request.body ?? {}) as Partial<LoginCredentials>;
      const valid =
        email?.trim().toLowerCase() === MOCK_DEMO_CREDENTIALS.email && password === MOCK_DEMO_CREDENTIALS.password;
      if (!valid) return unauthorized('invalid_credentials');

      const session: AuthSession = {
        user: db.user,
        accessToken: `mock-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      };
      return ok(session);
    },
    { isPublic: true },
  ),
  route('POST', ENDPOINTS.auth.logout, () => noContent()),
  route('GET', ENDPOINTS.auth.me, (_request, db) => ok(db.user)),
  route('PATCH', ENDPOINTS.auth.profile, (request, db) => {
    const parseResult = profileSchema.safeParse(request.body);
    if (!parseResult.success) {
      return badRequest('Invalid profile payload');
    }
    const { fullName, displayName, title, gender } = parseResult.data;
    db.user = {
      ...db.user,
      fullName,
      displayName,
      title: title && title.trim() ? title.trim() : undefined,
      gender,
    };
    return ok(db.user);
  }),
];

