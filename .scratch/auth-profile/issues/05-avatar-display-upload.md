# FE-05: Hiển thị và upload avatar (Profile + Onboarding)

**What to build:** Avatar hiển thị ảnh thật (`avatarUrl`, kể cả ảnh Google) ở mọi nơi đang hiện avatar, fallback về chữ cái đầu khi không có ảnh hoặc ảnh lỗi. Ở Profile, giáo viên upload ảnh mới hoặc xoá ảnh; ở Onboarding có bước chọn avatar tùy chọn.

**Blocked by:** FE-01, FE-03 (thêm avatar vào form Onboarding)

**Status:** ready-for-agent

**Đọc:** SPEC-002 mục *Avatar*, *API Contract* (`/auth/profile/avatar`).

**Vùng sở hữu:** component `Avatar` (thêm ảnh + fallback), phần avatar trong Profile, phần avatar tùy chọn trong form Onboarding, hook/mutation upload & xoá avatar, i18n `profile.avatar`.

- [ ] `Avatar` nhận `src`, hiện ảnh với `alt` có nghĩa; ảnh lỗi → chữ cái đầu trên nền pastel như hiện tại.
- [ ] Kiểm tra trước khi gửi: ≤ 2 MB, jpeg/png/webp; sai → báo lỗi ngay, không gọi API. Server trả `413`/`415` vẫn hiện đúng thông báo.
- [ ] Đang upload có trạng thái loading; thành công → `User` trong session cập nhật, avatar mới hiện ngay ở Topbar/Sidebar/Profile.
- [ ] Xoá avatar có hộp xác nhận (dùng `ConfirmDialog` sẵn có).
- [ ] Onboarding: chọn avatar là tùy chọn, bỏ qua vẫn hoàn tất được.
- [ ] Unit test cho kiểm tra file phía client; chạy được trên mock backend.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
