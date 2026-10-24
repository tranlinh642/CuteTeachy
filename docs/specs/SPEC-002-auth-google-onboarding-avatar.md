# Spec 002: Tài khoản riêng + Google Login, Onboarding, Avatar (FE + BE)

- **Trạng thái:** Accepted (chốt qua phiên `/grill-with-docs` ngày 2026-10-24)
- **Phạm vi:** `CuteTeachy-BE` (NestJS) và `CuteTeachy-FE` (Next.js PWA)
- **Quyết định nền:** [BE ADR 0001 — BE tự quản lý Auth](../../../CuteTeachy-BE/docs/adr/0001-be-owned-auth.md), [ADR 0001 — Gender-Adaptive Theme](../adr/0001-gender-adaptive-theme.md)
- **Thuật ngữ:** Account, Profile, Login Provider, Account Linking, Onboarding — xem [`GLOSSARY.md`](../../GLOSSARY.md)
- **Thay thế một phần SPEC-001:** mục Out of Scope "upload avatar lên cloud storage" nay nằm trong phạm vi (MinIO).

## Problem Statement

FE đang đăng nhập bằng backend giả lập với một tài khoản demo cố định. Giáo viên không thể tự đăng ký, không đăng nhập được bằng Google, tài khoản mới không có `gender` (trái ADR 0001), avatar chỉ là chữ cái đầu, và chưa có BE thật nào phục vụ hồ sơ.

## Solution

BE tự sở hữu Account: đăng ký/đăng nhập bằng mật khẩu, Google OAuth (redirect qua BE), Account Linking theo email, access + refresh token. Sau đăng ký hoặc lần đăng nhập đầu, giáo viên bắt buộc qua Onboarding. Profile có avatar upload lên MinIO. Xác minh email và quên mật khẩu bằng mã gửi qua email làm ở giai đoạn cuối.

## User Stories

1. Là giáo viên mới, tôi đăng ký bằng email + mật khẩu và được đăng nhập ngay.
2. Là giáo viên, tôi đăng nhập bằng Google mà không cần tạo mật khẩu.
3. Là giáo viên đã đăng ký bằng mật khẩu, khi đăng nhập Google cùng email, tôi vào đúng Account cũ.
4. Là giáo viên mới, sau lần đăng nhập đầu tôi khai báo họ tên, tên hiển thị, giới tính (bắt buộc), chức danh và avatar (tùy chọn) trước khi vào app.
5. Là giáo viên đăng nhập Google, tôi thấy họ tên và avatar Google được điền sẵn ở Onboarding.
6. Là giáo viên, tôi xem và sửa Profile, upload/xoá avatar.
7. Là giáo viên, tôi giữ đăng nhập qua nhiều ngày khi chọn "Ghi nhớ đăng nhập", và phiên tự gia hạn không làm gián đoạn thao tác.
8. *(Giai đoạn cuối)* Là giáo viên đăng ký bằng mật khẩu, tôi xác minh email bằng mã 6 số.
9. *(Giai đoạn cuối)* Là giáo viên quên mật khẩu, tôi nhận mã qua email và đặt mật khẩu mới.

## Business Rules

### Account & Login Provider
- Email là định danh duy nhất của Account, so sánh không phân biệt hoa thường, lưu dạng đã trim + lowercase.
- Mật khẩu: 8–72 ký tự, băm argon2id. FE schema đổi `passwordMin` từ 6 → 8.
- Đăng ký với email đã tồn tại (bất kể Login Provider) → `409 email_taken`.
- Đăng ký thành công → trả `AuthSession` (đăng nhập luôn).
- Sai email hoặc mật khẩu → luôn `401 invalid_credentials`, không tiết lộ email có tồn tại.
- Account chỉ có Login Provider `google` mà đăng nhập bằng mật khẩu → `401 invalid_credentials`.

### Google OAuth & Account Linking
- Luồng: FE điều hướng tới `GET /auth/google` → Google → `GET /auth/google/callback` (BE) → BE redirect về `${FE_URL}/auth/callback?code=<mã dùng một lần>` → FE gọi `POST /auth/google/exchange`.
- `state` OAuth chống CSRF, BE kiểm tra ở callback. Lỗi bất kỳ → redirect `${FE_URL}/auth/callback?error=google_failed`.
- Mã dùng một lần: ngẫu nhiên, TTL 60 giây, dùng đúng một lần, lưu dạng hash.
- Email Google chưa được Google xác minh → từ chối (`google_failed`).
- Email Google trùng Account có sẵn → Account Linking: thêm Login Provider `google` vào Account đó.
- Account tạo qua Google: `emailVerified = true`; Profile điền sẵn `fullName`, `displayName` (tên riêng từ Google), `avatarUrl` (ảnh Google).

### Token
- Access token: JWT, TTL 15 phút, chứa `sub = accountId`.
- Refresh token: chuỗi ngẫu nhiên, lưu hash, xoay vòng mỗi lần `POST /auth/refresh` (token cũ bị thu hồi). Dùng lại token đã thu hồi → thu hồi toàn bộ refresh token của Account (phát hiện đánh cắp).
- TTL refresh token: cấu hình `REFRESH_TOKEN_TTL_REMEMBER` (mặc định 30 ngày) khi `remember = true`, `REFRESH_TOKEN_TTL_SESSION` (mặc định 1 ngày) khi `remember = false`. FE lưu refresh token ở storage bền khi remember, storage theo phiên khi không.
- Logout thu hồi refresh token được gửi lên. FE luôn xoá phiên cục bộ dù server lỗi.
- Không dùng cookie (FE và BE khác domain).

### Onboarding
- Profile mới có `onboardingCompletedAt = null`, `gender = null`.
- `PATCH /auth/profile`: sau khi áp dụng thay đổi, nếu `fullName`, `displayName`, `gender` đều có giá trị và `onboardingCompletedAt = null` → đặt `onboardingCompletedAt = now`.
- Mọi API nghiệp vụ (tasks, notes, tags, classes, inspirations, …) trả `403 onboarding_required` khi chưa hoàn tất Onboarding. Nhóm `/auth/*` được miễn.
- FE: đã đăng nhập mà `onboardingCompletedAt = null` → mọi route trong app chuyển về `/onboarding`; đã hoàn tất mà vào `/onboarding` → về `/`.
- Validation Profile giữ nguyên SPEC-001: `fullName` 2–50, `displayName` 1–20, `title` ≤ 50 (rỗng → xoá), `gender ∈ {female, male, other}`.
- Smart Default Theme (ADR 0001) vẫn xử lý phía FE, không đổi.

### Avatar
- Upload `multipart/form-data`, field `file`, tối đa 2 MB, chỉ `image/jpeg`, `image/png`, `image/webp` (kiểm tra cả magic bytes, không chỉ header).
- Lưu vào bucket `avatars` (đọc công khai), key ngẫu nhiên; ảnh cũ do hệ thống lưu bị xoá khi thay hoặc xoá avatar. Ảnh Google (URL ngoài) không bị xoá.
- `avatarUrl` trong response là URL công khai đầy đủ.

### Chống brute-force
- Rate limit theo IP cho `register`, `login`, `refresh`, `google/exchange` và các endpoint gửi/nhận mã → `429 rate_limited`.

### Xác minh email & quên mật khẩu *(giai đoạn cuối)*
- Cờ `EMAIL_VERIFICATION_REQUIRED` (mặc định `false` cho tới khi ticket giai đoạn cuối xong). Khi `true`: Account chỉ có Login Provider `password` và chưa xác minh đăng nhập → `403 email_not_verified`.
- Mã 6 chữ số, TTL 10 phút, tối đa 5 lần nhập sai, gửi lại cách nhau ≥ 60 giây, lưu hash.
- `POST /auth/password/forgot` luôn trả 204. Đặt lại mật khẩu thành công → thu hồi mọi refresh token.

## API Contract

Base URL dev: `http://localhost:4000`. Body JSON trừ khi ghi khác. Header `Authorization: Bearer <accessToken>` cho mọi route trừ route đánh dấu 🌐 (public). Lỗi luôn có dạng `{ "code": string, "message": string }`.

### Kiểu dữ liệu

```ts
type Gender = 'female' | 'male' | 'other';
type LoginProviderKind = 'password' | 'google';

interface User {                      // response gộp Account + Profile
  id: string;                         // accountId
  email: string;
  emailVerified: boolean;
  loginProviders: LoginProviderKind[];
  fullName: string;                   // '' khi chưa Onboarding và không có dữ liệu Google
  displayName: string;
  title?: string;
  gender: Gender | null;              // null cho tới khi Onboarding
  avatarUrl?: string;
  onboardingCompletedAt: string | null; // ISO-8601
}

interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: string;                  // hạn của access token, ISO-8601
  refreshToken: string;
  refreshExpiresAt: string;
}
```

### Endpoints

| Method & path | Body / query | Thành công | Lỗi chính |
| --- | --- | --- | --- |
| 🌐 `POST /auth/register` | `{ email, password, remember? }` | `201 AuthSession` | `400 validation`, `409 email_taken`, `429` |
| 🌐 `POST /auth/login` | `{ email, password, remember? }` | `200 AuthSession` | `401 invalid_credentials`, `403 email_not_verified`*, `429` |
| 🌐 `POST /auth/refresh` | `{ refreshToken }` | `200 AuthSession` | `401 unauthorized`, `429` |
| `POST /auth/logout` | `{ refreshToken }` | `204` | — |
| `GET /auth/me` | — | `200 User` | `401` |
| 🌐 `GET /auth/google` | `?remember=true\|false` | `302` → Google | — |
| 🌐 `GET /auth/google/callback` | `?code&state` (Google gửi) | `302` → `${FE_URL}/auth/callback?code=…` | `302` → `…?error=google_failed` |
| 🌐 `POST /auth/google/exchange` | `{ code }` | `200 AuthSession` | `401 invalid_code`, `429` |
| `PATCH /auth/profile` | `{ fullName?, displayName?, title?: string\|null, gender? }` | `200 User` | `400 validation` |
| `POST /auth/profile/avatar` | multipart `file` | `200 User` | `413 file_too_large`, `415 unsupported_file_type` |
| `DELETE /auth/profile/avatar` | — | `200 User` | — |
| 🌐 `POST /auth/email/verify`* | `{ email, code }` | `200 AuthSession` | `400 invalid_code`, `429` |
| 🌐 `POST /auth/email/resend`* | `{ email }` | `204` | `429` |
| 🌐 `POST /auth/password/forgot`* | `{ email }` | `204` | `429` |
| 🌐 `POST /auth/password/reset`* | `{ email, code, newPassword }` | `204` | `400 invalid_code`, `400 validation`, `429` |

\* Giai đoạn cuối.

### Mã lỗi FE cần map thêm
`email_taken`, `onboarding_required`, `email_not_verified`, `invalid_code`, `file_too_large`, `unsupported_file_type`, `rate_limited` (bổ sung vào `ApiErrorCode` và i18n vi/en).

Thay đổi contract **chỉ** qua cập nhật file spec này (do Coordinator duyệt) — cả FE mock lẫn BE bám theo đây.

## Hạ tầng dev

`CuteTeachy-BE/docker-compose.yml`: `postgres` (16), `minio` + `minio-init` (tạo bucket `avatars`, đọc công khai), `mailpit` (SMTP giả + web UI), `api` (profile `app`, thêm ở ticket scaffold). FE chạy ngoài Docker bằng `pnpm dev`. Production: FE và BE trên Vercel (BE serverless — `CuteTeachy-BE/docs/adr/0005-serverless-on-vercel.md`), Postgres trên Supabase qua pooler, lưu file trên **Cloudflare R2** (cùng code qua port `ObjectStorage` chuẩn S3), email qua **Gmail SMTP + App Password**. Cách lấy cấu hình: `CuteTeachy-BE/docs/setup/external-services.md`.

## Testing Decisions

- BE: use case test với fake port (không Nest/DB); e2e cho từng endpoint trong contract với Postgres + MinIO từ docker-compose.
- FE: mock backend phản ánh đúng contract (kể cả mã lỗi); unit test cho refresh single-flight, guard Onboarding, schema mới.
- Tích hợp cuối: FE `NEXT_PUBLIC_API_MODE=http` chạy với BE thật qua các luồng User Stories 1–9.

## Out of Scope

- Đặt mật khẩu cho Account chỉ có Google; huỷ liên kết Login Provider; đổi email; 2FA.
- ~~Đồng bộ cài đặt (ngôn ngữ, push, theme) lên server.~~ — đã chuyển vào phạm vi SPEC-005 cho `locale`, `timeZone`, push (xem `CuteTeachy-BE/docs/ba/ba-backend.md` §4); theme vẫn chỉ lưu trên thiết bị.
- Xử lý riêng cho redirect OAuth trong iOS PWA standalone.
