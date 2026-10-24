# FE-02: Màn đăng ký tài khoản

**What to build:** Giáo viên mở "Đăng ký" từ màn đăng nhập, nhập email, mật khẩu, nhập lại mật khẩu, chọn ghi nhớ đăng nhập; đăng ký thành công thì được đăng nhập ngay và chuyển sang Onboarding (qua guard của FE-03, hoặc về `/` nếu FE-03 chưa merge).

**Blocked by:** FE-01

**Status:** ready-for-agent

**Đọc:** SPEC-002 mục *Account & Login Provider*, *API Contract* (`register`); thiết kế Stitch màn login (`docs/design/stitch/interactive-login-screen--*.html`) để giữ cùng phong cách.

**Vùng sở hữu:** route `/register` trong nhóm auth, feature auth phần đăng ký (form, hook, schema), link "Chưa có tài khoản? Đăng ký" trên màn đăng nhập, i18n `auth.register`.

- [ ] Validation client: email hợp lệ, mật khẩu 8–72, nhập lại khớp; lỗi hiển thị bằng i18n theo cơ chế `FieldError` hiện có.
- [ ] `409 email_taken` hiển thị thông báo gợi ý đăng nhập; `429 rate_limited` có thông báo riêng.
- [ ] Đã đăng nhập mà vào `/register` → chuyển về `/`.
- [ ] Màn đăng nhập có link sang `/register` (dùng key i18n `auth.login.noAccount`/`signUp` đã có).
- [ ] Đạt chuẩn a11y của dự án: label, vùng chạm ≥ 44px, focus ring.
- [ ] Unit test cho schema đăng ký; chạy được toàn luồng trên mock backend.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
