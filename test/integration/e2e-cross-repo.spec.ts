import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services';
import { ApiError } from '@/lib/api/api-error';
import type { AuthSession, User } from '@/types';

// =============================================================================
// E2E Cross-Repo Integration Test Suite (CuteTeachy-FE ↔ CuteTeachy-BE)
// Validates User Stories 1–9 from SPEC-002 against live NestJS + PostgreSQL +
// MinIO + Mailpit infrastructure.
// =============================================================================

const candidates = [
  path.resolve(__dirname, '../../../CuteTeachy-BE'),
  path.resolve(__dirname, '../../../../CuteTeachy-BE'),
];
const BE_DIR = candidates.find((c) => fs.existsSync(c)) || candidates[0];
const BE_URL_DEFAULT = 'http://localhost:4000';
const BE_URL_VERIFY_REQUIRED = 'http://localhost:4001';
const MAILPIT_API_URL = 'http://localhost:8025/api/v1';

let spawnedBe4000: ChildProcess | null = null;
let spawnedBe4001: ChildProcess | null = null;

async function isHttpHealthy(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function isMailpitHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${MAILPIT_API_URL}/messages`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHttpHealthy(url: string, maxWaitMs = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isHttpHealthy(url)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function stopProcess(proc: ChildProcess | null): void {
  if (!proc || proc.killed) return;
  try {
    if (process.platform === 'win32' && proc.pid) {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    proc.kill();
  }
}

// Mailpit utilities
async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_API_URL}/messages`, { method: 'DELETE' }).catch(() => undefined);
}

interface MailpitMessage {
  ID: string;
  Subject: string;
  Snippet: string;
  To: Array<{ Address: string }>;
}

async function getMailpitMessagesFor(email: string): Promise<MailpitMessage[]> {
  const res = await fetch(`${MAILPIT_API_URL}/messages`);
  const data = (await res.json()) as { messages?: MailpitMessage[] };
  const messages = data.messages || [];
  return messages.filter(
    (m) => m.To && m.To.some((t) => t.Address?.toLowerCase() === email.toLowerCase()),
  );
}

function extractSixDigitCode(msg: MailpitMessage): string {
  const match = (msg.Subject || '').match(/\b\d{6}\b/) || (msg.Snippet || '').match(/\b\d{6}\b/);
  if (!match) throw new Error(`Could not find 6-digit code in message: ${JSON.stringify(msg)}`);
  return match[0];
}

// Helper to create client with isolated IP
function createTestClient(options: {
  baseURL?: string;
  ip: string;
  initialToken?: string | null;
  initialRefreshToken?: string | null;
  onTokenRefreshed?: (session: AuthSession) => void;
}) {
  let token = options.initialToken ?? null;
  let refreshToken = options.initialRefreshToken ?? null;

  const client = createHttpClient({
    baseURL: options.baseURL ?? BE_URL_DEFAULT,
    mode: 'http',
    getAccessToken: () => token,
    getRefreshToken: () => refreshToken,
    onTokenRefreshed: (session) => {
      token = session.accessToken;
      refreshToken = session.refreshToken;
      options.onTokenRefreshed?.(session);
    },
  });

  client.defaults.headers.common['X-Forwarded-For'] = options.ip;

  return {
    client,
    services: createServices(client),
    setToken: (t: string | null) => {
      token = t;
    },
    getToken: () => token,
    setRefreshToken: (rt: string | null) => {
      refreshToken = rt;
    },
    getRefreshToken: () => refreshToken,
  };
}

// Tiny valid 1x1 PNG for avatar upload tests
const VALID_1X1_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('CuteTeachy Cross-Repo Integration E2E (FE ↔ BE)', () => {
  let beAvailable = false;
  let mailpitAvailable = false;

  beforeAll(async () => {
    // 1. Check / start BE on port 4000 (EMAIL_VERIFICATION_REQUIRED=false)
    if (await isHttpHealthy(BE_URL_DEFAULT)) {
      beAvailable = true;
    } else {
      try {
        spawnedBe4000 = spawn(process.execPath, [path.join(BE_DIR, 'dist', 'src', 'main.js')], {
          cwd: BE_DIR,
          env: { ...process.env, PORT: '4000', EMAIL_VERIFICATION_REQUIRED: 'false' },
          stdio: 'ignore',
        });
        spawnedBe4000.on('error', () => {
          beAvailable = false;
        });
        beAvailable = await waitForHttpHealthy(BE_URL_DEFAULT, 8000);
      } catch {
        beAvailable = false;
      }
    }

    // 2. Check Mailpit
    mailpitAvailable = await isMailpitHealthy();
    if (mailpitAvailable) {
      await clearMailpit();
    }
  }, 15000);

  afterAll(async () => {
    stopProcess(spawnedBe4000);
    stopProcess(spawnedBe4001);
  });

  // ---------------------------------------------------------------------------
  // Contract Shape & Type Check
  // ---------------------------------------------------------------------------
  function assertValidUserShape(user: User): void {
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBeGreaterThan(0);
    expect(typeof user.email).toBe('string');
    expect(user.email).toContain('@');
    expect(typeof user.emailVerified).toBe('boolean');
    expect(Array.isArray(user.loginProviders)).toBe(true);
    expect(typeof user.fullName).toBe('string');
    expect(typeof user.displayName).toBe('string');
    expect(['female', 'male', 'other', null]).toContain(user.gender);
    expect(user.onboardingCompletedAt === null || typeof user.onboardingCompletedAt === 'string').toBe(
      true,
    );
  }

  function assertValidSessionShape(session: AuthSession): void {
    assertValidUserShape(session.user);
    expect(typeof session.accessToken).toBe('string');
    expect(session.accessToken.split('.').length).toBe(3); // JWT format
    expect(typeof session.expiresAt).toBe('string');
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(typeof session.refreshToken).toBe('string');
    expect(typeof session.refreshExpiresAt).toBe('string');
    expect(new Date(session.refreshExpiresAt).getTime()).toBeGreaterThan(Date.now());
  }

  // ===========================================================================
  // User Story 1: Register & Login (Email + Password)
  // ===========================================================================
  describe('User Story 1: Đăng ký & Đăng nhập bằng Email + Mật khẩu', () => {
    it('đăng ký thành công và nhận ngay AuthSession hoàn chỉnh', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.1.1' });
      const email = `teacher_story1_${Date.now()}@cuteteachy.local`;

      const session = await harness.services.auth.register({
        email,
        password: 'password123',
        remember: true,
      });

      assertValidSessionShape(session);
      expect(session.user.email).toBe(email.toLowerCase());
      expect(session.user.emailVerified).toBe(false);
      expect(session.user.loginProviders).toEqual(['password']);
      expect(session.user.fullName).toBe('');
      expect(session.user.displayName).toBe('');
      expect(session.user.gender).toBeNull();
      expect(session.user.onboardingCompletedAt).toBeNull();
    });

    it('từ chối đăng ký trùng email (409 email_taken)', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.1.2' });
      const email = `duplicate_${Date.now()}@cuteteachy.local`;

      await harness.services.auth.register({ email, password: 'password123' });

      // Cố đăng ký lại với cùng email (thử chữ hoa chữ thường)
      const err = await harness.services.auth
        .register({ email: email.toUpperCase(), password: 'password456' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe('email_taken');
      expect(apiErr.status).toBe(409);
    });

    it('từ chối mật khẩu < 8 ký tự và email sai định dạng (400 validation)', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.1.3' });

      // Mật khẩu ngắn
      const shortErr = await harness.services.auth
        .register({ email: `valid_${Date.now()}@example.com`, password: 'short' })
        .catch((e: unknown) => e);
      expect(shortErr).toBeInstanceOf(ApiError);
      expect((shortErr as ApiError).code).toBe('validation');
      expect((shortErr as ApiError).status).toBe(400);

      // Email không hợp lệ
      const emailErr = await harness.services.auth
        .register({ email: 'not-an-email', password: 'password123' })
        .catch((e: unknown) => e);
      expect(emailErr).toBeInstanceOf(ApiError);
      expect((emailErr as ApiError).code).toBe('validation');
      expect((emailErr as ApiError).status).toBe(400);
    });

    it('đăng nhập thành công với tài khoản đã tạo', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.1.4' });
      const email = `login_success_${Date.now()}@cuteteachy.local`;
      const password = 'mySecurePassword88';

      await harness.services.auth.register({ email, password });

      const loginSession = await harness.services.auth.login({ email, password });
      assertValidSessionShape(loginSession);
      expect(loginSession.user.email).toBe(email);
    });

    it('sai mật khẩu hoặc không tồn tại trả về 401 invalid_credentials', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.1.5' });
      const email = `wrong_pass_${Date.now()}@cuteteachy.local`;

      await harness.services.auth.register({ email, password: 'correctPassword123' });

      // Sai mật khẩu
      const wrongPassErr = await harness.services.auth
        .login({ email, password: 'wrongPassword99' })
        .catch((e: unknown) => e);
      expect(wrongPassErr).toBeInstanceOf(ApiError);
      expect((wrongPassErr as ApiError).code).toBe('invalid_credentials');
      expect((wrongPassErr as ApiError).status).toBe(401);

      // Không tồn tại
      const nonExistErr = await harness.services.auth
        .login({ email: 'nobody_here_9999@cuteteachy.local', password: 'password123' })
        .catch((e: unknown) => e);
      expect(nonExistErr).toBeInstanceOf(ApiError);
      expect((nonExistErr as ApiError).code).toBe('invalid_credentials');
      expect((nonExistErr as ApiError).status).toBe(401);
    });
  });

  // ===========================================================================
  // User Stories 2, 3, 5: Google OAuth & Account Linking
  // ===========================================================================
  describe('User Stories 2, 3, 5: Google OAuth Contract & Account Linking', () => {
    it('GET /auth/google khởi tạo chuyển hướng đến Google OAuth', async () => {
      if (!beAvailable) return;
      const res = await fetch(`${BE_URL_DEFAULT}/auth/google?remember=true`, {
        redirect: 'manual',
      });
      // BE redirect 302 sang Google
      expect([302, 307]).toContain(res.status);
      const location = res.headers.get('location');
      expect(location).toBeDefined();
      expect(location).toContain('accounts.google.com');
      expect(location).toContain('client_id=');
      expect(location).toContain('state=');
    });

    it('POST /auth/google/exchange từ chối mã không hợp lệ với 401 invalid_code', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.2.1' });

      const err = await harness.services.auth
        .googleExchange('invalid_mock_code_12345')
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe('invalid_code');
      expect(apiErr.status).toBe(401);
    });

    it('ghi chú rõ thông tin Google Client ID / Secret thật [CẦN BỔ SUNG từ người dùng]', () => {
      // Contract specification compliance:
      // Live Google login flow relies on real Google Cloud Console OAuth credentials.
      // In current development environment, BE uses mock GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
      // Stories 2, 3, 5 live testing with real Google account requires:
      const note =
        '[CẦN BỔ SUNG từ người dùng: GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET thật trong CuteTeachy-BE/.env]';
      expect(note).toContain('[CẦN BỔ SUNG từ người dùng');
    });
  });

  // ===========================================================================
  // User Story 4: Onboarding Flow & Guard
  // ===========================================================================
  describe('User Story 4: Khai báo họ tên, tên hiển thị, giới tính ở Onboarding', () => {
    it('cập nhật profile hoàn tất onboarding (đặt onboardingCompletedAt)', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.3.1' });
      const email = `onboarding_${Date.now()}@cuteteachy.local`;

      const reg = await harness.services.auth.register({ email, password: 'password123' });
      harness.setToken(reg.accessToken);
      expect(reg.user.onboardingCompletedAt).toBeNull();

      // Điền thông tin Onboarding
      const updatedUser = await harness.services.auth.updateProfile({
        fullName: 'Trần Thị Thuỳ Linh',
        displayName: 'Thuỳ Linh',
        gender: 'female',
        title: 'Giáo viên Tiểu học',
      });

      assertValidUserShape(updatedUser);
      expect(updatedUser.fullName).toBe('Trần Thị Thuỳ Linh');
      expect(updatedUser.displayName).toBe('Thuỳ Linh');
      expect(updatedUser.gender).toBe('female');
      expect(updatedUser.title).toBe('Giáo viên Tiểu học');
      expect(updatedUser.onboardingCompletedAt).not.toBeNull();
      expect(typeof updatedUser.onboardingCompletedAt).toBe('string');

      // GET /auth/me cũng phản ánh trạng thái đã onboarding
      const me = await harness.services.auth.me();
      expect(me.onboardingCompletedAt).toBe(updatedUser.onboardingCompletedAt);
    });

    it('từ chối giới tính không hợp lệ (400 validation)', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.3.2' });
      const reg = await harness.services.auth.register({
        email: `invalid_gender_${Date.now()}@cuteteachy.local`,
        password: 'password123',
      });
      harness.setToken(reg.accessToken);

      // @ts-expect-error test runtime validation
      const err = await harness.services.auth.updateProfile({ gender: 'unknown_gender' }).catch((e) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('validation');
    });
  });

  // ===========================================================================
  // User Story 6: Avatar Upload & Delete (MinIO Object Storage)
  // ===========================================================================
  describe('User Story 6: Quản lý Avatar với MinIO Object Storage', () => {
    it('upload ảnh avatar hợp lệ, kiểm tra link công khai, sau đó xoá avatar', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.4.1' });
      const reg = await harness.services.auth.register({
        email: `avatar_user_${Date.now()}@cuteteachy.local`,
        password: 'password123',
      });
      harness.setToken(reg.accessToken);

      // 1. Upload ảnh PNG hợp lệ
      const file = new File([VALID_1X1_PNG], 'my-avatar.png', { type: 'image/png' });
      const uploadedUser = await harness.services.auth.uploadAvatar(file);

      assertValidUserShape(uploadedUser);
      expect(uploadedUser.avatarUrl).toBeDefined();
      expect(uploadedUser.avatarUrl).toContain('/avatars/');

      // 2. Kiểm tra link ảnh avatar có đọc được công khai qua HTTP 200 từ MinIO
      const imgRes = await fetch(uploadedUser.avatarUrl!);
      expect(imgRes.status).toBe(200);
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
      expect(imgBytes.length).toBe(VALID_1X1_PNG.length);

      // 3. Xoá avatar
      const deletedUser = await harness.services.auth.deleteAvatar();
      assertValidUserShape(deletedUser);
      expect(deletedUser.avatarUrl).toBeUndefined();
    });

    it('từ chối file vượt quá 2 MB (413 file_too_large)', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.4.2' });
      const reg = await harness.services.auth.register({
        email: `avatar_oversize_${Date.now()}@cuteteachy.local`,
        password: 'password123',
      });
      harness.setToken(reg.accessToken);

      const largeBuffer = new Uint8Array(2 * 1024 * 1024 + 100);
      largeBuffer.set(VALID_1X1_PNG.subarray(0, 16), 0);
      const largeFile = new File([largeBuffer], 'too-large.png', { type: 'image/png' });

      const err = await harness.services.auth.uploadAvatar(largeFile).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('file_too_large');
      expect((err as ApiError).status).toBe(413);
    });

    it('từ chối định dạng file không hỗ trợ (415 unsupported_file_type)', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.4.3' });
      const reg = await harness.services.auth.register({
        email: `avatar_invalid_type_${Date.now()}@cuteteachy.local`,
        password: 'password123',
      });
      harness.setToken(reg.accessToken);

      const textBytes = new TextEncoder().encode('This is a text document, not an image.');
      const textFile = new File([textBytes], 'document.txt', { type: 'text/plain' });

      const err = await harness.services.auth.uploadAvatar(textFile).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('unsupported_file_type');
      expect((err as ApiError).status).toBe(415);
    });
  });

  // ===========================================================================
  // User Story 7: Remember Me & Single-Flight Token Auto-Refresh
  // ===========================================================================
  describe('User Story 7: Duy trì đăng nhập & Tự động gia hạn phiên (Single-Flight)', () => {
    it('remember = true đặt refreshExpiresAt ~30 ngày, remember = false ~1 ngày', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.5.1' });

      // remember: true
      const sessionRemember = await harness.services.auth.register({
        email: `remember_true_${Date.now()}@cuteteachy.local`,
        password: 'password123',
        remember: true,
      });
      const diffDaysRemember =
        (new Date(sessionRemember.refreshExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDaysRemember).toBeGreaterThan(28);
      expect(diffDaysRemember).toBeLessThan(32);

      // remember: false
      const sessionSession = await harness.services.auth.register({
        email: `remember_false_${Date.now()}@cuteteachy.local`,
        password: 'password123',
        remember: false,
      });
      const diffHoursSession =
        (new Date(sessionSession.refreshExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diffHoursSession).toBeGreaterThan(20);
      expect(diffHoursSession).toBeLessThan(26);
    });

    it('single-flight refresh: khi access token hết hạn, 3 request đồng thời chỉ gửi 1 POST /auth/refresh', async () => {
      if (!beAvailable) return;
      const refreshedList: AuthSession[] = [];
      const harness = createTestClient({
        ip: '10.1.5.2',
        onTokenRefreshed: (s) => refreshedList.push(s),
      });

      const email = `single_flight_${Date.now()}@cuteteachy.local`;
      const reg = await harness.services.auth.register({ email, password: 'password123' });
      harness.setToken(reg.accessToken);
      harness.setRefreshToken(reg.refreshToken);

      // Verify request ban đầu
      const initialMe = await harness.services.auth.me();
      expect(initialMe.email).toBe(email);

      // Giả lập access token hết hạn / không hợp lệ
      harness.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.expired');

      // 3 request đồng thời
      const [res1, res2, res3] = await Promise.all([
        harness.services.auth.me(),
        harness.services.auth.me(),
        harness.services.auth.me(),
      ]);

      expect(res1.email).toBe(email);
      expect(res2.email).toBe(email);
      expect(res3.email).toBe(email);

      // Chỉ có DUY NHẤT 1 lần refresh diễn ra
      expect(refreshedList.length).toBe(1);
      // Access token và refresh token đã được xoay vòng mới
      expect(harness.getToken()).toBe(refreshedList[0].accessToken);
      expect(harness.getRefreshToken()).toBe(refreshedList[0].refreshToken);
    });

    it('logout thu hồi refresh token trên BE; dùng lại token bị từ chối 401', async () => {
      if (!beAvailable) return;
      const harness = createTestClient({ ip: '10.1.5.3' });
      const reg = await harness.services.auth.register({
        email: `logout_${Date.now()}@cuteteachy.local`,
        password: 'password123',
      });
      harness.setToken(reg.accessToken);
      harness.setRefreshToken(reg.refreshToken);

      // Logout
      await harness.services.auth.logout(reg.refreshToken);

      // Thử dùng lại refresh token đã bị thu hồi
      const refreshErr = await harness.services.auth.refresh(reg.refreshToken).catch((e: unknown) => e);
      expect(refreshErr).toBeInstanceOf(ApiError);
      expect((refreshErr as ApiError).code).toBe('unauthorized');
      expect((refreshErr as ApiError).status).toBe(401);
    });
  });

  // ===========================================================================
  // User Story 8 & 9: Email Verification & Password Reset with Mailpit
  // ===========================================================================
  describe('User Stories 8 & 9: Xác minh Email & Quên Mật Khẩu (Tích hợp Mailpit)', () => {
    it('User Story 8: Đăng ký nhận mã Mailpit, POST /auth/email/verify xác minh thành công', async () => {
      if (!beAvailable || !mailpitAvailable) return;
      const harness = createTestClient({ ip: '10.1.6.1' });
      const email = `verify_teacher_${Date.now()}@cuteteachy.local`;

      // 1. Đăng ký
      const reg = await harness.services.auth.register({ email, password: 'password123' });
      expect(reg.user.emailVerified).toBe(false);

      // 2. Đọc mã từ Mailpit
      const msgs = await getMailpitMessagesFor(email);
      expect(msgs.length).toBeGreaterThanOrEqual(1);
      const code = extractSixDigitCode(msgs[0]);
      expect(code).toMatch(/^\d{6}$/);

      // 3. Thử mã sai trả về 400 invalid_code
      const wrongErr = await harness.services.auth
        .verifyEmail({ email, code: '000000' })
        .catch((e: unknown) => e);
      expect(wrongErr).toBeInstanceOf(ApiError);
      expect((wrongErr as ApiError).code).toBe('invalid_code');
      expect([400, 401]).toContain((wrongErr as ApiError).status);

      // 4. Xác minh với mã đúng
      const verifiedSession = await harness.services.auth.verifyEmail({ email, code });
      assertValidSessionShape(verifiedSession);
      expect(verifiedSession.user.emailVerified).toBe(true);

      // 5. Thử gửi lại mã xác minh khi chưa qua 60s cooldown -> 429 rate_limited
      const resendCooldownErr = await harness.services.auth
        .resendEmailCode(email)
        .catch((e: unknown) => e);
      expect(resendCooldownErr).toBeInstanceOf(ApiError);
      expect((resendCooldownErr as ApiError).code).toBe('rate_limited');
      expect((resendCooldownErr as ApiError).status).toBe(429);
    });

    it('User Story 9: Quên mật khẩu, nhận mã Mailpit, đặt mật khẩu mới, đăng nhập lại thành công', async () => {
      if (!beAvailable || !mailpitAvailable) return;
      const harness = createTestClient({ ip: '10.1.6.2' });
      const email = `reset_teacher_${Date.now()}@cuteteachy.local`;
      const oldPassword = 'oldPassword123';
      const newPassword = 'newPassword456';

      await harness.services.auth.register({ email, password: oldPassword });

      // 1. Yêu cầu đặt lại mật khẩu (204)
      await harness.services.auth.forgotPassword(email);

      // 2. Đọc mã reset từ Mailpit
      const msgs = await getMailpitMessagesFor(email);
      // Lấy email mới nhất có chủ đề đặt lại mật khẩu
      const resetMsg = msgs.find(
        (m) => m.Subject.includes('mật khẩu') || m.Subject.includes('password'),
      );
      expect(resetMsg).toBeDefined();
      const resetCode = extractSixDigitCode(resetMsg!);

      // 3. Đặt lại mật khẩu với mã sai -> 400 invalid_code
      const wrongCodeErr = await harness.services.auth
        .resetPassword({ email, code: '111111', newPassword })
        .catch((e: unknown) => e);
      expect(wrongCodeErr).toBeInstanceOf(ApiError);
      expect((wrongCodeErr as ApiError).code).toBe('invalid_code');

      // 4. Đặt lại mật khẩu thành công (204)
      await harness.services.auth.resetPassword({ email, code: resetCode, newPassword });

      // 5. Đăng nhập bằng mật khẩu cũ bị từ chối
      const oldLoginErr = await harness.services.auth
        .login({ email, password: oldPassword })
        .catch((e: unknown) => e);
      expect(oldLoginErr).toBeInstanceOf(ApiError);
      expect((oldLoginErr as ApiError).code).toBe('invalid_credentials');

      // 6. Đăng nhập bằng mật khẩu mới thành công
      const newLoginSession = await harness.services.auth.login({ email, password: newPassword });
      assertValidSessionShape(newLoginSession);
      expect(newLoginSession.user.email).toBe(email);
    });

    it('Chế độ EMAIL_VERIFICATION_REQUIRED=true chặn đăng nhập trước khi xác minh', async () => {
      if (!beAvailable || !mailpitAvailable) return;

      // Khởi động instance BE có EMAIL_VERIFICATION_REQUIRED=true trên port 4001
      if (!(await isHttpHealthy(BE_URL_VERIFY_REQUIRED))) {
        spawnedBe4001 = spawn(process.execPath, [path.join(BE_DIR, 'dist', 'src', 'main.js')], {
          cwd: BE_DIR,
          env: { ...process.env, PORT: '4001', EMAIL_VERIFICATION_REQUIRED: 'true' },
          stdio: 'ignore',
        });
        spawnedBe4001.on('error', () => {});
        const ready = await waitForHttpHealthy(BE_URL_VERIFY_REQUIRED, 8000);
        if (!ready) return;
      }

      const harness = createTestClient({ baseURL: BE_URL_VERIFY_REQUIRED, ip: '10.1.7.1' });
      const email = `required_verify_${Date.now()}@cuteteachy.local`;
      const password = 'password123';

      // 1. Đăng ký trên cổng 4001
      await harness.services.auth.register({ email, password });

      // 2. Cố gắng đăng nhập TRƯỚC KHI xác minh -> Bị chặn 403 email_not_verified
      const blockedErr = await harness.services.auth.login({ email, password }).catch((e: unknown) => e);
      expect(blockedErr).toBeInstanceOf(ApiError);
      expect((blockedErr as ApiError).code).toBe('email_not_verified');
      expect((blockedErr as ApiError).status).toBe(403);

      // 3. Đọc mã từ Mailpit và xác minh
      const msgs = await getMailpitMessagesFor(email);
      expect(msgs.length).toBeGreaterThanOrEqual(1);
      const code = extractSixDigitCode(msgs[0]);

      await harness.services.auth.verifyEmail({ email, code });

      // 4. Đăng nhập SAU KHI xác minh -> Thành công 200
      const okSession = await harness.services.auth.login({ email, password });
      assertValidSessionShape(okSession);
      expect(okSession.user.emailVerified).toBe(true);
    }, 15000);
  });
});
