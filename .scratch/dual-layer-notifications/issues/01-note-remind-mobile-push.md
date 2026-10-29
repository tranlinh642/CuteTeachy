# 01: S6-FE-01 — Giờ nhắc Ghi chú (`remindTime`), Xin quyền iOS/Android & Nút Gửi thông báo thử

**What to build:** Giáo viên chọn được giờ nhắc (`remindTime`) khi tạo/sửa Ghi chú; trên iOS (mọi trình duyệt Safari/Chrome/Edge/Firefox) và Android có luồng xin quyền thông báo trực quan kèm hướng dẫn cài PWA ra Màn hình chính và nút Gửi thông báo thử ngay trong Cài đặt.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Bổ sung trường chọn giờ nhắc `remindTime` (`TimeField`) vào `NoteDialog`, hiển thị giờ nhắc trên `NoteCard` và cập nhật schema/service/mock của Note.
- [x] Cập nhật `isIosDevice` nhận diện mọi trình duyệt trên iPhone/iPad/iPod (bao gồm cả Chrome `CriOS`, Firefox `FxiOS`, iPadOS) để hiển thị đúng hướng dẫn cài PWA ra Màn hình chính khi chưa ở chế độ `standalone`.
- [x] Hiển thị thẻ/nút bật thông báo trực quan cho Android và iOS (khi đã ở chế độ `standalone`, nút 1 chạm kích hoạt `Notification.requestPermission()`).
- [x] Thêm nút "Gửi thông báo thử" (`POST /push/subscriptions/test`) trong trang Hồ sơ / Cài đặt thông báo kèm phản hồi trạng thái rõ ràng.
- [x] Unit test đầy đủ; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
