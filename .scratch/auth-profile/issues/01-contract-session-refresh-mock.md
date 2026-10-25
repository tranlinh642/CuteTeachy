# FE-01: Contract SPEC-002 + phiên access/refresh token trên mock backend

**What to build:** FE nói đúng API contract của SPEC-002: kiểu `User`/`AuthSession` mới, mã lỗi mới, phiên lưu cả refresh token, tự gia hạn khi gặp 401 mà người dùng không bị đẩy ra màn đăng nhập, và mock backend phục vụ mọi endpoint auth/profile/avatar của contract. Đây là ticket nền để FE-02..05 chạy song song.

**Blocked by:** None (can start immediately — bám contract trong spec, không chờ BE)

**Status:** done

**Đọc:** SPEC-002 mục *Token*, *API Contract*, *Mã lỗi FE cần map thêm*, *Account & Login Provider* (mật khẩu 8–72).

**Vùng sở hữu:** kiểu dữ liệu dùng chung (user, auth), lớp API (endpoints, services, http client, api-error), session store, mock backend (router, handlers, seed), schema đăng nhập/limits, i18n nhóm `errors`/`auth.errors`. Không làm màn hình mới.

- [ ] `User` thêm `emailVerified`, `loginProviders`, `onboardingCompletedAt`; `gender` thành `Gender | null`. Mọi chỗ đang dùng `user.gender` (selectors danh xưng, theme, form Profile) xử lý được `null` mà không đổi hành vi với user đã có gender; test hiện có vẫn xanh, thêm test cho `null`.
- [ ] `AuthSession` thêm `refreshToken`, `refreshExpiresAt`. Session store lưu refresh token ở storage bền khi `remember = true`, theo phiên khi `false`.
- [ ] HTTP client: gặp 401 trên request có token → gọi `POST /auth/refresh` **một lần duy nhất cho mọi request đang chờ** (single-flight), thành công thì phát lại request, thất bại thì xoá phiên. Unit test cho trường hợp nhiều request 401 cùng lúc chỉ gọi refresh một lần.
- [ ] Logout gửi `refreshToken`; luôn xoá phiên cục bộ.
- [ ] `ApiErrorCode` + i18n vi/en cho: `email_taken`, `onboarding_required`, `email_not_verified`, `invalid_code`, `file_too_large`, `unsupported_file_type`, `rate_limited`.
- [ ] Service FE có hàm cho: `register`, `refresh`, `googleExchange`, `uploadAvatar` (multipart), `deleteAvatar`.
- [ ] Mock backend phục vụ `register`, `login`, `refresh`, `logout`, `me`, `google/exchange`, `PATCH /auth/profile` (kèm rule hoàn tất Onboarding), `POST/DELETE /auth/profile/avatar`, với đúng status + mã lỗi của contract; mock trả `403 onboarding_required` cho route nghiệp vụ khi user chưa hoàn tất Onboarding. Tài khoản demo hiện có giữ trạng thái đã hoàn tất Onboarding.
- [ ] `passwordMin` = 8, thêm giới hạn tối đa 72.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
