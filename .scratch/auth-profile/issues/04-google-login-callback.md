# FE-04: Nút "Tiếp tục với Google" + trang `/auth/callback`

**What to build:** Trên màn đăng nhập và đăng ký có nút "Tiếp tục với Google"; bấm vào thì trình duyệt đi tới BE `GET /auth/google`, quay về `/auth/callback`, FE đổi mã lấy phiên và vào app (hoặc Onboarding nếu chưa hoàn tất). Lỗi thì quay về màn đăng nhập với thông báo thân thiện.

**Blocked by:** FE-01, FE-02 (cần màn đăng ký để gắn nút)

**Status:** done

**Đọc:** SPEC-002 mục *Google OAuth & Account Linking*, *API Contract* (`/auth/google`, `/auth/google/exchange`); ADR BE 0001 (lý do không đặt token trên URL).

**Vùng sở hữu:** component nút Google, route `/auth/callback`, i18n `auth.google`. Chỉ chèn nút vào màn đăng nhập/đăng ký, không sửa logic form của chúng.

- [ ] Nút dẫn tới `${NEXT_PUBLIC_API_URL}/auth/google?remember=<lựa chọn hiện tại>`; lựa chọn `remember` được giữ lại để `/auth/callback` biết lưu phiên ở storage nào.
- [ ] Chế độ mock: nút đi thẳng tới `/auth/callback?code=<mã mock>` để chạy được toàn luồng không cần Google.
- [ ] `/auth/callback?code=` → gọi exchange một lần (không gọi lặp khi re-render/StrictMode), lưu phiên, `router.replace` để xoá mã khỏi lịch sử.
- [ ] `/auth/callback?error=` hoặc exchange lỗi (`invalid_code`, mạng) → về `/login` kèm thông báo i18n.
- [ ] Nút theo hướng dẫn thương hiệu Google (logo, chữ), vùng chạm ≥ 44px, có `aria-label`.
- [ ] Unit test cho xử lý callback (code / error / exchange lỗi).
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
