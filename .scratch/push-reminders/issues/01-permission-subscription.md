# S5-FE-01: Xin quyền thông báo và đăng ký thiết bị

**What to build:** Giáo viên được giải thích vì sao cần thông báo rồi mới được hỏi quyền; thiết bị đăng ký nhận push với BE; trên iPhone chưa cài PWA thì được hướng dẫn cài trước; đăng xuất thì thiết bị ngừng nhận.

**Blocked by:** S3-FE-05 (Settings — công tắc thông báo, số phút nhắc)

**Status:** in-progress

**Đọc:** SPEC-005 mục *Thay đổi FE*, *API*; User Stories 1–2, 6, 13–14.

**Vùng sở hữu:** hook/luồng xin quyền + đăng ký push, liên kết với banner cài PWA hiện có, bước huỷ đăng ký trong đăng xuất, service push (`vapid-public-key`, `subscriptions`), mock handler push, i18n `push`.

- [ ] Không hỏi quyền khi mở app lần đầu; điểm kích hoạt: bật công tắc thông báo hoặc lời mời sau khi tạo Task có giờ/tiết đầu tiên.
- [ ] Màn giải thích → `Notification.requestPermission` → `pushManager.subscribe` với VAPID public key → `POST /push/subscriptions`.
- [ ] iOS chưa ở chế độ standalone → hướng dẫn "Thêm vào Màn hình chính" thay vì hỏi quyền.
- [ ] Quyền bị từ chối → hướng dẫn bật lại trong cài đặt trình duyệt, không hỏi lặp.
- [ ] Đăng xuất → `DELETE /push/subscriptions` cho endpoint hiện tại trước khi xoá phiên (lỗi mạng không chặn đăng xuất).
- [ ] Tắt công tắc thông báo chỉ đổi Settings, không huỷ subscription.
- [ ] Mock handler đúng contract; unit test cho quyết định "hỏi quyền / hướng dẫn cài / đã từ chối"; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
