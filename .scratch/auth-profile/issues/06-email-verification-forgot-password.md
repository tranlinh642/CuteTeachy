# FE-06 (giai đoạn cuối): Nhập mã xác minh email + quên mật khẩu

**What to build:** Giáo viên đăng ký bằng mật khẩu nhập mã 6 số nhận qua email để xác minh (bắt buộc khi BE trả `403 email_not_verified`). Màn đăng nhập có "Quên mật khẩu?" dẫn tới luồng nhận mã và đặt mật khẩu mới.

**Blocked by:** FE-02, FE-03, FE-04, FE-05 (cố ý xếp cuối theo quyết định của người dùng)

**Status:** ready-for-agent

**Đọc:** SPEC-002 mục *Xác minh email & quên mật khẩu*, *API Contract* (các endpoint đánh dấu \*).

**Vùng sở hữu:** route xác minh email, `/forgot-password`, `/reset-password`; mock handler cho 4 endpoint giai đoạn cuối; link "Quên mật khẩu?" (key i18n `auth.login.forgotPassword` đã có); i18n `auth.verify`, `auth.reset`.

- [ ] Login trả `403 email_not_verified` → chuyển tới màn nhập mã kèm email; nhập đúng → nhận `AuthSession`, đi tiếp như đăng nhập thường.
- [ ] Ô nhập mã 6 số (dán được cả chuỗi, bàn phím số trên mobile); "Gửi lại mã" bị khoá 60 giây có đếm ngược.
- [ ] `invalid_code`, `rate_limited` hiện thông báo i18n.
- [ ] Quên mật khẩu: nhập email → luôn báo "nếu email tồn tại, mã đã được gửi" → nhập mã + mật khẩu mới (8–72, nhập lại khớp) → về `/login` với thông báo thành công.
- [ ] Mock backend phục vụ 4 endpoint đúng contract (mã mock cố định để test).
- [ ] Unit test cho schema đặt lại mật khẩu và logic đếm ngược gửi lại.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
