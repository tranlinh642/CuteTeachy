# S3-FE-05: Settings đồng bộ server + gửi múi giờ trong Onboarding

**What to build:** Ngôn ngữ, công tắc thông báo và số phút nhắc trước trong Profile được lưu trên server và theo giáo viên sang mọi thiết bị; múi giờ của thiết bị được gửi lên trong lúc Onboarding. Theme vẫn chỉ lưu trên thiết bị.

**Blocked by:** S3-FE-01, auth-profile FE-03 (màn Onboarding)

**Status:** done

**Đọc:** SPEC-003 mục *Kiểu dữ liệu* (Settings), *API* (`/me/settings`), *Thay đổi FE*; User Stories 28–30.

**Vùng sở hữu:** service + hook Settings, phần Cài đặt trong Profile, bước gửi `timeZone` trong Onboarding, mock handler Settings, store preferences (chỉ giữ theme và cờ PWA ở cục bộ).

- [x] Sau đăng nhập, tải Settings; `locale` từ server áp cho i18n.
- [x] Đổi ngôn ngữ / công tắc thông báo / số phút nhắc (5/10/15/30/60) → `PATCH /me/settings` (optimistic, hoàn tác khi lỗi).
- [x] Onboarding gửi `timeZone` lấy từ thiết bị (IANA) cùng lúc hoàn tất.
- [x] Theme không gửi lên server.
- [x] Mock handler: mặc định và validation như SPEC-003.
- [x] Unit test cho hook Settings; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
